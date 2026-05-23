---
title: "代码实现"
date: 2024-08-30
description: "```bash"
categories: ["参数配置"]
tags: ["PostgreSQL"]
series: []
---

```bash
echo "===========获取数据库创建时间==========="
data_dir=$(psql -U postgres -d postgres -X -qAt -c "show data_directory" )
db_dirs=$(ls $data_dir/base |grep -v pgsql_tmp)
for db_oid in $db_dirs
do
	db_exists=$(psql -U postgres -d postgres -X -qAt -c "select count(*) from pg_database where oid=$db_oid and datname not in ('postgres','template0','template1')") 
	if [ $db_exists -eq 1 ];then
		db_name=$(psql -U postgres -d postgres -X -qAt -c "select datname from pg_database where oid=$db_oid and datname not in ('postgres','template0','template1')")
		echo $db_name
		/bin/stat -c "%y" `ls $data_dir/base/$db_oid/PG_VERSION`
	fi
done

echo -e "\n===========获取用户创建时间==========="
# 前提 track_commit_timestamp  设置为 on 
psql -c "select rolname, pg_xact_commit_timestamp(xmin) from pg_authid where rolpassword is not null;"

# 获取集群初始化时间
SELECT version() AS "Version", 
to_timestamp (system_identifier >> 32) as clusterinit_timestamp
FROM pg_control_system();
```
