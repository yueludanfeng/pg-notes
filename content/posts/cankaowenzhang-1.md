---
title: "参考文章 1"
date: 2023-07-06
description: "* PG14版本还引入了 client_connection_check_interval 参数,每隔一段时间检测 client 是否离线，如果已经离线，则快速结束掉正在运行的 query，防止连接已经失效了，但是还在执行查询返回给客户端，"
categories: ["PostgreSQL 笔记"]
tags: ["参数配置"]
series: []
---

[(1条消息) Postgresql中TCP keepalive相关设置使用_tcp_keepalives_idle_魂醉的博客-CSDN博客](https://blog.csdn.net/dazuiba008/article/details/123069656)


* PG14版本还引入了 client_connection_check_interval 参数,每隔一段时间检测 client 是否离线，如果已经离线，则快速结束掉正在运行的 query，防止连接已经失效了，但是还在执行查询返回给客户端，浪费数据库资源。默认是0，单位默认毫秒。


# 参考文章 2
[TCP keepalive for a better PostgreSQL experience - CYBERTEC (cybertec-postgresql.com)](https://www.cybertec-postgresql.com/en/tcp-keepalive-for-a-better-postgresql-experience/)



tcp_keepalive_intvl (integer; default: 75; since Linux 2.4)
       The number of seconds between TCP keep-alive probes.

tcp_keepalive_probes (integer; default: 9; since Linux 2.2)
       The  maximum  number  of  TCP  keep-alive  probes  to send before giving up and killing the connection if no
       response is obtained from the other end.

tcp_keepalive_time (integer; default: 7200; since Linux 2.2)
       The number of seconds a connection needs to be idle before TCP begins sending out keep-alive probes.   Keep-
       alives  are  sent only when the SO_KEEPALIVE socket option is enabled.  The default value is 7200 seconds (2
       hours).  An idle connection is terminated after approximately an additional 11 minutes (9 probes an interval
       of 75 seconds apart) when keep-alive is enabled.
————————————————
版权声明：本文为 CSDN 博主「魂醉」的原创文章，遵循 CC 4.0 BY-SA 版权协议，转载请附上原文出处链接及本声明。
原文链接： https://blog.csdn.net/dazuiba008/article/details/123069656
75*(9-1) + 60 = 660s = 11min


以下是博主的设置，这样可以在 5 分钟以内就探测出无效连接
tcp_keepalives_idle = 60                # TCP_KEEPIDLE, in seconds;
tcp_keepalives_interval = 20            # TCP_KEEPINTVL, in seconds;
tcp_keepalives_count = 10               # TCP_KEEPCNT;
————————————————
版权声明：本文为 CSDN 博主「魂醉」的原创文章，遵循 CC 4.0 BY-SA 版权协议，转载请附上原文出处链接及本声明。
原文链接： https://blog.csdn.net/dazuiba008/article/details/123069656

60+ 20*(10-9)+60 = 300s = 5min
