---
title: "PostgreSQL 15.7 CDC → Flink → Kafka 实验"
date: 2026-05-24
description: "在openEuler环境下，从源码编译PostgreSQL 15.7，搭建Flink+Kafka实时CDC管道，实现增量数据同步的完整实验指南"
categories: ["PostgreSQL 案例"]
tags: ["PostgreSQL", "CDC", "Flink", "Kafka", "逻辑复制", "pgoutput"]
series: []
---

> 适用环境：openEuler 22.03 (LTS-SP4) x86_64

---

## 版本选型

| 组件 | 版本 | 说明 |
|------|------|------|
| PostgreSQL | 15.7 | 源码编译安装 |
| Kafka | 3.9.0 | 使用 KRaft 模式（无需 ZooKeeper） |
| Flink | 1.18.1 | 流处理引擎 |
| Java | OpenJDK 11 | Flink / Kafka 运行依赖 |
| Flink CDC | 3.2.1 | PostgreSQL CDC 连接器 |

---

## 第一步：环境准备（安装依赖）

```bash
# 安装编译 PostgreSQL 所需的依赖
dnf install -y gcc gcc-c++ make readline-devel zlib-devel bison flex perl

# 安装 Java 11（Flink & Kafka 运行所需）
dnf install -y java-11-openjdk java-11-openjdk-devel


# 验证
java -version
javac -version

# 设置 JAVA_HOME（可选，但建议设置）
echo 'export JAVA_HOME=/usr/lib/jvm/java-11-openjdk' >> ~/.bashrc
echo 'export PATH=$JAVA_HOME/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

##  如果没有 jdk11
* 下载 Eclipse Temurin OpenJDK 11（免安装版）
```bash
cd /opt
wget https://github.com/adoptium/temurin11-binaries/releases/download/jdk-11.0.22%2B7/OpenJDK11U-jdk_x64_linux_hotspot_11.0.22_7.tar.gz

tar -xzf OpenJDK11U-jdk_x64_linux_hotspot_11.0.22_7.tar.gz
mv jdk-11.0.22+7 /opt/jdk-11
```
## 设置环境变量（替换之前用 dnf 安装的 Java 8）
```bash
cat >> ~/.bashrc << 'EOF'
export JAVA_HOME=/opt/jdk-11
export PATH=$JAVA_HOME/bin:$PATH
EOF
source ~/.bashrc
```

## 验证
```bash
java -version
# 预期: openjdk version "11.0.22" ...
```
---
## 第二步：源码编译安装 PostgreSQL 15.7

```bash
# 创建源码目录
mkdir -p /opt/src && cd /opt/src

# 下载 PostgreSQL 15.7 源码
wget https://ftp.postgresql.org/pub/source/v15.7/postgresql-15.7.tar.gz
tar -xzf postgresql-15.7.tar.gz
cd postgresql-15.7

# 编译配置（安装到 /postgresql/pgsql）
./configure --prefix=/postgresql/pgsql

# 编译 - 使用4个并行任务
make -j4

# 安装
make install

# 创建 postgres 用户
useradd -r -s /bin/bash -m -d /home/postgres postgres

# 创建数据目录
mkdir -p /postgresql/pgsql/data
chown -R postgres:postgres /postgresql/pgsql/data

# 设置环境变量（写入 postgres 用户和 root 用户的 bashrc）
cat >> /home/postgres/.bashrc << 'EOF'
export PGHOME=/postgresql/pgsql
export PGDATA=/postgresql/pgsql/data
export PATH=$PGHOME/bin:$PATH
export LD_LIBRARY_PATH=$PGHOME/lib:$LD_LIBRARY_PATH
EOF

cat >> /root/.bashrc << 'EOF'
export PGHOME=/postgresql/pgsql
export PGDATA=/postgresql/pgsql/data
export PATH=$PGHOME/bin:$PATH
export LD_LIBRARY_PATH=$PGHOME/lib:$LD_LIBRARY_PATH
EOF
source /root/.bashrc

# 初始化数据库
su - postgres -c "/postgresql/pgsql/bin/initdb -D /postgresql/pgsql/data"

# 启动 PostgreSQL
su - postgres -c "/postgresql/pgsql/bin/pg_ctl -D /postgresql/pgsql/data -l /postgresql/pgsql/data/pg.log start"

# 验证连接
su - postgres -c "/postgresql/pgsql/bin/psql -c 'SELECT version();'"
```

### 配置 PostgreSQL 支持逻辑复制（CDC 核心）

```bash
# 编辑 postgresql.conf
cat >> /postgresql/pgsql/data/postgresql.conf << 'EOF'

# ===== CDC 逻辑复制配置 =====
wal_level = logical              # WAL 级别设为 logical
max_wal_senders = 10             # 最大 WAL 发送进程数
max_replication_slots = 10       # 最大复制槽数
wal_sender_timeout = 60s
listen_addresses = '*'           # 允许远程连接（同一机器可不用）
EOF

# 配置 pg_hba.conf，允许本地和远程连接（replication 连接）
echo "local   replication   all                     trust" >> /postgresql/pgsql/data/pg_hba.conf  
echo "host    replication   all   0.0.0.0/0          trust" >> /postgresql/pgsql/data/pg_hba.conf
echo "local   all           all                     trust" >> /postgresql/pgsql/data/pg_hba.conf
echo "host    all           all   127.0.0.1/32       trust" >> /postgresql/pgsql/data/pg_hba.conf

# 重启 PostgreSQL 使配置生效
su - postgres -c "/postgresql/pgsql/bin/pg_ctl -D /postgresql/pgsql/data -l /postgresql/pgsql/data/pg.log restart"

# 验证 wal_level
su - postgres -c "/postgresql/pgsql/bin/psql -c 'SHOW wal_level;'"
# 预期输出: logical
```

### 创建测试数据库和表

```bash
su - postgres -c "/postgresql/pgsql/bin/psql" << 'EOF'
-- 创建测试数据库
CREATE DATABASE cdc_test;

\c cdc_test

-- 创建测试表
CREATE TABLE orders (
    id          SERIAL PRIMARY KEY,
    order_no    VARCHAR(50) NOT NULL,
    user_id     INT NOT NULL,
    amount      DECIMAL(10, 2) NOT NULL,
    status      VARCHAR(20) DEFAULT 'pending',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入一些测试数据
INSERT INTO orders (order_no, user_id, amount) VALUES ('ORD-001', 1001, 99.90);
INSERT INTO orders (order_no, user_id, amount) VALUES ('ORD-002', 1002, 199.50);
INSERT INTO orders (order_no, user_id, amount) VALUES ('ORD-003', 1003, 299.00);

-- 创建发布（Publication）用于 CDC
CREATE PUBLICATION cdc_pub FOR TABLE orders;

-- 验证发布
SELECT * FROM pg_publication;

-- 给 Flink CDC 用户创建复制槽的权限（使用 postgres 超级用户即可）
-- 如果希望单独用户，可执行：
-- CREATE USER flink_cdc WITH REPLICATION LOGIN PASSWORD 'flink_cdc_123';
-- GRANT CONNECT ON DATABASE cdc_test TO flink_cdc;
-- GRANT USAGE ON SCHEMA public TO flink_cdc;
-- GRANT SELECT ON orders TO flink_cdc;
EOF

# ★ 关键：必须设置 REPLICA IDENTITY FULL，否则 UPDATE/DELETE 的 CDC 事件中 before 字段为 null ★
su - postgres -c "/postgresql/pgsql/bin/psql -d cdc_test -c \"ALTER TABLE orders REPLICA IDENTITY FULL;\""

# 验证
su - postgres -c "/postgresql/pgsql/bin/psql -d cdc_test -c \"\\d+ orders\""
```

---

## 第三步：安装 Kafka（KRaft 模式，无需 ZooKeeper）

```bash
# 下载 Kafka 3.9.0
cd /opt
# wget https://dlcdn.apache.org/kafka/3.9.0/kafka_2.13-3.9.0.tgz
wget https://archive.apache.org/dist/kafka/3.9.0/kafka_2.13-3.9.0.tgz
tar -xzf kafka_2.13-3.9.0.tgz
mv kafka_2.13-3.9.0 /opt/kafka

# 设置环境变量
cat >> ~/.bashrc << 'EOF'
export KAFKA_HOME=/opt/kafka
export PATH=$KAFKA_HOME/bin:$PATH
EOF
source ~/.bashrc
```

### 配置 KRaft 模式

```bash
# 生成集群 UUID
KAFKA_CLUSTER_ID=$($KAFKA_HOME/bin/kafka-storage.sh random-uuid)
echo "Kafka Cluster ID: $KAFKA_CLUSTER_ID"

# 格式化存储目录
$KAFKA_HOME/bin/kafka-storage.sh format -t $KAFKA_CLUSTER_ID -c $KAFKA_HOME/config/kraft/server.properties
```

### 修改 Kafka KRaft 配置

```bash
# 备份原始配置
cp /opt/kafka/config/kraft/server.properties /opt/kafka/config/kraft/server.properties.bak

# 修改关键配置
# 修复 Kafka 配置（添加 CONTROLLER 安全协议映射）
# 先获取本机实际 IP
SERVER_IP=$(ip addr show | grep 'inet ' | grep -v '127.0.0.1' | head -1 | awk '{print $2}' | cut -d/ -f1)
echo "本机 IP: $SERVER_IP"

# 配置：listeners 用 0.0.0.0 监听所有网卡，advertised.listeners 用真实 IP
cat > /opt/kafka/config/kraft/server.properties << EOF
process.roles=broker,controller
node.id=1
controller.quorum.voters=1@${SERVER_IP}:9093

# ★ bind 用 0.0.0.0，广播用真实 IP ★
listeners=PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093
advertised.listeners=PLAINTEXT://${SERVER_IP}:9092,CONTROLLER://${SERVER_IP}:9093

controller.listener.names=CONTROLLER
listener.security.protocol.map=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT,SSL:SSL,SASL_PLAINTEXT:SASL_PLAINTEXT,SASL_SSL:SASL_SSL

log.dirs=/tmp/kafka-logs

num.partitions=3
num.network.threads=3
num.io.threads=8
socket.send.buffer.bytes=102400
socket.receive.buffer.bytes=102400
socket.request.max.bytes=104857600
offsets.topic.replication.factor=1
transaction.state.log.replication.factor=1
transaction.state.log.min.isr=1
EOF

# 重新格式化并启动
rm -rf /tmp/kafka-logs
KAFKA_CLUSTER_ID=$($KAFKA_HOME/bin/kafka-storage.sh random-uuid)
$KAFKA_HOME/bin/kafka-storage.sh format -t $KAFKA_CLUSTER_ID -c $KAFKA_HOME/config/kraft/server.properties

nohup $KAFKA_HOME/bin/kafka-server-start.sh /opt/kafka/config/kraft/server.properties > /tmp/kafka.log 2>&1 &

sleep 10

# 验证 Kafka 是否启动成功
nc -zv localhost 9092
# 预期输出: Ncat: Connected to ::1:9092.
# 如果返回 Connected，说明 Kafka 正常

# 创建实验用的 topic：cdc_orders_output（3 个分区，1 个副本）
$KAFKA_HOME/bin/kafka-topics.sh --create \
  --bootstrap-server localhost:9092 \
  --topic cdc_orders_output \
  --partitions 3 \
  --replication-factor 1

# 查看 topic 列表
$KAFKA_HOME/bin/kafka-topics.sh --list --bootstrap-server localhost:9092

# 启动一个 console consumer 来实时查看 CDC 数据（在另一个终端运行，或后台运行）
nohup $KAFKA_HOME/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic cdc_orders_output \
  --from-beginning > /tmp/kafka_cdc_consumer.log 2>&1 &

echo "Kafka 搭建完成！"
```

---

## 第四步：安装 Flink 1.18.1

```bash
# 下载 Flink
cd /opt
wget https://dlcdn.apache.org/flink/flink-1.18.1/flink-1.18.1-bin-scala_2.12.tgz
tar -xzf flink-1.18.1-bin-scala_2.12.tgz
mv flink-1.18.1 /opt/flink

# 设置环境变量
cat >> ~/.bashrc << 'EOF'
export FLINK_HOME=/opt/flink
export PATH=$FLINK_HOME/bin:$PATH
EOF
source ~/.bashrc
```

### 启动 Flink 集群

```bash
# 修改 Flink 配置（调整内存等）
sed -i 's/jobmanager.memory.process.size: 1600m/jobmanager.memory.process.size: 1024m/' /opt/flink/conf/flink-conf.yaml
sed -i 's/taskmanager.memory.process.size: 1728m/taskmanager.memory.process.size: 1024m/' /opt/flink/conf/flink-conf.yaml
# 并行度设为 1（实验环境）
echo "parallelism.default: 1" >> /opt/flink/conf/flink-conf.yaml

# 启动 Flink 集群
$FLINK_HOME/bin/start-cluster.sh

# 验证 Flink 是否启动
sleep 5
curl -s http://localhost:8081/overview | python3 -m json.tool 2>/dev/null || jq '.' 2>/dev/null

echo "Flink Web UI: http://$(hostname -I | awk '{print $1}'):8081"
echo "Flink 集群搭建完成！"
```

---

## 第五步：下载 CDC & Kafka 连接器 Jar 包

```bash
# 下载 Flink CDC 连接器
cd /opt/flink/lib/

# Flink PostgreSQL CDC Connector
wget https://repo1.maven.org/maven2/org/apache/flink/flink-sql-connector-postgres-cdc/3.2.1/flink-sql-connector-postgres-cdc-3.2.1.jar

# Flink Kafka Connector
wget https://repo1.maven.org/maven2/org/apache/flink/flink-sql-connector-kafka/3.2.0-1.18/flink-sql-connector-kafka-3.2.0-1.18.jar

# 验证 jar 包
ls -lh /opt/flink/lib/flink-sql-connector-*.jar

echo "连接器 jar 包下载完成！请重启 Flink 集群使 jar 生效"
```

### 重启 Flink 使 jar 包生效

```bash
$FLINK_HOME/bin/stop-cluster.sh
sleep 3
$FLINK_HOME/bin/start-cluster.sh
sleep 5

# 验证
curl -s http://localhost:8081/overview | python3 -m json.tool 2>/dev/null
```

---

## 第六步：启动 Flink SQL CDC 任务

### 方式一：通过 Flink SQL Client 交互式执行（推荐实验）

```bash
# 启动 Flink SQL Client
$FLINK_HOME/bin/sql-client.sh
```

在 SQL Client 中逐条执行以下 SQL：

```sql
-- 1. 设置 checkpoint 间隔（CDC 必须）
SET 'execution.checkpointing.interval' = '3s';

-- 2. 创建 PostgreSQL CDC 源表
-- 注意：请根据实际情况修改 hostname 和密码
DROP TABLE IF EXISTS orders_source;

CREATE TABLE orders_source (
    id          INT,
    order_no    STRING,
    user_id     INT,
    amount      DECIMAL(10, 2),
    status      STRING,
    created_at  TIMESTAMP(3),
    PRIMARY KEY (id) NOT ENFORCED
) WITH (
    'connector' = 'postgres-cdc',
    'hostname' = 'localhost',
    'port' = '5432',
    'username' = 'postgres',
    'password' = 'paswd',
    'database-name' = 'cdc_test',
    'schema-name' = 'public',
    'table-name' = 'orders',
    'slot.name' = 'flink_cdc_slot',
    'decoding.plugin.name' = 'pgoutput'
);



-- 3. 创建 Kafka 输出表
CREATE TABLE orders_sink (
    id          INT,
    order_no    STRING,
    user_id     INT,
    amount      DECIMAL(10, 2),
    status      STRING,
    created_at  TIMESTAMP(3),
    PRIMARY KEY (id) NOT ENFORCED
) WITH (
    'connector' = 'kafka',
    'topic' = 'cdc_orders_output',
    'properties.bootstrap.servers' = 'localhost:9092',
    'properties.group.id' = 'flink-cdc-group',
    'format' = 'debezium-json',
    'scan.startup.mode' = 'earliest-offset'
);

-- 4. 启动 CDC 同步任务（将 CDC 数据写入 Kafka）
INSERT INTO orders_sink SELECT * FROM orders_source;
```

### 方式二：一键脚本方式（非交互式）

创建一个 SQL 文件，然后提交：

```bash
# 创建 SQL 文件
cat > /tmp/cdc_job.sql << 'SQLEOF'
SET 'execution.checkpointing.interval' = '3s';

CREATE TABLE orders_source (
    id          INT,
    order_no    STRING,
    user_id     INT,
    amount      DECIMAL(10, 2),
    status      STRING,
    created_at  TIMESTAMP(3),
    PRIMARY KEY (id) NOT ENFORCED
) WITH (
    'connector' = 'postgres-cdc',
    'hostname' = 'localhost',
    'port' = '5432',
    'username' = 'postgres',
    'password' = '',
    'database-name' = 'cdc_test',
    'schema-name' = 'public',
    'table-name' = 'orders',
    'slot.name' = 'flink_cdc_slot',
    'decoding.plugin.name' = 'pgoutput'
);

DROP TABLE IF EXISTS orders_sink;

CREATE TABLE orders_sink (
    id          INT,
    order_no    STRING,
    user_id     INT,
    amount      DECIMAL(10, 2),
    status      STRING,
    created_at  TIMESTAMP(3),
    PRIMARY KEY (id) NOT ENFORCED
) WITH (
    'connector' = 'kafka',
    'topic' = 'cdc_orders_output',
    'properties.bootstrap.servers' = 'localhost:9092',
    'properties.group.id' = 'flink-cdc-group',
    'format' = 'debezium-json',
    'scan.startup.mode' = 'earliest-offset'
);

INSERT INTO orders_sink SELECT * FROM orders_source;
SQLEOF

# 提交 Flink SQL 任务
$FLINK_HOME/bin/sql-client.sh -f /tmp/cdc_job.sql
```

---

## 第七步：验证 CDC 数据流

### 7.1 查看 Kafka Consumer 输出

```bash
# 在新终端中查看 Kafka 消费的数据（从最早开始消费）
$KAFKA_HOME/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic cdc_orders_output \
  --from-beginning
```

你应该能看到类似以下的 CDC 数据（Debezium JSON 格式）：

```json
{
  "before": null,
  "after": {
    "id": 1,
    "order_no": "ORD-001",
    "user_id": 1001,
    "amount": 99.90,
    "status": "pending",
    "created_at": "2026-05-24T12:00:00Z"
  },
  "source": {
    "version": "...",
    "connector": "postgresql",
    "name": "cdc_test",
    "schema": "public",
    "table": "orders",
    ...
  },
  "op": "r",
  "ts_ms": ...
}
```

### 7.2 在 PostgreSQL 中执行 DML 操作观察实时同步

```bash
# 登录 PostgreSQL
su - postgres -c "/postgresql/pgsql/bin/psql -d cdc_test"
```

执行以下 SQL，观察 Kafka Consumer 终端是否实时收到变化数据：

```sql
-- INSERT：新增一条订单
INSERT INTO orders (order_no, user_id, amount, status) VALUES ('ORD-004', 1004, 450.00, 'confirmed');

-- UPDATE：更新订单状态
UPDATE orders SET status = 'shipped' WHERE order_no = 'ORD-001';

-- DELETE：删除一条订单
DELETE FROM orders WHERE order_no = 'ORD-003';
```

每次执行后，Kafka Consumer 终端应该立即收到对应的 CDC 变更事件：
- INSERT 事件：`"op": "c"` (create)
- UPDATE 事件：`"op": "u"` (update)，包含 `before` 和 `after`
- DELETE 事件：`"op": "d"` (delete)，`after` 为 null

### 7.3 通过 Flink Web UI 查看任务状态

```bash
# 查看 Flink Web UI（用浏览器打开）
echo "Flink Dashboard: http://$(hostname -I | awk '{print $1}'):8081"
```

在 Web UI 中可以看到：
- 运行的 Job 详情
- Source/Sink 的吞吐量
- Checkpoint 状态
- Task 分布

### 7.4 查看复制槽状态

```bash
su - postgres -c "/postgresql/pgsql/bin/psql -c 'SELECT slot_name, slot_type, database, active, restart_lsn FROM pg_replication_slots;'"
```

---

## 第八步：常用管理命令

```bash
# ===== PostgreSQL =====
# 启动 PostgreSQL
su - postgres -c "/postgresql/pgsql/bin/pg_ctl -D /postgresql/pgsql/data -l /postgresql/pgsql/data/pg.log start"

# 停止 PostgreSQL
su - postgres -c "/postgresql/pgsql/bin/pg_ctl -D /postgresql/pgsql/data stop"

# 重启 PostgreSQL
su - postgres -c "/postgresql/pgsql/bin/pg_ctl -D /postgresql/pgsql/data restart"

# 查看 PostgreSQL 状态
su - postgres -c "/postgresql/pgsql/bin/pg_ctl -D /postgresql/pgsql/data status"

# ===== Kafka =====
# 启动 Kafka
nohup $KAFKA_HOME/bin/kafka-server-start.sh /opt/kafka/config/kraft/server.properties > /tmp/kafka.log 2>&1 &

# 停止 Kafka
$KAFKA_HOME/bin/kafka-server-stop.sh

# 查看 topic 信息
$KAFKA_HOME/bin/kafka-topics.sh --describe --bootstrap-server localhost:9092 --topic cdc_orders_output

# ===== Flink =====
# 启动
$FLINK_HOME/bin/start-cluster.sh

# 停止
$FLINK_HOME/bin/stop-cluster.sh

# 查看运行中的 Job
$FLINK_HOME/bin/flink list

# 取消某个 Job（替换 job_id）
# $FLINK_HOME/bin/flink cancel <job_id>

# ===== 查看所有进程 =====
jps -l
```

---

## 实验架构图

```
┌──────────────┐     CDC (pgoutput)     ┌──────────────┐     Kafka Sink     ┌──────────────┐
│              │  ──────────────────►   │              │  ──────────────►  │              │
│  PostgreSQL  │   logical decoding     │    Flink     │   debezium-json   │    Kafka     │
│  (pgoutput)   │                       │  CDC Job     │                   │   Topic      │
│              │                        │              │                   │              │
└──────────────┘                        └──────────────┘                   └──────────────┘
  WAL Level: logical                    实时捕获变更                         cdc_orders_output
  Publication: cdc_pub                                                       3 partitions
  Slot: flink_cdc_slot                                                       debezium-json format
```

---

## 故障排查

### 1. Java 版本不对
```bash
# 确保使用 Java 11
java -version
# 如果安装了多个 Java 版本，使用 alternatives 切换
alternatives --config java
```

### 2. Flink 启动失败
```bash
# 查看日志
tail -100 /opt/flink/log/flink-*-standalonesession-*.log
# 常见问题：端口被占用，修改端口
# sed -i 's/rest.port: 8081/rest.port: 18081/' /opt/flink/conf/flink-conf.yaml
```

### 3. CDC 连接失败
```bash
# 检查 PostgreSQL WAL 级别
su - postgres -c "/postgresql/pgsql/bin/psql -c 'SHOW wal_level;'"
# 必须是 logical

# 检查复制槽
su - postgres -c "/postgresql/pgsql/bin/psql -c 'SELECT * FROM pg_replication_slots;'"

# 检查发布
su - postgres -c "/postgresql/pgsql/bin/psql -c 'SELECT * FROM pg_publication;'"

# Flink 日志
tail -200 /opt/flink/log/flink-*-taskexecutor-*.log | grep -i error
```

### 4. Kafka Consumer 没有数据
```bash
# 检查 topic 是否存在
$KAFKA_HOME/bin/kafka-topics.sh --list --bootstrap-server localhost:9092

# 查看 topic 消息数
$KAFKA_HOME/bin/kafka-run-class.sh kafka.tools.GetOffsetShell \
  --broker-list localhost:9092 --topic cdc_orders_output
```

### 5. 端口冲突
```bash
# 查看端口占用
netstat -tlnp | grep -E "5432|9092|8081"
```

---

## 清理实验环境

```bash
# 停止 Flink
$FLINK_HOME/bin/stop-cluster.sh

# 停止 Kafka
$KAFKA_HOME/bin/kafka-server-stop.sh

# 停止 PostgreSQL
su - postgres -c "/postgresql/pgsql/bin/pg_ctl -D /postgresql/pgsql/data stop"
```


