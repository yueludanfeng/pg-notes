---
title: "数组类型"
date: 2023-06-26
description: "当在 PostgreSQL 中使用 GIN 索引来处理数组类型时，可以通过以下示例来说明："
categories: ["PostgreSQL 笔记"]
tags: ["参数配置", "执行计划", "索引"]
series: []
---

[TOC]

# 数组类型

当在 PostgreSQL 中使用 GIN 索引来处理数组类型时，可以通过以下示例来说明：

假设有一个表 `books`，其中有一个列 `tags` 存储了书籍的标签信息，使用数组类型来表示。现在我们想要创建一个 GIN 索引来加快对标签进行搜索的查询。

首先，创建 `books` 表：
```sql
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100),
    tags TEXT[]
);
```

接下来，插入一些示例数据：
```sql
INSERT INTO books (title, tags) VALUES
    ('Book 1', ARRAY['fiction', 'adventure']),
    ('Book 2', ARRAY['science', 'fiction']),
    ('Book 3', ARRAY['romance', 'fantasy']),
    ('Book 4', ARRAY['adventure']);
```

然后，创建 GIN 索引：
```sql
CREATE INDEX idx_books_tags_gin ON books USING GIN (tags);

```

现在，我们可以执行搜索查询，以便在 `tags` 列中查找包含特定标签的书籍。例如，查找包含标签 `'fiction'` 的书籍：
```sql
SELECT * FROM books WHERE tags @> ARRAY['fiction'];



lxm=# set enable_seqscan = off;
SET
lxm=# explain (verbose, analyse, costs, buffers)  SELECT * FROM books WHERE tags @> ARRAY['fiction'];
                                                        QUERY PLAN
---------------------------------------------------------------------------------------------------------------------------
 Bitmap Heap Scan on public.books  (cost=8.00..12.01 rows=1 width=254) (actual time=0.023..0.025 rows=2 loops=1)
   Output: id, title, tags
   Recheck Cond: (books.tags @> '{fiction}'::text[])
   Heap Blocks: exact=1
   Buffers: shared hit=3
   ->  Bitmap Index Scan on idx_books_tags_gin  (cost=0.00..8.00 rows=1 width=0) (actual time=0.017..0.018 rows=2 loops=1)
         Index Cond: (books.tags @> '{fiction}'::text[])
         Buffers: shared hit=2
 Planning:
   Buffers: shared hit=1
 Planning Time: 0.126 ms
 Execution Time: 0.073 ms
(12 rows)


lxm=#
lxm=# SELECT * FROM books WHERE tags @> ARRAY['fiction'];
 id | title  |        tags
----+--------+---------------------
  1 | Book 1 | {fiction,adventure}
  2 | Book 2 | {science,fiction}
(2 rows)
```


这将返回匹配的书籍记录。


下面 SQL ,将返回同时包含 `'fiction'` 和 `'adventure'` 标签的书籍记录。
```sql
SELECT * FROM books WHERE tags @> ARRAY['fiction', 'adventure'];

lxm=# SELECT * FROM books WHERE tags @> ARRAY['fiction', 'adventure'];
 id | title  |        tags
----+--------+---------------------
  1 | Book 1 | {fiction,adventure}
(1 row)

lxm=# explain (verbose, analyse, costs, buffers) SELECT * FROM books WHERE tags @> ARRAY['fiction', 'adventure'];
                                                         QUERY PLAN
----------------------------------------------------------------------------------------------------------------------------
 Bitmap Heap Scan on public.books  (cost=12.00..16.01 rows=1 width=254) (actual time=0.016..0.017 rows=1 loops=1)
   Output: id, title, tags
   Recheck Cond: (books.tags @> '{fiction,adventure}'::text[])
   Heap Blocks: exact=1
   Buffers: shared hit=4
   ->  Bitmap Index Scan on idx_books_tags_gin  (cost=0.00..12.00 rows=1 width=0) (actual time=0.012..0.012 rows=1 loops=1)
         Index Cond: (books.tags @> '{fiction,adventure}'::text[])
         Buffers: shared hit=3
 Planning:
   Buffers: shared hit=1
 Planning Time: 0.087 ms
 Execution Time: 0.034 ms
(12 rows)
```


# jsonb 类型

当使用 PostgreSQL 的 JSONB 数据类型存储和查询 JSON 数据时，可以使用 GIN（Generalized Inverted Index）索引来提高查询性能。GIN 索引适用于包含大量不同的键值对的 JSONB 列。

下面是一个 PostgreSQL 中使用 GIN 索引的 JSONB 示例：

首先，创建一个包含 JSONB 列的表：

```sql
drop table if exists my_table ;
CREATE TABLE my_table (
    id SERIAL PRIMARY KEY,
    data JSONB
);

INSERT INTO my_table (data)
VALUES ('{"name": "John", "age": 30, "address": {"city": "New York", "state": "NY"}}'),
       ('{"name": "Alice", "age": 25, "address": {"city": "San Francisco", "state": "CA"}}'),
       ('{"name": "Bob", "age": 35, "address": {"city": "Seattle", "state": "WA"}}');
```

接下来，创建一个 GIN 索引来加速 JSONB 列的查询：

```sql
CREATE INDEX my_table_data_gin_index ON my_table USING GIN (data);
```

现在，可以使用 GIN 索引来执行 JSONB 列的查询。例如，查找居住在纽约的人：

```sql
set enable_seqscan to off;
SELECT * FROM my_table WHERE data @> '{"address": {"city": "New York"}}';
explain (verbose, analyse, costs, buffers) SELECT * FROM my_table WHERE data @> '{"address": {"city": "New York"}}';


lxm=# set enable_seqscan to off;
SET
lxm=#
lxm=# SELECT * FROM my_table WHERE data @> '{"address": {"city": "New York"}}';
 id |                                    data
----+-----------------------------------------------------------------------------
  1 | {"age": 30, "name": "John", "address": {"city": "New York", "state": "NY"}}
(1 row)

lxm=# explain (verbose, analyse, costs, buffers)
lxm-#  SELECT * FROM my_table WHERE data @> '{"address": {"city": "New York"}}';
                                                           QUERY PLAN
---------------------------------------------------------------------------------------------------------------------------------
 Bitmap Heap Scan on public.my_table  (cost=16.00..20.01 rows=1 width=36) (actual time=0.022..0.022 rows=1 loops=1)
   Output: id, data
   Recheck Cond: (my_table.data @> '{"address": {"city": "New York"}}'::jsonb)
   Heap Blocks: exact=1
   Buffers: shared hit=5
   ->  Bitmap Index Scan on my_table_data_gin_index  (cost=0.00..16.00 rows=1 width=0) (actual time=0.014..0.014 rows=1 loops=1)
         Index Cond: (my_table.data @> '{"address": {"city": "New York"}}'::jsonb)
         Buffers: shared hit=4
 Planning:
   Buffers: shared hit=1
 Planning Time: 0.068 ms
 Execution Time: 0.040 ms
(12 rows)
```

这将返回居住在纽约的人的记录。

GIN 索引还可以在 JSONB 列的键上进行查询。例如，查找年龄大于等于 30 岁的人：

```sql
SELECT * FROM my_table WHERE data ->> 'age' >= '30';
explain (verbose, analyse, costs, buffers) SELECT * FROM my_table WHERE data ->> 'age' >= '30';

create index idx_my_table_data_age on my_table using gin((data->>'age'));
```

这将返回年龄大于等于 30 岁的人的记录。

使用 GIN 索引可以加快对 JSONB 列的查询，尤其是在包含大量不同键值对的情况下。请根据你的具体需求和数据模式进行调整和优化。



# 全文搜索

当在 PostgreSQL 中使用 GIN 索引进行全文搜索时，可以使用 `tsvector` 和 `tsquery` 数据类型以及相关的函数来实现。以下是一个示例：

假设我们有一个表 `articles`，其中有一个列 `content` 存储了文章的内容。我们想要创建一个 GIN 索引来支持全文搜索功能。

首先，创建 `articles` 表：
```sql
CREATE TABLE articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100),
    content TEXT
);
```

接下来，插入一些示例数据：
```sql
INSERT INTO articles (title, content) VALUES
    ('Article 1', 'This is the content of article 1.'),
    ('Article 2', 'Here is the content for article 2.'),
    ('Article 3', 'This article discusses various topics.'),
    ('Article 4', 'The content of the fourth article is different.');
```

然后，为 `content` 列创建一个辅助列 `tsvector`，该列将存储已处理的文本索引：
```sql
ALTER TABLE articles ADD COLUMN content_vector tsvector;
```

接下来，更新 `content_vector` 列的值，将 `content` 列的文本转换为 `tsvector` 类型：
```sql
UPDATE articles SET content_vector = to_tsvector('english', content);
```

现在，我们可以创建 GIN 索引：
```sql
CREATE INDEX idx_articles_content_gin ON articles USING GIN (content_vector);
```

这将创建一个基于 `content_vector` 列的 GIN 索引，以支持全文搜索。

接下来，我们可以执行全文搜索查询，使用 `tsquery` 类型来指定搜索条件。例如，查找包含单词 `'content'` 的文章：
```sql
SELECT * FROM articles WHERE content_vector @@ to_tsquery('english', 'content');
```

这将返回匹配的文章记录。

请注意，要构建一个 `tsquery` 对象，我们使用 `to_tsquery` 函数，并提供搜索条件和相应的文本搜索配置（在本例中为英语）。

你还可以使用其他文本搜索函数和操作符来进行更复杂的全文搜索查询，例如 `plainto_tsquery`、`ts_rank` 等。具体的用法取决于你的需求。

