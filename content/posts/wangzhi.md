---
title: "网址"
date: 2024-08-30
description: "www.itpux4401.com"
categories: ["PostgreSQL 培训"]
tags: ["VACUUM", "WAL", "内存管理", "参数配置", "备份恢复", "安装部署", "流复制", "索引", "统计信息", "角色", "逻辑复制", "锁", "风哥"]
series: []
---

# 网址
[PostgreSQL数据库培训（PG DBA Part03）_其他学习路线-51CTO学堂](https://edu.51cto.com/topic/5952.html#download)


# 07 08 09 10 密码分别如下
www.itpux4401.com
www.itpux4402.com
www.itpux4403.com
www.itpux4404.com
www.itpux5502.com


11 到 20 
www.itpux5502.com
www.itpux5503.com
www.itpux5504.com

www.itpux6601.com
www.itpux6602.com
www.itpux6603.com
www.itpux6604.com
www.itpux6605.com
www.itpux6606.com

# redis
```bash
redis:www.fgedu.net.cn
```




![](401_pgdba培训_07%20.pdf)

```bash
/postgresql/app/postgresql/bin/initdb -D /postgresql/data -E UTF 8 --lc-collate=C
--lc-ctype=en_US. utf 8 -U postgres

```
![](402_pgdba培训_08.pdf)


![](403_pgdba培训_09%20.pdf)

![](404_pgdba%20培训_10.pdf)

# PG SQL  处理逻辑顺序
![](/images/Pasted%20image%2020230724135515.png)

![](/images/Pasted%20image%2020230724142304.png)


![](/images/Pasted%20image%2020230724142514.png)


![](/images/Pasted%20image%2020230724143202.png)

1.2查数据; 3 查 schema; 4 查用户

![](/images/Pasted%20image%2020230724143610.png)

![](/images/Pasted%20image%2020230724144320.png)

![](/images/Pasted%20image%2020230724144304.png)

# vm 文件
![](/images/Pasted%20image%2020230724144758.png)

# PG 物理存储结构
![](/images/Pasted%20image%2020230724145233.png)

![](/images/Pasted%20image%2020230724150504.png)
![](/images/Pasted%20image%2020230724150510.png)

![](/images/Pasted%20image%2020230724150555.png)

![](/images/Pasted%20image%2020230724150615.png)

![](/images/Pasted%20image%2020230724150847.png)
![](/images/Pasted%20image%2020230724151025.png)


![](/images/Pasted%20image%2020230724151234.png)



![](/images/Pasted%20image%2020230724151406.png)

![](/images/Pasted%20image%2020230724151428.png)


![](/images/Pasted%20image%2020230724151442.png)



# PG 进程模型
### postmaster 
![](/images/Pasted%20image%2020230724152135.png)

## 后台进程作用
### bgwriter 进程
![](/images/Pasted%20image%2020230724152337.png)
![](/images/Pasted%20image%2020230724152506.png)

![](/images/Pasted%20image%2020230724152608.png)

### wal writer
![](/images/Pasted%20image%2020230724152815.png)

![](/images/Pasted%20image%2020230724153112.png)


![](/images/Pasted%20image%2020230724153303.png)

![](/images/Pasted%20image%2020230724153358.png)

![](/images/Pasted%20image%2020230724153503.png)

![](/images/Pasted%20image%2020230724153751.png)



![](/images/Pasted%20image%2020230724154153.png)


![](/images/Pasted%20image%2020230724154207.png)


![](/images/Pasted%20image%2020230724154231.png)


![](/images/Pasted%20image%2020230724154431.png)

![](/images/Pasted%20image%2020230724154709.png)


![](/images/Pasted%20image%2020230724154650.png)

![](/images/Pasted%20image%2020230724154746.png)


![](/images/Pasted%20image%2020230724154759.png)


# 内存结构
![](/images/Pasted%20image%2020230724155029.png)
![](/images/Pasted%20image%2020230724155041.png)
![](/images/Pasted%20image%2020230724155109.png)


### unix_socket_directories 
值设置为. 则 
.s.PGSQL.5432 与 .s.PGSQL.5432.lock 会在 $PGDATA 下生成


![](/images/Pasted%20image%2020230724160200.png)


# 源码级别
![](/images/Pasted%20image%2020230724161011.png)

# 实例管理与参数文件相关
***学习目录如下:***
![](/images/Pasted%20image%2020230724151959.png)

# 数据库实例状态
![](/images/Pasted%20image%2020230725164857.png)

# 数据库控制文件
![](/images/Pasted%20image%2020230725165054.png)

# 控制文件损坏案例
![](/images/Pasted%20image%2020230725165914.png)
![](/images/Pasted%20image%2020230725171123.png)
![](/images/Pasted%20image%2020230725171252.png)
![](/images/Pasted%20image%2020230725171337.png)
#控制文件 #故障诊断
# pg 控制文件损坏修复参考:
[PostgreSQL恢复系列:pg_control异常恢复 – 专业Oracle数据库恢复，或许是您恢复数据的最后机会@phone:17813235971 - 专业Oracle数据库恢复技术支持 (orasos.com)](http://www.orasos.com/postgresql%E6%81%A2%E5%A4%8D%E7%B3%BB%E5%88%97pg_control%E5%BC%82%E5%B8%B8%E6%81%A2%E5%A4%8D.html)

[PostgreSQL控制文件恢复 - 青空如璃 - 博客园 (cnblogs.com)](https://www.cnblogs.com/chinaops/p/17468702.html)

[使用pg_resetxlog修复PostgreSQL控制文件的方法 - Digoal.Zhou’s Blog (billtian.github.io)](https://billtian.github.io/digoal.blog/2016/08/14/02.html)

```bash
在PG中pg_control文件类似oracle数据库的control文件(控制文件),在Oracle中如果该文件丢失/损坏,可以通过alter database create controlfile命令进行创建,对于PG数据库来说也可以通过pg_resetwal命令来实现创建,由于pg_control文件损坏,需要人工指定一些参数完成pg_resetwal相关操作  
**pg_resetwal 使用说明**

-bash-4.2$ pg_resetwal --help
pg_resetwal resets the PostgreSQL write-ahead log.

Usage:
  pg_resetwal [OPTION]... DATADIR

Options:
  -c, --commit-timestamp-ids=XID,XID
                                   set oldest and newest transactions bearing
                                   commit timestamp (zero means no change)
 [-D, --pgdata=]DATADIR            data directory
  -e, --epoch=XIDEPOCH             set next transaction ID epoch
  -f, --force                      force update to be done
  -l, --next-wal-file=WALFILE      set minimum starting location for new WAL
  -m, --multixact-ids=MXID,MXID    set next and oldest multitransaction ID
  -n, --dry-run                    no update, just show what would be done
  -o, --next-oid=OID               set next OID
  -O, --multixact-offset=OFFSET    set next multitransaction offset
  -u, --oldest-transaction-id=XID  set oldest transaction ID
  -V, --version                    output version information, then exit
  -x, --next-transaction-id=XID    set next transaction ID
      --wal-segsize=SIZE           size of WAL segments, in megabytes
  -?, --help                       show this help, then exit

Report bugs to <pgsql-bugs@lists.postgresql.org>.
PostgreSQL home page: <https://www.postgresql.org/>

**确认现在业务表记录情况**

-bash-4.2$ psql
psql (14.3)
Type "help" for help.

postgres=# select count(1) from ac_event;
 count  
--------
 246266
(1 row)

**模拟pg_control文件异常**

-bash-4.2$ ps -ef|grep postgres
postgres  37178      1  0 09:58 ?        00:00:00 /usr/pgsql-14/bin/postgres -D /var/lib/pgsql/14/data
postgres  37179  37178  0 09:58 ?        00:00:00 postgres: logger 
postgres  37181  37178  0 09:58 ?        00:00:00 postgres: checkpointer 
postgres  37182  37178  0 09:58 ?        00:00:00 postgres: background writer 
postgres  37183  37178  0 09:58 ?        00:00:00 postgres: walwriter 
postgres  37184  37178  0 09:58 ?        00:00:00 postgres: autovacuum launcher 
postgres  37185  37178  0 09:58 ?        00:00:00 postgres: stats collector 
postgres  37186  37178  0 09:58 ?        00:00:00 postgres: logical replication launcher 
root      41368  41314  0 11:06 pts/1    00:00:00 su - postgres
postgres  41369  41368  0 11:06 pts/1    00:00:00 -bash
postgres  45071  41369  0 12:07 pts/1    00:00:00 ps -ef
postgres  45072  41369  0 12:07 pts/1    00:00:00 grep --color=auto postgres
-bash-4.2$ kill -9 37178
-bash-4.2$ ps -ef|grep postgres
root      41368  41314  0 11:06 pts/1    00:00:00 su - postgres
postgres  41369  41368  0 11:06 pts/1    00:00:00 -bash
postgres  45095  41369  0 12:08 pts/1    00:00:00 ps -ef
postgres  45096  41369  0 12:08 pts/1    00:00:00 grep --color=auto postgres
-bash-4.2$ pwd
/var/lib/pgsql/14/data/global
-bash-4.2$ ls -l pg_control 
-rw-------. 1 postgres postgres 8192 May 30 12:04 pg_control
-bash-4.2$ rm -rf pg_control 
-bash-4.2$ ls -l pg_control 
ls: cannot access pg_control: No such file or directory

PG启动失败

-bash-4.2$ pg_ctl start 
pg_ctl: another server might be running; trying to start server anyway
waiting for server to start....postgres: could not find the database system
Expected to find it in the directory "/var/lib/pgsql/14/data",
but could not open file "/var/lib/pgsql/14/data/global/pg_control": No such file or directory
 stopped waiting
pg_ctl: could not start server
Examine the log output.

**创建空pg_control文件启动依旧失败**

-bash-4.2$ touch /var/lib/pgsql/14/data/global/pg_control
-bash-4.2$ pg_ctl start 
pg_ctl: another server might be running; trying to start server anyway
waiting for server to start....2022-05-30 12:09:43.953 CST [45215] PANIC:  
   could not read file "global/pg_control": read 0 of 296
 stopped waiting
pg_ctl: could not start server
Examine the log output.

**设置next-wal-file**  
-l, –next-wal-file=WALFILE,这个参数设置下一个新的WAL文件的最小值，这个值可以从$PGDATA/pg_wal目录下去看最后一个WAL 文件，这个文件的id+1即可

-bash-4.2$ pwd
/var/lib/pgsql/14/data/pg_wal
-bash-4.2$ ls -l
total 16384
-rw-------. 1 postgres postgres 16777216 May 30 12:04 000000010000000000000014
drwx------. 2 postgres postgres        6 May 24 02:20 archive_status
-bash-4.2$ 

这个文件+1，-l 000000010000000000000015  
**设置next-transaction**  
-x, –next-transaction-id=XID,这个参数设置pg_control中的下一个XID的值，这个值可以从pg_xact目录下的文件中查询

-bash-4.2$ pwd
/var/lib/pgsql/14/data/pg_xact
-bash-4.2$ ls -ltr
total 8
-rw-------. 1 postgres postgres 8192 May 30 12:03 0000

最后一个是0000，那么下一个XID就是0001，然后乘以 1048576 (0×100000)，实际上后面直接加5个0就行了。注意，这个值是16进制的。-x 0×000100000  
**multixact-ids设置**  
-m, –multixact-ids=MXID1,MXID2，这个参数包含两个部分，MXID1和MXID2，都可以从$PGDATA/pg_multixact/offsets目录下获得。MXID1的值，首先找到最大值，+1，再乘以 65536 (0×10000，相当于后面加4个0)作为这个参数的前半部分。找到最小的值，后面加4个0，作为MXID2的值

-bash-4.2$ pwd
/var/lib/pgsql/14/data/pg_multixact/offsets
-bash-4.2$ ls -ltr
total 8
-rw-------. 1 postgres postgres 8192 May 29 22:06 0000
-bash-4.2$ 

-m 0×00010000, 0×00000000（由于oldest multitransaction ID不能为0,因此后续这个值需要适当调整）  
**multixact-offset设置**  
-O, –multixact-offset=OFFSET,这个参数可以从$PGDATA/pg_multixact/members目录下获得。找到最大值，+1，乘以 52352 (0xCC80)

-bash-4.2$ pwd
/var/lib/pgsql/14/data/pg_multixact/members
-bash-4.2$ ls -ltr
total 8
-rw-------. 1 postgres postgres 8192 May 24 02:20 0000

-O 0xCC80  
**尝试执行pg_resetwal**

-bash-4.2$ pg_resetwal -l 000000010000000000000015 -x 0x000100000 -m 0x00010000,0x00000000 -O 0xCC80 $PGDATA
pg_resetwal: error: oldest multitransaction ID (-m) must not be 0

multixact-ids值不对,进行调整后处理  
**postmaster.pid文件需要清理**  
由于PG库异常关闭,需要人工清理掉该文件

-bash-4.2$ pg_resetwal -l 000000010000000000000015 -x 0x000100000 -m 0x00020000,0x00010000 -O 0xCC80 $PGDATA
pg_resetwal: error: lock file "postmaster.pid" exists
-bash-4.2$ rm -rf postmaster.pid 

**pg_resetwal结果预览**

-bash-4.2$ pg_resetwal -l 000000010000000000000015 -x 0x000100000 -m 0x00020000,0x00010000 -O 0xCC80 $PGDATA
pg_resetwal: warning: pg_control exists but is broken or wrong version; ignoring it
Guessed pg_control values:

pg_control version number:            1300
Catalog version number:               202107181
Database system identifier:           7103392535324046312
Latest checkpoint's TimeLineID:       1
Latest checkpoint's full_page_writes: off
Latest checkpoint's NextXID:          0:3
Latest checkpoint's NextOID:          12000
Latest checkpoint's NextMultiXactId:  1
Latest checkpoint's NextMultiOffset:  0
Latest checkpoint's oldestXID:        3
Latest checkpoint's oldestXID's DB:   0
Latest checkpoint's oldestActiveXID:  0
Latest checkpoint's oldestMultiXid:   1
Latest checkpoint's oldestMulti's DB: 0
Latest checkpoint's oldestCommitTsXid:0
Latest checkpoint's newestCommitTsXid:0
Maximum data alignment:               8
Database block size:                  8192
Blocks per segment of large relation: 131072
WAL block size:                       8192
Bytes per WAL segment:                16777216
Maximum length of identifiers:        64
Maximum columns in an index:          32
Maximum size of a TOAST chunk:        1996
Size of a large-object chunk:         2048
Date/time type storage:               64-bit integers
Float8 argument passing:              by value
Data page checksum version:           0


Values to be changed:

First log segment after reset:        000000010000000000000015
NextMultiXactId:                      131072
OldestMultiXid:                       65536
OldestMulti's DB:                     0
NextMultiOffset:                      52352
NextXID:                              1048576
OldestXID:                            3
OldestXID's DB:                       0

If these values seem acceptable, use -f to force reset.

**pg_resetwal进行创建pg_control并启动PG**

-bash-4.2$ pg_resetwal -l 000000010000000000000015 -x 0x000100000 -m 0x00020000,0x00010000 -O 0xCC80 -f $PGDATA
pg_resetwal: warning: pg_control exists but is broken or wrong version; ignoring it
Write-ahead log reset
-bash-4.2$ pg_ctl start
waiting for server to start....2022-05-30 13:33:28.266 CST [51437] LOG:  
redirecting log output to logging collector process
2022-05-30 13:33:28.266 CST [51437] HINT:  Future log output will appear in directory "log".
 done
server started

验证数据

-bash-4.2$ psql
psql (14.3)
Type "help" for help.

postgres=#  select count(1) from ac_event;
 count  
--------
 245275
(1 row)

这种方法恢复之后,建议理解dump数据,然后导入到新库中
```


![](/images/Pasted%20image%2020230726075605.png)


![](/images/Pasted%20image%2020230726075619.png)

![](/images/Pasted%20image%2020230726075644.png)

![](/images/Pasted%20image%2020230726075709.png)
# 逻辑日志

![](/images/Pasted%20image%2020230726075807.png)


![](/images/Pasted%20image%2020230726075852.png)

# 系统表
![](/images/Pasted%20image%2020230726080330.png)


![](/images/Pasted%20image%2020230726081325.png)
![](/images/Pasted%20image%2020230726081522.png)

添加参数配置, 然后重启 PG ,然后 reindex 系统表的索引
然后重启启动 PG , 即可正常访问 PG


方法 2 :
单用户模式 
```bash
postgres --single -P postgres
reindex index pg_class_oid_index;
pg_ctl start
```

![](/images/Pasted%20image%2020230726082115.png)


![](/images/Pasted%20image%2020230726082617.png)

![](/images/Pasted%20image%2020230726082853.png)

![](/images/Pasted%20image%2020230726082909.png)
![](/images/Pasted%20image%2020230726083847.png)
![](/images/Pasted%20image%2020230726083959.png)


![](/images/Pasted%20image%2020230726084403.png)
![](/images/Pasted%20image%2020230726084444.png)
# 外部插件的安装与卸载以清理

![](/images/Pasted%20image%2020230726084505.png)

![](/images/Pasted%20image%2020230726085254.png)

![](/images/Pasted%20image%2020230726085309.png)


![](/images/Pasted%20image%2020230726085536.png)



![](/images/Pasted%20image%2020230726085829.png)


![](/images/Pasted%20image%2020230726090130.png)

![](/images/Pasted%20image%2020230726090210.png)

![](/images/Pasted%20image%2020230726090507.png)


![](/images/Pasted%20image%2020230726090546.png)

![](/images/Pasted%20image%2020230726090634.png)


![](/images/Pasted%20image%2020230726090900.png)


![](/images/Pasted%20image%2020230726090952.png)

# PG 扩展开发
![](/images/Pasted%20image%2020230726091017.png)

![](/images/Pasted%20image%2020230726091153.png)


![](/images/Pasted%20image%2020230726091220.png)

![](/images/Pasted%20image%2020230726091239.png)

![](/images/Pasted%20image%2020230726091311.png)
to_char 同理操作
 
![](/images/Pasted%20image%2020230726091348.png)


![](/images/Pasted%20image%2020230726091451.png)

如果失败, 则考虑去掉 USE_PGXS 参数

![](/images/Pasted%20image%2020230726091925.png)

![](/images/Pasted%20image%2020230726092427.png)
![](/images/Pasted%20image%2020230726092617.png)


![](/images/Pasted%20image%2020230726093146.png)


# PG 事务回卷
![](/images/Pasted%20image%2020230726100626.png)


![](/images/Pasted%20image%2020230726101142.png)

![](/images/Pasted%20image%2020230726101234.png)

![](/images/Pasted%20image%2020230726102012.png)
![](/images/Pasted%20image%2020230726102133.png)


![](/images/Pasted%20image%2020230726102430.png)

![](/images/Pasted%20image%2020230726102501.png)



![](/images/Pasted%20image%2020230726102919.png)


![](/images/Pasted%20image%2020230726102955.png)

![](/images/Pasted%20image%2020230726103026.png)

![](/images/Pasted%20image%2020230726103100.png)

![](/images/Pasted%20image%2020230726103304.png)

![](/images/Pasted%20image%2020230726103329.png)




# 事务提交日志
![](/images/Pasted%20image%2020230726103617.png)

![](/images/Pasted%20image%2020230726103849.png)

![](/images/Pasted%20image%2020230726103933.png)

![](/images/Pasted%20image%2020230726191917.png)

![](/images/Pasted%20image%2020230726192052.png)

![](/images/Pasted%20image%2020230726192510.png)

# MVCC

![](/images/Pasted%20image%2020230726192903.png)



![](/images/Pasted%20image%2020230726193535.png)

![](/images/Pasted%20image%2020230726193602.png)

![](/images/Pasted%20image%2020230726193643.png)

![](/images/Pasted%20image%2020230726193743.png)

![](/images/Pasted%20image%2020230726193840.png)


![](/images/Pasted%20image%2020230727130040.png)

![](/images/Pasted%20image%2020230727130114.png)
![](/images/Pasted%20image%2020230727130340.png)


# 锁![](/images/Pasted%20image%2020230727130340.png
![](/images/Pasted%20image%2020230727130854.png)

![](/images/Pasted%20image%2020230727155529.png)

![](/images/Pasted%20image%2020230727155537.png)

![](/images/Pasted%20image%2020230727155550.png)

![](/images/Pasted%20image%2020230727155557.png)
![](/images/Pasted%20image%2020230727155607.png)

![](/images/Pasted%20image%2020230727155629.png)
![](/images/Pasted%20image%2020230727155800.png)


![](/images/Pasted%20image%2020230727155837.png)

![](/images/Pasted%20image%2020230727155940.png)

![](/images/Pasted%20image%2020230727160541.png)


![](/images/Pasted%20image%2020230727162935.png)



# WAL 相关
![](/images/Pasted%20image%2020230727173355.png)


![](/images/Pasted%20image%2020230727174121.png)

![](/images/Pasted%20image%2020230727174130.png)

''![](/images/Pasted%20image%2020230727174146.png)

![](/images/Pasted%20image%2020230727175033.png)

![](/images/Pasted%20image%2020230727175617.png)

![](/images/Pasted%20image%2020230727175633.png)

![](/images/Pasted%20image%2020230727175743.png)


![](/images/Pasted%20image%2020230727175858.png)


![](/images/Pasted%20image%2020230727180516.png)

![](/images/Pasted%20image%2020230728102959.png)

```bash
[pgsql@mysql01 ~]$ pg_controldata | grep Latest | grep REDO
Latest checkpoint's REDO location:    0/F408FC00
Latest checkpoint's REDO WAL file:    0000000100000000000000F4
[pgsql@mysql01 ~]$ psql
psql (14.5)
Type "help" for help.

test=# select pg_walfile_name_offset('0/F408FC00');                  
      pg_walfile_name_offset       
-----------------------------------
 (0000000100000000000000F4,588800)
(1 row)

test=# select x'08FC00'::int;  
  int4  
--------
 588800
(1 row)

test=# select pg_current_wal_lsn(), pg_walfile_name(pg_current_wal_lsn()), pg_walfile_name_offset(pg_current_wal_lsn());
 pg_current_wal_lsn |     pg_walfile_name      |      pg_walfile_name_offset       
--------------------+--------------------------+-----------------------------------
 0/F408FCE8         | 0000000100000000000000F4 | (0000000100000000000000F4,589032)
(1 row)

-- 10 进制转换为 16 进制
test=# select to_hex(589032);
 to_hex 
--------
 8fce8
(1 row)

[pgsql@mysql01 ~]$ pg_waldump -r list
XLOG
Transaction
Storage
CLOG
Database
Tablespace
MultiXact
RelMap
Standby
Heap2
Heap
Btree
Hash
Gin
Gist
Sequence
SPGist
BRIN
CommitTs
ReplicationOrigin
Generic
LogicalMessage

```

# WAL 文件解析
```bash
[pgsql@mysql01 pg_wal]$ psql
psql (14.5)
Type "help" for help.

test=# select pg_current_wal_lsn(), pg_walfile_name(pg_current_wal_lsn()), pg_walfile_name_offset(pg_current_wal_lsn());
 pg_current_wal_lsn |     pg_walfile_name      |      pg_walfile_name_offset       
--------------------+--------------------------+-----------------------------------
 0/F408FCE8         | 0000000100000000000000F4 | (0000000100000000000000F4,589032)
(1 row)

test=# create table test_wal(id int);
CREATE TABLE
test=# select pg_current_wal_lsn(), pg_walfile_name(pg_current_wal_lsn()), pg_walfile_name_offset(pg_current_wal_lsn());
 pg_current_wal_lsn |     pg_walfile_name      |      pg_walfile_name_offset       
--------------------+--------------------------+-----------------------------------
 0/F40A6C20         | 0000000100000000000000F4 | (0000000100000000000000F4,683040)
(1 row)

test=# insert into test_wal values(1);
INSERT 0 1
test=# 
test=# select pg_current_wal_lsn(), pg_walfile_name(pg_current_wal_lsn()), pg_walfile_name_offset(pg_current_wal_lsn());
 pg_current_wal_lsn |     pg_walfile_name      |      pg_walfile_name_offset       
--------------------+--------------------------+-----------------------------------
 0/F40A6C88         | 0000000100000000000000F4 | (0000000100000000000000F4,683144)
(1 row)

test=# insert into test_wal values(2);
INSERT 0 1
test=# 
test=# select pg_current_wal_lsn(), pg_walfile_name(pg_current_wal_lsn()), pg_walfile_name_offset(pg_current_wal_lsn());
 pg_current_wal_lsn |     pg_walfile_name      |      pg_walfile_name_offset       
--------------------+--------------------------+-----------------------------------
 0/F40A6CF0         | 0000000100000000000000F4 | (0000000100000000000000F4,683248)
(1 row)

test=# delete from test_wal where id=2;
DELETE 1
test=# select pg_current_wal_lsn(), pg_walfile_name(pg_current_wal_lsn()), pg_walfile_name_offset(pg_current_wal_lsn());
 pg_current_wal_lsn |     pg_walfile_name      |      pg_walfile_name_offset       
--------------------+--------------------------+-----------------------------------
 0/F40A6D88         | 0000000100000000000000F4 | (0000000100000000000000F4,683400)
(1 row)

test=# \q

```
# WAL 文件解析
![](/images/Pasted%20image%2020230728110929.png)

![](/images/Pasted%20image%2020230728111231.png)


![](/images/Pasted%20image%2020230728111221.png)


![](/images/Pasted%20image%2020230728111204.png)

![](/images/Pasted%20image%2020230728111339.png)


![](/images/Pasted%20image%2020230728111356.png)

![](/images/Pasted%20image%2020230728111556.png)


pg_wal 下面日志文件名称
![](/images/Pasted%20image%2020230728112224.png)

```bash
archive_status:
.ready : 表示可以归档了
.done : 表示已经归档成功了
```


# 安全相关
![](/images/Pasted%20image%2020230729121333.png)

在 PG 中, "用户"  = "角色"+login 权限

# 系统默认角色 :
![](/images/Pasted%20image%2020230729122035.png)


![](/images/Pasted%20image%2020230729122410.png)

![](/images/Pasted%20image%2020230729122506.png)

# public (隐藏)角色
![](/images/Pasted%20image%2020230729122810.png)



![](/images/Pasted%20image%2020230729123245.png)

回收之后, 该用户还是可以连接数据库并在 public 模式下创建表等对象
![](/images/Pasted%20image%2020230729123334.png)

![](/images/Pasted%20image%2020230729123605.png)


# create role 选项
![](/images/Pasted%20image%2020230729124405.png)

![](/images/Pasted%20image%2020230729124453.png)


![](/images/Pasted%20image%2020230729124615.png)



![](/images/Pasted%20image%2020230729124755.png)



