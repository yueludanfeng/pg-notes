---
title: "创建主表"
date: 2023-06-28
description: "```sql"
categories: ["PostgreSQL 运维"]
tags: ["分区", "分区表", "索引"]
series: []
---

[toc]


# 创建主表
```sql

drop table if exists tbl_sales_partitioned cascade;

CREATE TABLE tbl_sales_partitioned (

id SERIAL ,

sale_date DATE,

amount NUMERIC(10, 2)

) PARTITION BY RANGE(sale_date);

alter table tbl_sales_partitioned add constraint tbl_sales_partitioned_pkey primary key (sale_date, id);
```

  

#  创建分区

```sql
-- 创建 1 级分区
CREATE TABLE tbl_sales_partition_2020 PARTITION OF tbl_sales_partitioned FOR VALUES FROM (DATE '2020-01-01') TO (DATE '2021-01-01') PARTITION BY RANGE(sale_date);

-- 创建 2 级分区

CREATE TABLE tbl_sales_partition_2020_01 PARTITION OF tbl_sales_partition_2020 FOR VALUES FROM (DATE '2020-01-01') TO (DATE '2020-02-01') ;

-- 下面同理
CREATE TABLE tbl_sales_partition_2020_02 PARTITION OF tbl_sales_partition_2020 FOR VALUES FROM (DATE '2020-02-01') TO (DATE '2020-03-01') ;

CREATE TABLE tbl_sales_partition_2020_03 PARTITION OF tbl_sales_partition_2020 FOR VALUES FROM (DATE '2020-03-01') TO (DATE '2020-04-01') ;



CREATE TABLE tbl_sales_partition_2021 PARTITION OF tbl_sales_partitioned FOR VALUES FROM (DATE '2021-01-01') TO (DATE '2022-01-01') PARTITION BY RANGE(sale_date);

CREATE TABLE tbl_sales_partition_2021_01 PARTITION OF tbl_sales_partition_2021 FOR VALUES FROM (DATE '2021-01-01') TO (DATE '2021-02-01') ;

CREATE TABLE tbl_sales_partition_2021_02 PARTITION OF tbl_sales_partition_2021 FOR VALUES FROM (DATE '2021-02-01') TO (DATE '2021-03-01') ;

CREATE TABLE tbl_sales_partition_2021_03 PARTITION OF tbl_sales_partition_2021 FOR VALUES FROM (DATE '2021-03-01') TO (DATE '2021-04-01') ;

  

CREATE TABLE tbl_sales_partition_2022 PARTITION OF tbl_sales_partitioned FOR VALUES FROM (DATE '2022-01-01') TO (DATE '2023-01-01') PARTITION BY RANGE(sale_date);

CREATE TABLE tbl_sales_partition_2022_01 PARTITION OF tbl_sales_partition_2022 FOR VALUES FROM (DATE '2022-01-01') TO (DATE '2022-02-01') ;

CREATE TABLE tbl_sales_partition_2022_02 PARTITION OF tbl_sales_partition_2022 FOR VALUES FROM (DATE '2022-02-01') TO (DATE '2022-03-01') ;

CREATE TABLE tbl_sales_partition_2022_03 PARTITION OF tbl_sales_partition_2022 FOR VALUES FROM (DATE '2022-03-01') TO (DATE '2022-04-01') ;
```

  

# 创建索引

```sql

create index idx_tbl_sales_partitioned_salel_date on tbl_sales_partitioned(sale_date);

```


#  向分区表插入数据
```sql

INSERT INTO tbl_sales_partitioned (sale_date, amount)

VALUES ('2020-01-20', 100.50),

('2021-02-15', 200.75),

('2022-03-10', 300.25);

```


#   查询数据
```sql

SELECT * FROM tbl_sales_partitioned;

SELECT * FROM only tbl_sales_partitioned;

select * from only tbl_sales_partition_2020_01;

select * from only tbl_sales_partition_2020_02;

select * from only tbl_sales_partition_2020_03;

  

select * from only tbl_sales_partition_2021_01;

select * from only tbl_sales_partition_2021_02;

select * from only tbl_sales_partition_2021_03;

  

select * from only tbl_sales_partition_2022_01;

select * from only tbl_sales_partition_2022_02;

select * from only tbl_sales_partition_2022_03;

  
  
  

postgres=# SELECT * FROM tbl_sales_partitioned;

id | sale_date | amount

----+------------+--------

1 | 2020-01-20 | 100.50

2 | 2021-02-15 | 200.75

3 | 2022-03-10 | 300.25

(3 rows)

  

postgres=# SELECT * FROM only tbl_sales_partitioned;

id | sale_date | amount

----+-----------+--------

(0 rows)

  

Time: 1.434 ms

postgres@pg-meta-1:5432

  
  

postgres=# select * from only tbl_sales_partition_2020_01;

id | sale_date | amount

----+------------+--------

1 | 2020-01-20 | 100.50

(1 row)

  

Time: 0.319 ms

postgres=# select * from only tbl_sales_partition_2020_02;

id | sale_date | amount

----+-----------+--------

(0 rows)

  

Time: 0.280 ms

postgres=# select * from only tbl_sales_partition_2020_03;

id | sale_date | amount

----+-----------+--------

(0 rows)

  

Time: 0.318 ms

postgres=#

postgres=# select * from only tbl_sales_partition_2021_01;

id | sale_date | amount

----+-----------+--------

(0 rows)

  

Time: 0.312 ms

postgres=# select * from only tbl_sales_partition_2021_02;

id | sale_date | amount

----+------------+--------

2 | 2021-02-15 | 200.75

(1 row)

  

Time: 0.248 ms

postgres=# select * from only tbl_sales_partition_2021_03;

id | sale_date | amount

----+-----------+--------

(0 rows)

  

Time: 0.340 ms

postgres=#

postgres=# select * from only tbl_sales_partition_2022_01;

id | sale_date | amount

----+-----------+--------

(0 rows)

  

Time: 0.315 ms

postgres=# select * from only tbl_sales_partition_2022_02;

id | sale_date | amount

----+-----------+--------

(0 rows)

  

Time: 0.340 ms

postgres=# select * from only tbl_sales_partition_2022_03;

id | sale_date | amount

----+------------+--------

3 | 2022-03-10 | 300.25

```