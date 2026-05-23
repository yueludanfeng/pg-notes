---
title: "PostgreSQL 角色和权限详解"
date: 2023-08-29
description: "很多PostgreSQL初学者分不清楚，PostgreSQL中的权限在总体上该如何分配管理，本文就解决这个问题。"
categories: ["PostgreSQL 笔记"]
tags: ["PostgreSQL", "参数配置", "安装部署", "权限"]
series: []
---

[对PostgreSQL中权限的理解(初学者必读) (qq.com)](https://mp.weixin.qq.com/s/w87TaCXoh1b03lEYIqQQSg)

[Weixin Official Accounts Platform (qq.com)](https://mp.weixin.qq.com/s?__biz=MzIzNTg4MjI2Mw==&mid=2247490542&idx=1&sn=04cb49b92497d21e9aaf8818e7b45093&chksm=e8e10996df96808081ab44e765c53b86e144d9e2700eadb607121f9d8f090f149117e2c07dcf&scene=132&exptype=timeline_recommend_article_extendread_samebiz#wechat_redirect)


很多PostgreSQL初学者分不清楚，PostgreSQL中的权限在总体上该如何分配管理，本文就解决这个问题。

## 1. 超级用户

PostgreSQL最大权限的用户就是超级用户，这个超级用户可以在数据库中做任意的操作，无任何的限制。当初使化数据库后，自动有会有一个超级用户，通常这个超级用户的名称与初使化数据库时的操作系统用户名相同。建PostgreSQL数据库实例时，一般我们会在操作系统上 如果我们在操作系统用户pg001下执行initdb初使化PostgreSQL数据库的，则建出的数据库中有一个名称为pg001的超级用户。

使用这个初使的超级用户可以建其它的超级用户或普通用户，所以一个数据库中可以有**多个超级用户**。

## 2. 用户的两种权限

PostgreSQL数据库中的用户中有两种权限：

- 一种权限是在创建用户时指定的
    
- 另一种权限是通过grant命令赋于的，在创建用户时可以指定权限。
    

创建用户的权限

- 超级用户权限
    
- 创建database的权限
    
- 创建其他用户或角色的权限
    
- 登录的权限
    

grant命令主要是赋于用户对数据库中一些对象（如schema、表、视图）的查询、增、删、改的权限

## 3. 属主与权限的层次关系

PostgreSQL中的权限是按照数据库逻辑对象的层次进行管理的，PostgreSQL逻辑对象的层次为：

- database
    
- schema：每个schema总是属于一个数据库的。数据库的属主就可以在他的数据库中创建各种schema。
    
- 表、视图、函数等：这些对象都是属于一个schema的。用户如果有在schema上的CREATE权限，就可以在这个schema中创建表、视图、函数等数据库对象了。
    

PostgreSQL的权限设计成与Linux文件系统的权限类似，每个数据库对象如database、schema、table、view等等属于某一个用户。数据库对象的层次关系类似Linux下的文件目录的层次关系。

**注意：MySQL中的database概念实际上是PostgreSQL中的schema，而不是PostgreSQL中的database。**

另需要注意的是，PostgreSQL中并没有单独的DDL权限，如没有这样的赋权语句：

```
GRANT create table to xxx;
```

所谓创建DDL语句的权限是在schema上的。如果一个用户是一个schema的属主或其有在schema中create的权限时，则他就能在这个schema中创建表、视图、函数等对象。所以如果要让一个用户A能够在另一个用户B的schema中创建表，则需要B用户使用下面的赋权语句给A用户赋权：

```
GRANT CREATE  ON SCHEMA schema_a TO A;
```

## 4. public虚拟用户和public schema

在权限的赋权过程中，PostgreSQL系统中有一个名称为“public”的虚拟用户，当把权限给这个用户后，就相当于任何用户都有这个权限。当我们想让数据库中所有用户时都能查询表mytab时，可以这样：

```
GRANT select on TABLE mytab to public;
```

在刚初使化数据库完成后，数据库中默认就存在一个名称为“public”的schema，任何用户都有在这个schema上的create权限，因为这时任何用户都有创建表的权限，而通常我们需要把这个权限收回来：

```
REVOKE  CREATE  ON SCHEMA public from public;
```

## 5. 使用权限的一些场景

### 5.1 只读用户

在PostgreSQL中并没有CREATE TABLE权限名称，这是与其它数据库不同的一个地方，PostgreSQL是通过控制是否在模式schema中上有CREATE控制用户的能否创建表的权限的，默认安装下，任何用户都有在模式public中CREATE的权限，所以要创建只读账号的第一步，我们要先去除在模式public中的CREATE权限：

```
REVOKE CREATE ON SCHEMA public from public;
```

下面的SQL创建了一个名为“readonly”的用户：

```
CREATE USER readonly with password 'query';
```

然后把现有的所有在public这个schema下的表的SELECT权限赋给用户readonly，执行下面的SQL命令：

```
GRANT SELECT ON  ALL TABLES IN SCHEMA public TO readonly;
```

上面的SQL命令只把现有的表的权限给了用户readonly，但如果这之后创建的表，readonly用户还是不能读，需要使用下面的SQL把以后创建的表的SELECT权限也给用户readonly：

```
ALTER DEFAULT PRIVILEGES IN SCHEMA public grant select on tables to readonly;
```

注意：上面的过程只是把名称为public的schema下的表赋了只读权限，如果想让这个用户能访问其它schema下的表，需要重复执行：

```
GRANT SELECT ON  ALL TABLES IN SCHEMA other_schema TO readonly;ALTER DEFAULT PRIVILEGES IN SCHEMA other_schema grant select on tables to readonly;
```

### 5.2 一个权限规划的例子

DBA可以为某个独立应用建一个独立的database和一个用户，并指定此数据库的属主为这个用户，这个用户我们可以称之为应用的root用户：

```
CREATE USER approot PASSWORD 'mypassword'; CREATE DATABASE app1  OWNER  approot ;
```

同时再建两个用户：

```
CREATE USER appu01 PASSWORD 'mypassword'; CREATE USER appreadonly PASSWORD 'mypassword';
```

其中appu01是一个在此数据库中权限受限的用户，appreadonly是一个只读用户。

然后DBA把这三个用户给应用的负责人，应用的负责人需要用approot这个用户在这个数据库中根据需求创建schema和在这个schema中创建表、视图、函数等对象。也就是让这个数据库中的所有的数据库对象的属主为approot这个用户。

然后应用负责人使用grant命令就可以控制用户appu01能查询、更新、插入、删除这个数据库中哪些表。

应用负责人可以用我们前面的方法把用户appreadonly设置成一个只读用户。


# PostgreSQL 角色和权限详解
[PostgreSQL 角色和权限详解 | MemFireDB论坛](https://community.memfiredb.com/topic/491/postgresql-%E8%A7%92%E8%89%B2%E5%92%8C%E6%9D%83%E9%99%90%E8%AF%A6%E8%A7%A3)

PostgreSQL 是最受欢迎的关系型数据库管理系统之一。当你使用本地运行的 PostgreSQL 时，为了方便起见，你只需使用一个超级用户。但在生产环境中，你需要正确设置用户和权限。

然而，尽管有很多关于如何在PostgreSQL中插入和查询数据的文章，但其访问控制机制并没有得到很好的解释。本文总结了它的工作原理，作为PostgreSQL访问控制的入门指南。

# 角色、对象和权限

与其他访问控制机制一样，PostgreSQL的访问控制可以解释为“角色X允许在对象Z上执行Y操作”。在这里，角色是用户和组，对象是数据库、表等，权限是像 `SELECT` 或 `INSERT` 这样的操作。从概念上讲，PostgreSQL的访问控制列表（ACL）条目可以解释为一个 `(role, object, privilege)` 元组。

角色基本上是用户和组。它既可以作为用户，也可以作为组；你可以以角色身份登录，角色也可以属于另一个角色。每个角色都有像 `LOGIN` 和 `INHERIT` 这样的属性，表示你是否可以以该角色登录，以及该角色是否从其所属角色继承权限。你可以使用 `GRANT ROLE ...` 命令将角色添加到另一个角色的成员中。

在PostgreSQL中，对象包括数据库、表等。PostgreSQL对象具有树状结构。一个PostgreSQL实例可以拥有多个数据库。一个数据库可以拥有多个模式。一个模式可以拥有多个表。

特权是在PostgreSQL对象上定义的权限。例如，表上有一个 `SELECT` 特权，这是在它们上面运行 `SELECT` 查询的权限。每种对象都有不同的特权集。

通过这些元素，你可以表达类似于“角色 `readonly_user` 被允许在 `accounts` 表上运行 `SELECT` ”的访问控制配置。你可以在 [https://www.postgresql.org/docs/15/ddl-priv.html](https://www.postgresql.org/docs/15/ddl-priv.html) 中查看对象类型和权限的有效组合。你可以使用 `GRANT` 和 `REVOKE` 命令添加或删除 `(role, object, privilege)` 元组。

继承仅发生在角色之间，而不是对象之间。由于 PostgreSQL 对象具有树状结构，你可能希望在数据库级别授予 `SELECT` 权限，希望它将 `SELECT` 权限授予数据库中的所有表。但是，PostgreSQL 权限并不是这样工作的。

### 对象所有者

每个PostgreSQL对象都有一个名为“所有者”的特殊角色。只有所有者才能执行某些操作，如 `ALTER TABLE` ，而你不能将 `GRANT` 这样的权限授予非所有者。

有时候，你可能希望为一个对象分配两个以上的所有者。假设你有两个角色， `app_user` 和 `sre_user` ，你希望这两个用户都能运行 `ALTER TABLE` ，而这只有所有者才能做到。由于每个对象只能有一个所有者，你不能直接让这两个用户都成为所有者。同时， `ALTER TABLE` 不是你可以将其 `GRANT` 到角色的内容。

你可以使用角色继承来解决此问题。创建 `table_owner` 角色和 `GRANT table_owner TO app_user, sre_user` ，然后像 `ALTER TABLE my_table OWNER TO table_owner` 那样转移所有者角色。现在表的所有者是 `table_owner` ，但是因为 `app_user` 和 `sre_user` 是该角色的成员，所以他们也具有继承权限来运行 `ALTER TABLE` 。

[![1.PNG](https://community.memfiredb.com/assets/uploads/files/1689210821259-1.png)](https://community.memfiredb.com/assets/uploads/files/1689210821259-1.png)

### 默认权限

当创建一个对象时，初始时只有所有者可以访问该对象。例如，如果你创建了一个新表，只有你可以访问该表。你需要单独向其他角色授权。这很麻烦，因为你每次创建新表时都需要这样做。PostgreSQL具有一个功能，允许你配置新创建的对象的默认权限。

假设你想要为数据库和模式下的所有新表默认分配只读权限给一个只读角色。在 PostgreSQL v14 或更高版本中，有一个预定义的 `pg_read_all_data` 角色，允许其成员读取所有数据库中的所有数据，但如果你想要将其限制在某个特定数据库，就不能使用这个角色。我们将通过使用默认权限为 `ro_user` 角色提供只读访问权限。

对于现有的表格，我们可以运行 `GRANT SELECT ON ALL TABLES IN SCHEMA public TO ro_user` 。这将为现有表格提供 `SELECT` 权限。然而，我们希望将此权限授予将来创建的表格。为了实现这一点， `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO ro_user` 。这将改变默认权限。

请注意，这些默认权限仅在授权者创建新表时应用。例如，假设我们有两个所有者角色 `table_owner1` 和 `table_owner2` 。 `table_owner1` 发出 `ALTER DEFAULT PRIVILEGES ...` ，而另一个没有默认权限。在这种情况下，发出的 `ALTER DEFAULT PRIVILEGES` 仅与 `table_owner1` 相关，并且仅在 `table_owner1` 创建新表时应用。即使 `table_owner2` 创建了一个新表，它也不会拥有由 `table_owner1` 定义的默认权限。

# **查看当前的****访问控制列表**

通过使用 `GRANT` 和 `REVOKE` 命令，你可以修改上述的ACL，但是我们如何查看当前的ACL呢？如果你使用 `psql` 命令行界面，有一些命令行内部命令可以显示它们：  
[![2.png](https://community.memfiredb.com/assets/uploads/files/1689210872630-2.png)](https://community.memfiredb.com/assets/uploads/files/1689210872630-2.png)

出自 [https://www.postgresql.org/docs/15/ddl-priv.html](https://www.postgresql.org/docs/15/ddl-priv.html)

然而，你可能无法轻松访问 `psql` ；你可能可以通过Redash、Retool、Grafana等方式运行一个只读查询，但不能使用 `psql` 。即使在这种情况下，你也可以在PostgreSQL内部表上运行 `SELECT` 查询，以查看与 `psql` 命令相同的信息。 `psql` 命令在底层也会查询这些PostgreSQL内部表，并以友好的方式显示它们。你可以在https://github.com/postgres/postgres/blob/f4a9422c0c37ba638adbab853b8badb98a53ce04/src/bin/psql/describe.c#L3850 找到 `psql` 的 `\dt` （显示表格）实现，那里有一个 `SELECT` 语句。以下是一些权限查询的示例。

对象类型询问数据库选择数据名，pg_catalog.pg_get_userbyid（datdba），datacl FROM pg_database；模式选择 nspname, pg_catalog.pg_get_userbyid(nspowner), nspacl FROM pg_namespace;桌子SELECT relname, relacl FROM pg_class WHERE relacl IS NOT NULL AND relname NOT LIKE 'pg_%';默认权限从 pg_default_acl 中选择 pg_catalog.pg_get_userbyid(defaclrole)、defaclobjtype、defaultacl；

每个 ACL 条目都以缩写形式显示，看起来像`arwdDxt`. 每个特权都缩短为一个字符。例如`r`在`arwdDxt`is`SELECT`和`w`is 中`INSERT`。你可以在帮助文档中看到映射。

[![3.png](https://community.memfiredb.com/assets/uploads/files/1689210884549-3.png)](https://community.memfiredb.com/assets/uploads/files/1689210884549-3.png)

### 概括

PostgreSQL 访问控制机制是基于角色、对象和权限构建的。有一种方法可以自动为新对象设置权限。为了查看当前配置，你可以使用`psql`CLI 或直接查询 PostgreSQL 内部表。
