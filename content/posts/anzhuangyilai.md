---
title: "安装依赖"
date: 2026-04-03
description: "---"
categories: ["PostgreSQL 运维"]
tags: ["VACUUM", "WAL", "内存管理", "分区表", "参数配置", "备份恢复", "安装部署", "执行计划", "监控", "索引", "统计信息", "连接池", "锁", "高可用"]
series: []
---

  # 参考
  [MySQL到PostgreSQL迁移实战指南‌ - Tech Blog (huangque888.com)](https://blog.huangque888.com/archives/61233.html)

#### MySQL到PostgreSQL迁移实战指南‌

---

warning: 这篇文章距离上次修改已过300天，其中的内容可能已经有所变动。

以下指南将系统、详尽地介绍如何将 MySQL 数据库平滑迁移到 PostgreSQL，涵盖从环境准备、模式（Schema）转换、数据搬迁、对象（视图、索引、存储过程等）重写，到测试验证等各个环节。文中包含大量**代码示例**、**ASCII 图解**和**详细说明**，帮助你快速上手并理解每个步骤的原理与注意事项。

---

## 目录

1. [前言与迁移前思考](https://blog.huangque888.com/archives/61233.html#1-%E5%89%8D%E8%A8%80%E4%B8%8E%E8%BF%81%E7%A7%BB%E5%89%8D%E6%80%9D%E8%80%83)
2. [MySQL 与 PostgreSQL 差异概述](https://blog.huangque888.com/archives/61233.html#2-MySQL-%E4%B8%8E-PostgreSQL-%E5%B7%AE%E5%BC%82%E6%A6%82%E8%BF%B0)
    
    1. [数据类型差异](https://blog.huangque888.com/archives/61233.html#21-%E6%95%B0%E6%8D%AE%E7%B1%BB%E5%9E%8B%E5%B7%AE%E5%BC%82)
    2. [自增主键 vs 序列](https://blog.huangque888.com/archives/61233.html#22-%E8%87%AA%E5%A2%9E%E4%B8%BB%E9%94%AE-vs-%E5%BA%8F%E5%88%97)
    3. [SQL 语法差异](https://blog.huangque888.com/archives/61233.html#23-SQL-%E8%AF%AD%E6%B3%95%E5%B7%AE%E5%BC%82)
    4. [函数与存储过程差异](https://blog.huangque888.com/archives/61233.html#24-%E5%87%BD%E6%95%B0%E4%B8%8E%E5%AD%98%E5%82%A8%E8%BF%87%E7%A8%8B%E5%B7%AE%E5%BC%82)
    5. [大小写与标识符引号](https://blog.huangque888.com/archives/61233.html#25-%E5%A4%A7%E5%B0%8F%E5%86%99%E4%B8%8E%E6%A0%87%E8%AF%86%E7%AC%A6%E5%BC%95%E5%8F%B7)
3. [迁移前的准备工作](https://blog.huangque888.com/archives/61233.html#3-%E8%BF%81%E7%A7%BB%E5%89%8D%E7%9A%84%E5%87%86%E5%A4%87%E5%B7%A5%E4%BD%9C)
    
    1. [环境搭建](https://blog.huangque888.com/archives/61233.html#31-%E7%8E%AF%E5%A2%83%E6%90%AD%E5%BB%BA)
    2. [评估与规划](https://blog.huangque888.com/archives/61233.html#32-%E8%AF%84%E4%BC%B0%E4%B8%8E%E8%A7%84%E5%88%92)
        
        - 评估现有 MySQL 对象
        - 确定目标 PostgreSQL 版本与字符集
        - 制定迁移策略（整库 vs 分库；在线 vs 离线）
4. [使用 pgloader 自动化迁移](https://blog.huangque888.com/archives/61233.html#4-%E4%BD%BF%E7%94%A8-pgloader-%E8%87%AA%E5%8A%A8%E5%8C%96%E8%BF%81%E7%A7%BB)
    
    1. [pgloader 简介](https://blog.huangque888.com/archives/61233.html#41-pgloader-%E7%AE%80%E4%BB%8B)
    2. [安装 pgloader](https://blog.huangque888.com/archives/61233.html#42-%E5%AE%89%E8%A3%85-pgloader)
    3. [pgloader 配置文件示例](https://blog.huangque888.com/archives/61233.html#43-pgloader-%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6%E7%A4%BA%E4%BE%8B)
    4. [一键执行迁移](https://blog.huangque888.com/archives/61233.html#44-%E4%B8%80%E9%94%AE%E6%89%A7%E8%A1%8C%E8%BF%81%E7%A7%BB)
    5. [pgloader 运行日志解析](https://blog.huangque888.com/archives/61233.html#45-pgloader-%E8%BF%90%E8%A1%8C%E6%97%A5%E5%BF%97%E8%A7%A3%E6%9E%90)
    6. [pgloader 常见问题与调优](https://blog.huangque888.com/archives/61233.html#46-pgloader-%E5%B8%B8%E8%A7%81%E9%97%AE%E9%A2%98%E4%B8%8E%E8%B0%83%E4%BC%98)
5. [手动迁移：DDL 转换与数据搬迁](https://blog.huangque888.com/archives/61233.html#5-%E6%89%8B%E5%8A%A8%E8%BF%81%E7%A7%BBDDL-%E8%BD%AC%E6%8D%A2%E4%B8%8E%E6%95%B0%E6%8D%AE%E6%90%AC%E8%BF%81)
    
    1. [导出 MySQL 模式](https://blog.huangque888.com/archives/61233.html#51-%E5%AF%BC%E5%87%BA-MySQL-%E6%A8%A1%E5%BC%8F)
    2. [人工转换 DDL 脚本](https://blog.huangque888.com/archives/61233.html#52-%E4%BA%BA%E5%B7%A5%E8%BD%AC%E6%8D%A2-DDL-%E8%84%9A%E6%9C%AC)
        
        - 表结构转换
        - 索引与约束转换
        - 视图与触发器转换
        - 存储过程与函数转换思路
        - 示例：一个简单 DDL 转换案例
    3. [创建 PostgreSQL 模式](https://blog.huangque888.com/archives/61233.html#53-%E5%88%9B%E5%BB%BA-PostgreSQL-%E6%A8%A1%E5%BC%8F)
    4. [导出 MySQL 数据为 CSV](https://blog.huangque888.com/archives/61233.html#54-%E5%AF%BC%E5%87%BA-MySQL-%E6%95%B0%E6%8D%AE%E4%B8%BA-CSV)
    5. [导入 CSV 到 PostgreSQL](https://blog.huangque888.com/archives/61233.html#55-%E5%AF%BC%E5%85%A5-CSV-%E5%88%B0-PostgreSQL)
        
        - 使用 `COPY` 命令加速导入
        - 示例：导入单表数据
    6. [数据验证与一致性校验](https://blog.huangque888.com/archives/61233.html#56-%E6%95%B0%E6%8D%AE%E9%AA%8C%E8%AF%81%E4%B8%8E%E4%B8%80%E8%87%B4%E6%80%A7%E6%A0%A1%E9%AA%8C)
        
        - 行数对比、Checksum 校验
        - 业务测试示例
6. [序列与自增主键处理](https://blog.huangque888.com/archives/61233.html#6-%E5%BA%8F%E5%88%97%E4%B8%8E%E8%87%AA%E5%A2%9E%E4%B8%BB%E9%94%AE%E5%A4%84%E7%90%86)
    
    1. [MySQL AUTO\_INCREMENT 转 PostgreSQL SERIAL/IDENTITY](https://blog.huangque888.com/archives/61233.html#61-MySQL-AUTO_INCREMENT-%E8%BD%AC-PostgreSQL-SERIALIDENTITY)
    2. [手动创建序列示例](https://blog.huangque888.com/archives/61233.html#62-%E6%89%8B%E5%8A%A8%E5%88%9B%E5%BB%BA%E5%BA%8F%E5%88%97%E7%A4%BA%E4%BE%8B)
    3. [同步序列当前值](https://blog.huangque888.com/archives/61233.html#63-%E5%90%8C%E6%AD%A5%E5%BA%8F%E5%88%97%E5%BD%93%E5%89%8D%E5%80%BC)
7. [索引、约束与外键映射](https://blog.huangque888.com/archives/61233.html#7-%E7%B4%A2%E5%BC%95%E7%BA%A6%E6%9D%9F%E4%B8%8E%E5%A4%96%E9%94%AE%E6%98%A0%E5%B0%84)
    
    1. [索引类型对比与语法转换](https://blog.huangque888.com/archives/61233.html#71-%E7%B4%A2%E5%BC%95%E7%B1%BB%E5%9E%8B%E5%AF%B9%E6%AF%94%E4%B8%8E%E8%AF%AD%E6%B3%95%E8%BD%AC%E6%8D%A2)
    2. [唯一约束与主键](https://blog.huangque888.com/archives/61233.html#72-%E5%94%AF%E4%B8%80%E7%BA%A6%E6%9D%9F%E4%B8%8E%E4%B8%BB%E9%94%AE)
    3. [外键约束语法差异](https://blog.huangque888.com/archives/61233.html#73-%E5%A4%96%E9%94%AE%E7%BA%A6%E6%9D%9F%E8%AF%AD%E6%B3%95%E5%B7%AE%E5%BC%82)
8. [视图、触发器、存储过程与函数迁移](https://blog.huangque888.com/archives/61233.html#8-%E8%A7%86%E5%9B%BE%E8%A7%A6%E5%8F%91%E5%99%A8%E5%AD%98%E5%82%A8%E8%BF%87%E7%A8%8B%E4%B8%8E%E5%87%BD%E6%95%B0%E8%BF%81%E7%A7%BB)
    
    1. [视图转换示例](https://blog.huangque888.com/archives/61233.html#81-%E8%A7%86%E5%9B%BE%E8%BD%AC%E6%8D%A2%E7%A4%BA%E4%BE%8B)
    2. [触发器转换示例](https://blog.huangque888.com/archives/61233.html#82-%E8%A7%A6%E5%8F%91%E5%99%A8%E8%BD%AC%E6%8D%A2%E7%A4%BA%E4%BE%8B)
    3. [存储过程与函数重写思路](https://blog.huangque888.com/archives/61233.html#83-%E5%AD%98%E5%82%A8%E8%BF%87%E7%A8%8B%E4%B8%8E%E5%87%BD%E6%95%B0%E9%87%8D%E5%86%99%E6%80%9D%E8%B7%AF)
9. [迁移后测试与性能调优](https://blog.huangque888.com/archives/61233.html#9-%E8%BF%81%E7%A7%BB%E5%90%8E%E6%B5%8B%E8%AF%95%E4%B8%8E%E6%80%A7%E8%83%BD%E8%B0%83%E4%BC%98)
    
    1. [功能测试与回归](https://blog.huangque888.com/archives/61233.html#91-%E5%8A%9F%E8%83%BD%E6%B5%8B%E8%AF%95%E4%B8%8E%E5%9B%9E%E5%BD%92)
    2. [性能基准对比](https://blog.huangque888.com/archives/61233.html#92-%E6%80%A7%E8%83%BD%E5%9F%BA%E5%87%86%E5%AF%B9%E6%AF%94)
    3. [索引与查询优化](https://blog.huangque888.com/archives/61233.html#93-%E7%B4%A2%E5%BC%95%E4%B8%8E%E6%9F%A5%E8%AF%A2%E4%BC%98%E5%8C%96)
10. [生产环境切换注意事项](https://blog.huangque888.com/archives/61233.html#10-%E7%94%9F%E4%BA%A7%E7%8E%AF%E5%A2%83%E5%88%87%E6%8D%A2%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A1%B9)
11. [双写或同步方案](https://blog.huangque888.com/archives/61233.html#101-%E5%8F%8C%E5%86%99%E6%88%96%E5%90%8C%E6%AD%A5%E6%96%B9%E6%A1%88)
12. [停机窗口与回退策略](https://blog.huangque888.com/archives/61233.html#102-%E5%81%9C%E6%9C%BA%E7%AA%97%E5%8F%A3%E4%B8%8E%E5%9B%9E%E9%80%80%E7%AD%96%E7%95%A5)
13. [监控与报警](https://blog.huangque888.com/archives/61233.html#103-%E7%9B%91%E6%8E%A7%E4%B8%8E%E6%8A%A5%E8%AD%A6)
14. [总结与常见坑](https://blog.huangque888.com/archives/61233.html#11-%E6%80%BB%E7%BB%93%E4%B8%8E%E5%B8%B8%E8%A7%81%E5%9D%91)

---

## 1. 前言与迁移前思考

在企业级项目中，随着业务不断扩展，可能会面临以下需求或痛点：

- **数据库扩展性与功能**：PostgreSQL 在复杂查询优化、并发控制、ACID 支持等方面更为健壮，且具备更多高级特性（例如：更强大的 JSON、地理空间扩展、窗口函数等）。
- **成本因素**：一些厂商许可或运维成本等原因，希望从 MySQL 迁移到 PostgreSQL。
- **开源技术选型**：逐步统一技术栈，或出于合规、社区活跃度等考虑。

但是 MySQL 与 PostgreSQL 在数据类型、SQL 语法、特性实现上存在差异，直接“搬数据”往往会出现错误或不一致。因此，迁移前需要做好充分的计划与评估。

### 1.1 迁移前的核心思考

1. **对象清单统计**
    
    - 列出所有表、视图、索引、约束、函数、存储过程、触发器、事件调度等。
    - 确定是否所有对象都需要迁移，或哪些可重写/抛弃。
2. **数据量与业务停机窗口**
    
    - 数据量规模决定迁移方式（在线、离线、增量同步）。
    - 业务是否能短暂停机，或需实现 “双写” 与切换时间窗口。
3. **依赖与兼容性**
    
    - 应用代码（SQL 语句）是否依赖 MySQL 专有语法；例如 `LIMIT offset,count`、`GROUP_CONCAT`、`INSERT ... ON DUPLICATE KEY UPDATE` 等。
    - 需要对 SQL 进行改写或兼容性层（如使用 ORM、数据库抽象层）。
4. **目标特性使用**
    
    - PostgreSQL 强调事务一致性与丰富的扩展（例如：PostGIS、pg\_stat\_statements）。
    - 在迁移过程中，可考虑利用 PostgreSQL 的新特性（如 `JSONB`、`ARRAY`、分区表、CTE、窗口函数等）。
5. **运维与监控**
    
    - 目标环境需搭建 PostgreSQL 集群或 HA 架构（如 Patroni、PgPool-II、pgBouncer）。
    - 监控指标和告警也需从 MySQL 换成 PostgreSQL 对应工具（如 pg\_stat\_activity、Prometheus Exporter 等）。

有了清晰的思考与规划，才能在后续步骤中有的放矢，避免中途反复。

---

## 2. MySQL 与 PostgreSQL 差异概述

在进行迁移前，需要对二者的区别有全面认识，才能针对性地进行转换与调整。下面从数据类型、语法、函数等多个维度进行对比。

### 2.1 数据类型差异

|功能/类型|MySQL|PostgreSQL|备注|
|---|---|---|---|
|整数类型|TINYINT, SMALLINT, MEDIUMINT, INT, BIGINT|SMALLINT, INTEGER, BIGINT|PostgreSQL 没有 MEDIUMINT；TINYINT 在 Pg 中可等价为 SMALLINT|
|浮点/定点类型|FLOAT, DOUBLE, DECIMAL(M,D)|REAL, DOUBLE PRECISION, NUMERIC(precision, scale)|刻度与精度语法稍有不同|
|字符串类型|CHAR(n), VARCHAR(n), TEXT, BLOB|CHAR(n), VARCHAR(n), TEXT, BYTEA|BLOB -> BYTEA|
|日期/时间类型|DATE, DATETIME, TIMESTAMP, TIME, YEAR|DATE, TIMESTAMP [WITHOUT TIME ZONE], TIME, INTERVAL|PostgreSQL 的 TIMESTAMP 默认无时区，可指定 WITH TIME ZONE|
|枚举与集合|ENUM('a','b'), SET('x','y')|无原生 ENUM/SET，需自建 CHECK 约束或使用 DOMAIN|PostgreSQL 自 9.1 支持 CREATE TYPE ... AS ENUM|
|布尔类型|TINYINT(1) / BOOLEAN|BOOLEAN|MySQL 的 BOOLEAN 实际是 TINYINT(1)|
|二进制字符串|BINARY(n), VARBINARY(n), BLOB|BYTEA|
|JSON|JSON|JSONB / JSON|PostgreSQL 推荐使用 JSONB，具备索引支持|
|UUID|无原生支持，用 CHAR(36) 存储|UUID|PostgreSQL 内置 UUID 类型|

#### 示例对比

- **MySQL：**
    
    ```sql
    CREATE TABLE user_info (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        bio TEXT,
        profile_pic BLOB,
        is_active TINYINT(1) DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        balance DECIMAL(10,2),
        preferences JSON
    );
    ```
    
    SQL
    
- **PostgreSQL：**
    
    ```sql
    CREATE TABLE user_info (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        bio TEXT,
        profile_pic BYTEA,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        balance NUMERIC(10,2),
        preferences JSONB
    );
    ```
    
    SQL
    

### 2.2 自增主键 vs 序列

- **MySQL**
    
    ```sql
    CREATE TABLE t1 (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50)
    );
    ```
    
    SQL
    
    插入时可忽略 `id`，自动递增。
    
- **PostgreSQL**  
    早期常用：
    
    ```sql
    CREATE TABLE t1 (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50)
    );
    ```
    
    SQL
    
    `SERIAL` 本质会创建一个关联的序列：
    
    ```sql
    CREATE SEQUENCE t1_id_seq START 1;
    CREATE TABLE t1 (
        id INT NOT NULL DEFAULT nextval('t1_id_seq'),
        name VARCHAR(50),
        PRIMARY KEY (id)
    );
    ALTER SEQUENCE t1_id_seq OWNED BY t1.id;
    ```
    
    SQL
    
    PostgreSQL 10+ 支持更标准的 `IDENTITY`：
    
    ```sql
    CREATE TABLE t1 (
        id INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
        name VARCHAR(50)
    );
    ```
    
    SQL
    

### 2.3 SQL 语法差异

1. **字符串引号**
    
    - MySQL：`'single quotes'`；双引号可用作标识符引号（若开启 ANSI\_QUOTES）。
    - PostgreSQL：`'single quotes'`；双引号仅用于标识符（区分大小写）。
2. **LIMIT 与 OFFSET**
    
    - MySQL：`SELECT * FROM t1 LIMIT 10,20;` 或 `LIMIT 20 OFFSET 10`。
    - PostgreSQL：仅 `SELECT * FROM t1 LIMIT 20 OFFSET 10;`。
3. **INSERT … ON DUPLICATE KEY UPDATE**
    
    - MySQL：
        
        ```sql
        INSERT INTO t1 (id,name) VALUES (1,'A')
        ON DUPLICATE KEY UPDATE name=VALUES(name);
        ```
        
        SQL
        
    - PostgreSQL：等价实现用 `INSERT … ON CONFLICT`：
        
        ```sql
        INSERT INTO t1 (id,name) VALUES (1,'A')
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
        ```
        
        SQL
        
4. **LIMIT 子句位置**
    
    - MySQL：`SELECT ... FOR UPDATE LIMIT 1;`
    - PostgreSQL：不支持 `LIMIT` 在 `FOR UPDATE` 之后；应写作：
        
        ```sql
        SELECT ... LIMIT 1 FOR UPDATE;
        ```
        
        SQL
        
5. **字符串函数差异**
    
    - MySQL：`CONCAT_WS(',', col1, col2)`、`IFNULL(a,b)`、`NOW()`、`UNIX_TIMESTAMP()` 等。
    - PostgreSQL：
        
        - `CONCAT_WS()` 同名但行为略有区别。
        - 等价 `COALESCE(a,b)` 代替 `IFNULL`。
        - `NOW()` 同样存在；`EXTRACT(EPOCH FROM NOW())` 代替 `UNIX_TIMESTAMP()`。
        - `GROUP_CONCAT()` 在 PostgreSQL 中可用 `string_agg(col, ',')`。
6. **事务隔离与锁**
    
    - MySQL 默认隔离级别为 `REPEATABLE READ`；PostgreSQL 默认为 `READ COMMITTED`。
    - MySQL 锁模型中 `UPDATE ... LOCK IN SHARE MODE`；PostgreSQL 是 `FOR SHARE` / `FOR UPDATE`。

### 2.4 函数与存储过程差异

MySQL 用 **Stored Procedure / Function**，语法如：

```sql
DELIMITER //
CREATE PROCEDURE add_user(IN uname VARCHAR(50))
BEGIN
    INSERT INTO users(name) VALUES (uname);
END;
//
DELIMITER ;
```

SQL

PostgreSQL 使用 **PL/pgSQL** 语法：

```sql
CREATE OR REPLACE FUNCTION add_user(uname VARCHAR)
RETURNS VOID AS $$
BEGIN
    INSERT INTO users(name) VALUES (uname);
END;
$$ LANGUAGE plpgsql;
```

SQL

主要差别在于：

- MySQL 用 `DELIMITER` 将语句包裹，而 PostgreSQL 用 `$$` 标识函数体。
- 变量声明、流程控制（IF/LOOP）语法也略有不同，需要重写。

### 2.5 大小写与标识符引号

- **MySQL**
    
    - 表名/列名按文件系统而定（Linux 默认区分大小写，Windows 不区分）。
    - 引用标识符用反引号：\`table\_name\`。
- **PostgreSQL**
    
    - 默认自动将未加双引号的标识符转换为小写；双引号内的标识符才会保留大小写。
    - 建议尽量统一使用全小写表名/列名，避免双引号带来的混乱。

---

## 3. 迁移前的准备工作

### 3.1 环境搭建

- **MySQL 环境**：确认 MySQL 版本（例如 5.7、8.0），并检查是否有自定义插件或功能在迁移中需要特别支持。
- **PostgreSQL 环境**：准备好目标数据库服务器，建议使用类似版本（例如 PostgreSQL 13、14），并设置好管理员账号及密码。
- **网络与访问**：确保 MySQL 与 PostgreSQL 服务器之间网络互通，可通过客户端访问并具备足够权限。
- **工具安装**：建议本机或迁移服务器上安装以下工具：
    
    - `mysqldump`（MySQL 自带）
    - `psql`（PostgreSQL 客户端）
    - **pgloader**（PostgreSQL 迁移神器）
    - `pg_dump`（用于备份测试目标库）
    - `csvkit`、`jq` 等用于数据处理的辅助工具（可选）

### 3.2 评估与规划

1. **导出对象清单**  
    在 MySQL 上运行以下命令，将库中所有表/视图/存储过程等导出清单：
    
    ```bash
    mysql -uroot -p -e "SHOW TABLES IN mydb;" > tables.txt
    mysql -uroot -p -e "SHOW FULL TABLES IN mydb WHERE Table_type = 'VIEW';" > views.txt
    mysql -uroot -p -e "SHOW PROCEDURE STATUS WHERE Db = 'mydb';" > procs.txt
    mysql -uroot -p -e "SHOW TRIGGERS IN mydb;" > triggers.txt
    ```
    
    Bash
    
    将输出结果保存在本地，用于后续分析哪些对象需人工转换。
    
2. **确定迁移策略**
    
    - **整库迁移**：如果是一次性较短停机，直接将整个库导出并导入。
    - **分表/分库迁移**：如果要渐进式或增量迁移，可先将部分表导入 PostgreSQL，待业务允许再切换。
    - **在线迁移**：可以借助 `pgloader` 的增量功能或使用逻辑订阅工具（如 `debezium`、`Bottled Water`）实现 Near Zero Downtime。
3. **制定回退方案**
    
    - 在完成迁移后，若发现业务异常，需要快速回滚到 MySQL；因此要保留 MySQL 库备份，或者保持双写。
    - 记录 PostgreSQL 迁移后数据校验情况＆应用改写情况，确保回退可行。

---

## 4. 使用 pgloader 自动化迁移

`pgloader` 是一款开源工具，可一站式实现从 MySQL（甚至 SQLite、MS SQL 等）迁移到 PostgreSQL，自动转换数据类型、DDL、索引、外键等。推荐在大部分场景下优先尝试 `pgloader`。

### 4.1 pgloader 简介

- **特点**
    
    1. 自动转换 MySQL DDL 为 PostgreSQL DDL，处理常见数据类型差异（如 TINYINT -> SMALLINT、DATETIME -> TIMESTAMP 等）。
    2. 自动导出 MySQL 数据并批量 `COPY` 导入 PostgreSQL，速度远超 `mysqldump` + 手动导入。
    3. 支持增量迁移与断点续传。
    4. 可用纯文本 DSL 配置文件编写迁移规则，也可直接命令行运行。
- **工作流程**
    
    1. 连接 MySQL，读取源库的模式信息与数据。
    2. 在 PostgreSQL 中创建目标库、模式与表结构。
    3. 分批次将源数据导出到临时表或内存，然后使用 PostgreSQL 的 `COPY` 命令导入。
    4. 创建索引、外键、触发器（部分对象需手动后处理）。

```SQL
+-----------+            pgloader           +----------------+
|  MySQL    |  -------------------------->  | PostgreSQL     |
| 源数据库  |    1. 读取 DDL、数据          | 目标数据库      |
|           |                              |                 |
+-----------+            2. 转换 & 导入     +----------------+
```

### 4.2 安装 pgloader

在多数系统中，可通过包管理器安装，也可从源代码编译。以下以 Ubuntu 为例：

```bash
# 安装依赖
sudo apt-get update
sudo apt-get install -y curl git build-essential

# 推荐使用二进制包安装（Ubuntu 20.04+）
sudo apt-get install -y pgloader
```

Bash

或者从源码安装最新版本：

```bash
# 安装 SBCL（Steel Bank Common Lisp）和依赖
sudo apt-get install -y sbcl libsqlite3-dev libmysqlclient-dev libssl-dev make

git clone https://github.com/dimitri/pgloader.git
cd pgloader
make pgloader
sudo make install
```

Bash

安装完成后，可执行：

```bash
pgloader --version
# 示例输出：pgloader version “3.6.2”
```

Bash

### 4.3 pgloader 配置文件示例

创建一个名为 `mysql2pg.load` 的配置文件，内容示例如下（适用于将 MySQL 数据库 `mydb` 迁移到 PostgreSQL 数据库 `pgdb`）：

```lisp
LOAD DATABASE
     FROM mysql://user:****@mysql-host:3306/mydb
     INTO postgresql://user:****@pg-host:5432/pgdb

WITH include drop,         -- 迁移前 DROP 目标表
     create tables,        -- 自动创建表
     create indexes,       -- 自动创建索引
     reset sequences,      -- 根据导入数据重置序列
     data only if exists,  -- 跳过空表
     batch rows = 10000,   -- 每批条数
     concurrency = 4,      -- 并发线程数
     prefetch rows = 1000

CAST
     type datetime to timestamptz drop default drop not null using zero-dates-to-null,
     type date to date drop not null using zero-dates-to-null,
     type tinyint when (= precision 1) to boolean using tinyint-to-boolean,
     type tinyint to smallint,
     type mediumint to integer,
     type int to integer,
     type bigint to bigint,
     type double to double precision,
     type enum to text drop not null,
     type set to text drop not null

 BEFORE LOAD DO
   $$ create schema if not exists public; $$,

AFTER LOAD DO
   $$ ALTER SCHEMA 'public' OWNER TO 'pguser'; $$;
```

Lisp

#### 配置项解释

- `LOAD DATABASE FROM mysql://… INTO postgresql://…`：指定源 MySQL 与目标 PostgreSQL 连接字符串。
- `WITH include drop`：在创建表前如果目标已存在同名表会先执行 `DROP TABLE`，避免冲突。
- `create tables, create indexes`：自动在 PG 中创建 MySQL 对应的表与索引。
- `reset sequences`：导入后重置自增序列，使其值等于最大主键值。
- `batch rows`、`concurrency`：控制导入批量大小与并发度，越大越快，但受限于网络与资源。
- `CAST`：数据类型映射规则，例如 `datetime` 映射到 `timestamptz` 并去除默认值、非空约束，`tinyint(1)` 映射为 `boolean` 等。
- `BEFORE LOAD DO` / `AFTER LOAD DO`：在迁移前/后要执行的 SQL 语句，用于创建模式、调整权限等。

> **Tip**：若你的 MySQL 中有大量 `zero dates`（`0000-00-00`），需要将其映射为 `NULL`，否则 PG 导入会报错，可使用 `using zero-dates-to-null` 这样的转换函数。

将上述保存为 `mysql2pg.load` 后，执行：

```bash
pgloader mysql2pg.load
```

Bash

pgloader 会自动读取并执行迁移过程，整个流程可能会打印大量日志，例如：

```SAS
2023-10-10T10:00:00.123000Z LOG Migrating from #<MYSQL-CONNECTION mysqluser@mysql-host:3306/mydb {10070E70C3}>
2023-10-10T10:00:00.130000Z LOG Migrating into #<PGSQL-CONNECTION pguser@pg-host:5432/pgdb {10070F8913}>
...
2023-10-10T10:02:34.456000Z LOG Create table 'public'.'users'
2023-10-10T10:02:34.789000Z LOG Copying "mydb"."users" with batch size 10000
2023-10-10T10:02:50.123000Z LOG Reset sequence 'users_id_seq'
...
2023-10-10T10:05:12.345000Z LOG Migration finished.
```

### 4.4 一键执行迁移

如果不需要特别的 CAST 规则，也可直接在命令行运行，无需单独配置文件：

```bash
pgloader mysql://user:****@mysql-host:3306/mydb \
         postgresql://user:****@pg-host:5432/pgdb
```

Bash

pgloader 会使用默认规则进行迁移，但对某些数据类型或编码可能不够准确，建议还是写配置文件。

### 4.5 pgloader 运行日志解析

- **“Create table”**：表示为每个 MySQL 表在 PG 中生成对应 DDL。
- **“Copying”**：开始批量将数据导入 PG，后面会打印每批的行数与耗时。
- **“Reset sequence”**：表示已根据目标表的最大主键值，重置序列到合适的起始值。
- **“Create index”/“Create FOREIGN KEY”**：分别为索引与外键创建。

如果日志中有 **“Error”**、**“Warn”** 字样，需要仔细定位并人工处理。例如：

```pgsql
2023-10-10T10:03:22.567000Z ERROR PostgreSQL warning: ERROR:  invalid byte sequence for encoding "UTF8": 0x80
```

此类报错说明字符编码不一致，需要在 CAST 中做额外处理或先清洗数据。

### 4.6 pgloader 常见问题与调优

1. **字符编码问题**
    
    - 如果 MySQL 源库为 `latin1`、`utf8mb4` 等，需要在连接字符串中显式指定编码，例如：
        
        ```SQL
        mysql://user:****@host:3306/mydb?charset=utf8mb4
        ```
        
    - pgloader 默认会将数据以 UTF8 编码传给 PG，若出现无效编码错误，可先在 MySQL 层用 `CONVERT()` 函数清洗或加 `USING` 规则。
2. **大对象导入过慢**
    
    - 若表中有大量 `BLOB` 或 `TEXT`，可通过 `batch rows` 参数减少单批大小或调低并发度。
3. **外键约束导入失败**
    
    - 如果外键关联表尚未创建或创建顺序错误，可在 pgloader 脚本中先禁用外键创建（`with no foreign keys`），待数据导入完成后，再手动在 PG 中创建外键。
4. **触发器与视图不支持自动迁移**
    
    - pgloader 不会自动迁移 MySQL 视图与触发器，需要在迁移后手动转换并在 PG 中重建。
5. **日志容量与磁盘 IO**
    
    - 大规模迁移时会产生大量日志与事务，确保 PG 服务器有充足磁盘空间，并根据需要调整 PG 的 `maintenance_work_mem`、`checkpoint_segments` 等参数。

---

## 5. 手动迁移：DDL 转换与数据搬迁

在某些场景下，无法使用 pgloader 或需要对迁移过程进行精细控制，就必须手动完成模式转换与数据搬迁。下面示例演示整个过程的核心步骤。

### 5.1 导出 MySQL 模式

使用 `mysqldump` 导出不带数据的模式定义（`--no-data`）：

```bash
mysqldump -uroot -p --no-data --routines --triggers mydb > mydb_schema.sql
```

Bash

该文件会包含：

- `CREATE TABLE` 语句
- `CREATE INDEX`
- `CREATE VIEW`
- `DELIMITER` 包裹的存储过程与触发器定义

### 5.2 人工转换 DDL 脚本

打开 `mydb_schema.sql`，逐个 `CREATE` 语句进行调整。以下以示例表 `users` 为例说明常见转换要点。

#### 5.2.1 示例：MySQL 原始 DDL

```sql
-- MySQL 版本
CREATE TABLE `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_email` (`email`),
  KEY `idx_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

SQL

#### 5.2.2 转换为 PostgreSQL DDL

```sql
-- PostgreSQL 版本
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 唯一约束
CREATE UNIQUE INDEX uniq_email ON users(email);

-- 普通索引
CREATE INDEX idx_username ON users(username);
```

SQL

- **去除反引号**，改用小写无引号表名/列名（或用双引号保留大小写）。
- `INT AUTO_INCREMENT` → `SERIAL`（自动创建序列与默认值）。
- `TINYINT(1)` → `BOOLEAN`；且默认值 `1` → `TRUE`。
- `DATETIME` → `TIMESTAMP`，`CHARSET=utf8mb4` 可以忽略，PG 默认 UTF8 即可。
- 将 MySQL 的 `UNIQUE KEY` 与 `KEY` 分别转换为 PostgreSQL 的 `CREATE UNIQUE INDEX` 与 `CREATE INDEX`。

> **注意**：若原表使用了复合索引或全文索引，需检查 PostgreSQL 支持情况并做相应改写；例如：全文索引需要用 `GIN` 或 `GiST` 索引 + `tsvector`。

#### 5.2.3 视图转换示例

MySQL 视图：

```sql
CREATE VIEW user_emails AS
SELECT id, CONCAT(username, '@example.com') AS full_email
FROM users
WHERE is_active = 1;
```

SQL

PostgreSQL 视图：

```sql
CREATE VIEW user_emails AS
SELECT id, username || '@example.com' AS full_email
FROM users
WHERE is_active = TRUE;
```

SQL

- `CONCAT()` → `||` 字符串拼接。
- `is_active = 1` → `is_active = TRUE`。

#### 5.2.4 触发器转换示例

MySQL 触发器：

```sql
DELIMITER //
CREATE TRIGGER before_user_insert
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
  IF NEW.email IS NULL THEN
    SET NEW.email = CONCAT(NEW.username, '@example.com');
  END IF;
END;
//
DELIMITER ;
```

SQL

PostgreSQL 触发器需要先写触发函数，再关联触发器：

```sql
-- 创建触发函数
CREATE OR REPLACE FUNCTION before_user_insert_fn()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NULL THEN
    NEW.email := NEW.username || '@example.com';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 关联触发器
CREATE TRIGGER before_user_insert
BEFORE INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION before_user_insert_fn();
```

SQL

- MySQL `SET NEW.email` → PG `NEW.email :=`。
- `DELIMITER` 概念在 PG 不适用，用 `$$` 或其他界定符标识函数体。

### 5.3 创建 PostgreSQL 模式

将转换后的 DDL 保存为 `pg_schema.sql`，然后在目标 PostgreSQL 上执行：

```bash
psql -U pguser -d pgdb -f pg_schema.sql
```

Bash

验证模式是否正确创建：

```sql
\dt   -- 列出表
\di   -- 列出索引
\dv   -- 列出视图
\df   -- 列出函数
```

SQL

### 5.4 导出 MySQL 数据为 CSV

对于每个表，使用 `SELECT ... INTO OUTFILE` 导出数据为 CSV。例如，将 `users` 表导出：

```sql
-- 在 MySQL 上执行（需确保 MySQL 服务器对 /tmp 目录可写，且客户端有 FILE 权限）
SELECT id, username, email, created_at, is_active
INTO OUTFILE '/tmp/users.csv'
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
FROM users;
```

SQL

执行后，会在 MySQL 服务器的 `/tmp/users.csv` 生成文件。然后通过 `scp` 或其他方式将文件拉到 PostgreSQL 服务器。

> **注意**：如果 MySQL 服务器不在迁移服务器本机，可通过 `mysqldump --tab` 或 `SELECT ... INTO DUMPFILE` 等方式先导出；也可使用客户端 `mysql --batch` 结合重定向生成 CSV。

### 5.5 导入 CSV 到 PostgreSQL

在 PostgreSQL 服务器上，将 `users.csv` 放入某个目录（如 `/var/lib/postgresql/data/`），然后执行：

```sql
-- 登录 PostgreSQL
psql -U pguser -d pgdb

-- 使用 COPY 导入数据
COPY users(id, username, email, created_at, is_active)
FROM '/path/to/users.csv'
DELIMITER ','
CSV HEADER;
```

SQL

**示例**：如果 CSV 第一行并不包含列名，可去掉 `HEADER`，或手动加上列头。

- 如果 `is_active` 导出的是 `0`/`1`，PG 会自动映射为 `TRUE`/`FALSE`。
- 对于日期/时间字段，若有格式兼容问题，可使用 `TO_TIMESTAMP()` 辅助转换，或在导入前清洗 CSV。

### 5.6 数据验证与一致性校验

导入完成后，可通过以下方式检验数据一致性：

1. **行数对比**
    
    ```sql
    -- MySQL 原库（在 MySQL 上执行）
    SELECT COUNT(*) FROM users;
    
    -- PostgreSQL 目标库（在 pg 上执行）
    SELECT COUNT(*) FROM users;
    ```
    
    SQL
    
    两者结果应相同。
    
2. **校验和（Checksum）**  
    对关键列计算校验和：
    
    ```sql
    -- MySQL
    SELECT MD5(GROUP_CONCAT(id,username,email SEPARATOR '|')) AS checksum FROM users;
    
    -- PostgreSQL
    SELECT MD5(string_agg(id || username || email, '|')) AS checksum FROM users;
    ```
    
    SQL
    
    需保证两侧字符串拼接方式一致，再比对 MD5 值。
    
3. **随机抽样比对**
    
    ```sql
    -- MySQL
    SELECT * FROM users ORDER BY RAND() LIMIT 10;
    
    -- PostgreSQL
    SELECT * FROM users ORDER BY RANDOM() LIMIT 10;
    ```
    
    SQL
    
    检查若干随机行数据是否一致。
    
4. **业务测试**
    
    - 运行应用代码或测试脚本，针对核心业务场景做功能性验证。
    - 检查外键约束、触发器逻辑是否生效。

只有在上述验证通过后，才能进入正式切换和上线阶段。

---

## 6. 序列与自增主键处理

MySQL 中的自增主键需要在 PostgreSQL 中映射为序列，以保证插入逻辑一致。

### 6.1 MySQL AUTO\_INCREMENT 转 PostgreSQL SERIAL/IDENTITY

在 MySQL DDL 中：

```sql
CREATE TABLE products (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100),
    price DECIMAL(10,2),
    PRIMARY KEY (id)
);
```

SQL

转换为 PostgreSQL：

```sql
-- 方法一：使用 SERIAL
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    price NUMERIC(10,2)
);

-- 方法二：使用 IDENTITY（PostgreSQL 10+）
CREATE TABLE products (
    id INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    name VARCHAR(100),
    price NUMERIC(10,2)
);
```

SQL

### 6.2 手动创建序列示例

如果不使用 `SERIAL`，也可手动创建序列并指定默认值：

```sql
CREATE SEQUENCE products_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE products (
    id INT NOT NULL DEFAULT nextval('products_id_seq'),
    name VARCHAR(100),
    price NUMERIC(10,2),
    PRIMARY KEY (id)
);

ALTER SEQUENCE products_id_seq OWNED BY products.id;
```

SQL

### 6.3 同步序列当前值

当数据已导入后，需要让序列的起始值大于等于当前表中最大 `id`，否则后续插入会因主键冲突报错。例如，数据导入后：

```sql
SELECT MAX(id) FROM products;  -- 假设返回 125
```

SQL

则执行：

```sql
SELECT setval('products_id_seq', 125);
```

SQL

这样序列下一个值即为 `126`，保证插入不会重复。

---

## 7. 索引、约束与外键映射

### 7.1 索引类型对比与语法转换

- **普通索引**
    
    - MySQL：`KEY idx_name (col1, col2)`
    - PostgreSQL：`CREATE INDEX idx_name ON table(col1, col2);`
- **唯一索引 / 唯一约束**
    
    - MySQL：`UNIQUE KEY uniq_name (col)`
    - PostgreSQL：`CREATE UNIQUE INDEX uniq_name ON table(col);`  
        或者在建表时：`UNIQUE(col)`。
- **全文索引 / 全文搜索**
    
    - MySQL：`FULLTEXT KEY ft_idx (col)`
    - PostgreSQL：需要使用 `GIN` 索引与 `tsvector`，示例：
        
        ```sql
        ALTER TABLE articles ADD COLUMN content_tsv tsvector;
        UPDATE articles SET content_tsv = to_tsvector('english', content);
        CREATE INDEX ft_idx ON articles USING GIN (content_tsv);
        ```
        
        SQL
        
        同时可加触发器保持 `tsvector` 列自动更新。
        

### 7.2 唯一约束与主键

- MySQL：
    
    ```sql
    CREATE TABLE t1 (
      id INT AUTO_INCREMENT,
      email VARCHAR(100),
      PRIMARY KEY(id),
      UNIQUE KEY uniq_email (email)
    );
    ```
    
    SQL
    
- PostgreSQL：
    
    ```sql
    CREATE TABLE t1 (
      id SERIAL PRIMARY KEY,
      email VARCHAR(100) UNIQUE
    );
    ```
    
    SQL
    

### 7.3 外键约束语法差异

- MySQL：
    
    ```sql
    CREATE TABLE orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE NO ACTION
    );
    ```
    
    SQL
    
- PostgreSQL：
    
    ```sql
    CREATE TABLE orders (
      id SERIAL PRIMARY KEY,
      user_id INT,
      CONSTRAINT fk_orders_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE NO ACTION
    );
    ```
    
    SQL
    

两者在外键约束上差异不大，只是语法略有格式不同；要注意在创建顺序上，必须先建被引用表（`users`），再建引用表（`orders`）。

---

## 8. 视图、触发器、存储过程与函数迁移

除了表与数据，业务中常会使用视图（VIEW）、触发器（TRIGGER）、存储过程（PROCEDURE）与函数（FUNCTION）。由于二者平台差异，需要手动重写。

### 8.1 视图转换示例

**MySQL 视图：**

```sql
CREATE VIEW active_users AS
SELECT id, username, email
FROM users
WHERE is_active = 1;
```

SQL

**PostgreSQL 视图：**

```sql
CREATE OR REPLACE VIEW active_users AS
SELECT id, username, email
FROM users
WHERE is_active = TRUE;
```

SQL

- `is_active = 1` → `is_active = TRUE`；
- 建议在 PostgreSQL 中显式使用 `OR REPLACE`，方便后续更新视图。

### 8.2 触发器转换示例

**MySQL 触发器（before insert 示例）：**

```sql
CREATE TRIGGER trg_before_insert_orders
BEFORE INSERT ON orders
FOR EACH ROW
BEGIN
  IF NEW.created_at IS NULL THEN
    SET NEW.created_at = NOW();
  END IF;
END;
```

SQL

**PostgreSQL 触发器：**

```sql
-- 先创建触发函数
CREATE OR REPLACE FUNCTION trg_before_insert_orders_fn()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_at IS NULL THEN
    NEW.created_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 再创建触发器
CREATE TRIGGER trg_before_insert_orders
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION trg_before_insert_orders_fn();
```

SQL

- MySQL 将触发函数与触发器写在同一段；PG 需要先创建函数，再用 `EXECUTE FUNCTION` 关联。

### 8.3 存储过程与函数重写思路

MySQL 存储过程：

```sql
DELIMITER //
CREATE PROCEDURE add_order(IN uid INT, IN amt DECIMAL(10,2))
BEGIN
  INSERT INTO orders(user_id, amount, created_at)
  VALUES(uid, amt, NOW());
  SELECT LAST_INSERT_ID() AS order_id;
END;
//
DELIMITER ;
```

SQL

PostgreSQL 函数：

```sql
CREATE OR REPLACE FUNCTION add_order(uid INT, amt NUMERIC)
RETURNS INT AS $$
DECLARE
  new_id INT;
BEGIN
  INSERT INTO orders(user_id, amount, created_at)
    VALUES(uid, amt, NOW())
    RETURNING id INTO new_id;
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;
```

SQL

- MySQL `LAST_INSERT_ID()` → PostgreSQL `RETURNING id INTO new_id`。
- PL/pgSQL 语法中，参数在函数名后定义，返回类型放在 `RETURNS` 后。
- MySQL 的控制流（IF/LOOP）需按照 PL/pgSQL 格式书写。

---

## 9. 迁移后测试与性能调优

### 9.1 功能测试与回归

1. **基本 CRUD 测试**
    
    - 在 PostgreSQL 上执行典型的增删改查，验证业务逻辑一致性。
    - 示例：
        
        ```sql
        SELECT * FROM users WHERE email LIKE '%@test.com';
        INSERT INTO orders(user_id, amount) VALUES(1, 100.50);
        UPDATE users SET is_active = FALSE WHERE id = 2;
        DELETE FROM sessions WHERE user_id = 3;
        ```
        
        SQL
        
2. **事务测试**
    
    - 验证事务隔离与一致性（PostgreSQL 默认为 `READ COMMITTED`，可设置为 `REPEATABLE READ`/`SERIALIZABLE`）。
    - 示例：
        
        ```sql
        BEGIN;
          SELECT balance FROM accounts WHERE id = 1 FOR UPDATE;
          UPDATE accounts SET balance = balance - 50 WHERE id = 1;
          UPDATE accounts SET balance = balance + 50 WHERE id = 2;
        COMMIT;
        ```
        
        SQL
        
3. **并发压力测试**
    
    - 使用工具（如 `pgbench`、`sysbench`）进行并发测试，模拟真实场景负载，比较 MySQL 与 PostgreSQL 性能差异。
    - 示例 `pgbench`：
        
        ```bash
        pgbench -i -s 10 pgdb     # 初始化表与数据
        pgbench -c 20 -j 4 -T 60 pgdb   # 并发 20 客户端，4 个进程，持续 60 秒
        ```
        
        Bash
        

### 9.2 性能基准对比

- **索引优化**
    
    - PostgreSQL 建议为常用查询字段创建合适的 B-tree、GIN、GiST 索引。
    - 使用 `EXPLAIN ANALYZE` 分析慢查询，调整索引与查询方式。
- **配置调优**
    
    - 根据服务器内存调整以下参数（编辑 `postgresql.conf`）：
        
        ```conf
        shared_buffers = 25%        # 一般为可用内存的 1/4
        work_mem = 16MB             # 根据并发查询复杂度设置
        maintenance_work_mem = 128MB # 用于创建索引、VACUUM
        effective_cache_size = 50%  # 预估操作系统缓存可用空间
        checkpoint_completion_target = 0.7
        wal_buffers = 16MB
        max_wal_size = 1GB
        ```
        
        Conf
        
    - 启用 `pg_stat_statements` 扩展，记录 SQL 执行统计，帮助定位瓶颈：
        
        ```sql
        CREATE EXTENSION pg_stat_statements;
        ```
        
        SQL
        
- **VACUUM 与 ANALYZE**
    
    - 在导入大批量数据后，需执行 `VACUUM ANALYZE` 优化表与更新统计信息：
        
        ```sql
        VACUUM (VERBOSE, ANALYZE) mytable;
        ```
        
        SQL
        
    - 定期运行 `VACUUM`，避免表膨胀。

### 9.3 索引与查询优化

- **使用正确的连接顺序**
    
    - PostgreSQL 查询优化器会自动选择，但对复杂多表 JOIN、子查询，可通过 `EXPLAIN` 查看执行计划。
    - 根据执行计划，可添加组合索引、或对查询重写（如用 CTE、窗口函数代替子查询）。
- **避免过度索引**
    
    - 虽然索引能加速查询，但插入/更新时会增加维护开销。根据业务场景平衡索引数量。
- **分页查询与 LIMIT 优化**
    
    - 大数据量分页时，避免 `OFFSET` 较大带来的性能下降，建议用 `WHERE id > last_id LIMIT n` 方式实现“基于主键”的分页。

---

## 10. 生产环境切换注意事项

### 10.1 双写或同步方案

1. **数据双写**
    
    - 在应用层实现：在业务代码中同时向 MySQL 与 PostgreSQL 写入（先写 MySQL，后写 PG；需处理写失败的异常回滚）。
    - 适用于业务容忍短时间延迟，切换时需保证数据一致。
2. **使用中间件**
    
    - 利用 `Debezium` + Kafka + `Sink Connector` 将 MySQL 二进制日志实时推送到 PostgreSQL，近似实时同步。
    - 或者使用商业化数据同步工具（如 SymmetricDS、DataX、GoldenGate）实现双向同步或单向同步。
3. **切换时强制停止写入**
    
    - 在切换窗口，将业务写入全指向 MySQL，导数据后验证，暂停写入直到应用切换完成。
    - 缺点是业务会有停写窗口。

### 10.2 停机窗口与回退策略

- **停机步骤示例**
    
    1. 将应用的写入切换到 Maintenance 模式或读写分离（只写入 MySQL）。
    2. 运行最后一次增量同步脚本，确保 PostgreSQL 数据与 MySQL 完全一致。
    3. 将应用数据库连接配置切换到 PostgreSQL，执行 Smoke Test。
    4. 如果一切正常，解除 Maintenance；否则，回退到 MySQL 连接，重新评估。
- **回退策略**
    
    - **保留最近快照**：保留最后一次同步后 MySQL 的快照，或保留数据双写日志，以便快速回滚。
    - **读写分离**：将 PostgreSQL 设置为只读，观察一定时间后再完全切换。
    - **日志回放**：若回退，需要保证在迁移后仍能回放 MySQL-binlog（可利用 `mysqlbinlog` 将变更导回 MySQL）。

### 10.3 监控与报警

- **数据库可用性监控**
    
    - 建立对 PostgreSQL 的连接数、事务延迟、死锁、锁等待等指标监控。
    - 使用工具如 `pgwatch2`、`Zabbix`、`Prometheus + Grafana`。
- **应用层监控**
    
    - 监测业务错误率，尤其是切换后是否出现连接错误、查询异常等。
    - 当故障阈值超过预设上限时，自动触发告警并启用回退机制。

---

## 11. 总结与常见坑

### 11.1 迁移常见坑汇总

1. **字符编码不一致**
    
    - MySQL 使用 `latin1` 或 `utf8mb4`，PG 默认 `UTF8`。导入时必须确保编码转换正确，否则会出现乱码或报错。
2. **DATETIME 与 TIMESTAMP 差异**
    
    - MySQL `TIMESTAMP` 会自动以时区存储 & 转换，PG `TIMESTAMP` 默认不带时区，或用 `TIMESTAMP WITH TIME ZONE`。
    - 注意数据中是否存在历史时区影响的时间戳，需要转换。
3. **MySQL 零日期**
    
    - MySQL 中可能存在 `0000-00-00` 或 `0000-00-00 00:00:00`。PG 不支持此类“零”日期，需转换为 `NULL` 或合法日期。
4. **ENUM 与 SET**
    
    - MySQL `ENUM('a','b')` → PG 可用 `CREATE TYPE ... AS ENUM('a','b')`，或直接映射为 `TEXT` + `CHECK`。
    - 如果使用 `SET`，则需转换为数组类型或字符串并自行拆分。
5. **存储过程与函数**
    
    - 需要手动重写，且 PL/pgSQL 语法与 MySQL 存储语言存在差异，常见 `IF`、`LOOP`、`CURSOR`、`HANDLER` 等都要重写。
6. **全文搜索**
    
    - MySQL `FULLTEXT` 索引与 `MATCH ... AGAINST` 语法，PG 需使用 `tsvector` + `GIN` 并用 `to_tsvector()`／`to_tsquery()`。
7. **分页与 LIMIT 语义**
    
    - MySQL `LIMIT offset,count`；PG 只能 `LIMIT count OFFSET offset`。
    - 大量大偏移分页性能差，建议用主键范围分页。
8. **时区与时钟差异**
    
    - PG 默认时区可通过 `SHOW TIMEZONE;` 查看，需要与应用一致。
    - 如果 MySQL 中使用了 `NOW()` 或 `UTC_TIMESTAMP()`，要检查 PG 中等价的 `CURRENT_TIMESTAMP` 是否一致。

### 11.2 迁移建议与最佳实践

1. **先在测试环境做一次全流程演练**
    
    - 不断优化脚本与配置，积累经验，减少生产环境中的未知情况。
2. **通过 pgloader 自动迁移优先**
    
    - 若无法满足业务中所有自定义需求，再采取手动迁移。pgloader 能极大降低工作量与出错率。
3. **分阶段迁移**
    
    - 对于大型数据库，可先迁移非关键表，逐步完善脚本与流程，最后统一切换。
4. **编写迁移 & 验证脚本**
    
    - 将所有导出、转换、导入、验证操作编写成脚本（Bash、Python、Makefile 等），确保可重复执行与回滚。
5. **加强监控**
    
    - 迁移完成后，需要持续关注 PostgreSQL 的性能指标（如 slow queries、锁等待、死锁等），并根据情况优化索引与参数。
6. **培训与文档**
    
    - 由于 PostgreSQL 与 MySQL 在使用习惯与语法细节上存在差别，需要对开发团队与运维团队进行培训，并留存详细的迁移文档。

---

> **ASCII 图解：MySQL → PostgreSQL 整体迁移流程**
> 
> ```Haskell
> +----------------------+        +----------------------+       +----------------------+
> |     MySQL 源库        |  1. 导出 DDL/DATA        |  2. 转换脚本   | PostgreSQL 测试环境    |
> |  （mydb. users, orders）|----------------------->|  （pg_schema.sql）| （pgdb. users, orders）|
> +----------------------+                          +----------------------+
>        |    \                                         ^    /
>        |     \                                        |   /
>        |      \  3. pgloader / 手动导入 CSV/DDL         |  /
>        v       \                                      | /
> +----------------------+       4. 验证与测试         +----------------------+
> |   PostgreSQL 目标库    |<---------------------------|   QA/开发/测试环境     |
> |    （pgdb. users, orders）|                          |   （功能回归与性能验证） |
> +----------------------+       5. 生产切换/监控      +----------------------+
> ```

---

通过上述指南，你已掌握从 MySQL 到 PostgreSQL 迁移的全流程：包括**自动化迁移**（pgloader）、**手动迁移**（DDL 转换 + CSV 导入）、**数据校验**、**对象重写**、和**测试验证**等关键环节。迁移后通过**性能优化**与**监控**，可以让业务平稳在 PostgreSQL 上运行。