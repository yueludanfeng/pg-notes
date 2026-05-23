---
title: "初始化"
date: 2023-06-20
description: "```"
categories: ["PostgreSQL 运维"]
tags: ["pgbench", "参数配置"]
series: []
---

#pgbench #测试 
# 初始化
```
pgbench -Upostgres  postgres -i -s 10
```

> -s 表示规模

# 压测

```
pgbench -Upostgres  postgres -c40 -j3 -l -M prepared -P3 -T120 -n -r
```



# 示例:

  ```bash
  /home/postgres/pgsql/bin/pgbench -U postgres -r -T 10 -c 1000 -j 8 test -P1 -n 
  
  [root@localhost update]# /home/postgres/pgsql/bin/pgbench -U postgres -r -T 10 -c 1000 -j 8 test -P1 -n
  pgbench (14.2)
  progress: 1.0 s, 3416.0 tps, lat 163.648 ms stddev 132.792
  progress: 2.0 s, 4419.2 tps, lat 198.747 ms stddev 220.281
  progress: 3.0 s, 3520.1 tps, lat 262.907 ms stddev 316.133
  progress: 4.0 s, 3225.8 tps, lat 298.264 ms stddev 387.578
  progress: 5.0 s, 2920.1 tps, lat 325.553 ms stddev 398.968
  progress: 6.0 s, 2601.4 tps, lat 359.785 ms stddev 460.176
  progress: 7.0 s, 2390.4 tps, lat 397.747 ms stddev 494.970
  progress: 8.0 s, 2245.7 tps, lat 429.624 ms stddev 593.418
  progress: 9.0 s, 2133.3 tps, lat 427.139 ms stddev 551.542
  progress: 10.0 s, 2008.5 tps, lat 507.810 ms stddev 657.340
  transaction type: <builtin: TPC-B (sort of)>
  scaling factor: 10
  query mode: simple
  number of clients: 1000
  number of threads: 8
  duration: 10 s
  number of transactions actually processed: 29882
  latency average = 333.379 ms
  latency stddev = 467.336 ms
  initial connection time = 206.989 ms
  tps = 2945.093549 (without initial connection time)
  statement latencies in milliseconds:
           0.003  \set aid random(1, 100000 * :scale)
           0.002  \set bid random(1, 1 * :scale)
           0.003  \set tid random(1, 10 * :scale)
           0.005  \set delta random(-5000, 5000)
           1.235  BEGIN;
           2.482  UPDATE pgbench_accounts SET abalance = abalance + :delta WHERE aid = :aid;
           1.084  SELECT abalance FROM pgbench_accounts WHERE aid = :aid;
         299.202  UPDATE pgbench_tellers SET tbalance = tbalance + :delta WHERE tid = :tid;
          27.330  UPDATE pgbench_branches SET bbalance = bbalance + :delta WHERE bid = :bid;
           0.937  INSERT INTO pgbench_history (tid, bid, aid, delta, mtime) VALUES (:tid, :bid, :aid, :delta, CURRENT_TIMESTAMP);
           1.098  END;
  [root@localhost update]#
  ```
  
   
# 查看 QPS
```bash
pgbench  -r -T 10 -c 20 -j 8 test -P1 -n -b select-only
```



# 通过设置权重配置 DQL 与 DML 的比重


  ```bash
  pgbench    test -M prepared -n -T 20 -c 10 -j 2 -P1 -b select-only@1 -b simple-update@2
  
  
  ....
  scaling factor: 10
  query mode: prepared
  number of clients: 10
  number of threads: 2
  duration: 20 s
  number of transactions actually processed: 89966
  latency average = 2.114 ms
  latency stddev = 2.514 ms
  initial connection time = 19.945 ms
  tps = 4495.856502 (without initial connection time)
  SQL script 1: <builtin: select only>
   - weight: 1 (targets 33.3% of total)
   - 29794 transactions (33.1% of total, tps = 1488.890788)
   - latency average = 0.211 ms
   - latency stddev = 0.425 ms
  SQL script 2: <builtin: simple update>
   - weight: 2 (targets 66.7% of total)
   - 60156 transactions (66.9% of total, tps = 3006.166149)
   - latency average = 3.056 ms
   - latency stddev = 2.585 ms
  
  ```

  

  

