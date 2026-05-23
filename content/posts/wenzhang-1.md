---
title: "文章 1"
date: 2023-06-19
description: "目前有两种方法可以实现，这两种方法都需要机器有两块网卡，例 eth0为内网，eth1为公网ip,两台机器的eth1上分别绑定公网ip都要能正常使用。"
categories: ["流复制"]
tags: ["参数配置", "备份恢复", "流复制", "高可用"]
series: []
---

# 文章 1
[部署三台主机，实现 keepalived VIP的高可用_51CTO博客_keepalived两台同时有vip](https://blog.51cto.com/u_8845692/2395485)


# 文章 2
[一个公网IP如何配置 keepalived 实现vip设置为公网IP - 红海螺 (hhailuo.com)](http://www.hhailuo.com/archives/18546)


## [一个公网IP如何配置 keepalived 实现vip设置为公网IP](http://www.hhailuo.com/archives/18546)

目前有两种方法可以实现，这两种方法都需要机器有两块网卡，例 eth0为内网，eth1为公网ip,两台机器的eth1上分别绑定公网ip都要能正常使用。

例：  
A机器ip为： 192.168.10.10  
B机器ip为： 192.168.10.11  
公网ip为： 123.123.123.123 网关：123.123.123.1 掩码：255.255.255.240

第一种：  
1，先设置A机器与B机器的eth1的网卡配置配置文件，不要设置公网ip信息

![](https://pic4.zhimg.com/80/5e3887baf130a2a694190fb119d803dd_hd.jpg)

  
2,配置A机器keepalived.conf（B机器请修改MASTER为BACKUP，priority的值小于100，其他不变）  
  

![](https://pic1.zhimg.com/80/2ee8af540b68274403703ff5b2d3bebf_hd.jpg)

  
上图中需要解释的配置如下：  
virtual_ipaddress {  
123.123.123.123/28 dev eth1  
} ##设置 在 eth1网卡上绑定 123.123.123.123 掩码为 240的公网ipvirtual_routes {  
default via 123.123.123.1  
} ## 设置默认网关为 123.123.123.1

3，两边分别启动keepalived，并查看A主机的eth1网卡是否绑定公网ip 123.123.123.123。停止A主机的keepalived，查看B主机是否正常绑定公网ip。

第二种：（这种较麻烦，需要借助脚本）  
1，先设置A机器与B机器的eth1的网卡配置配置文件，配置好公网的ip信息，不设置公网的网关

![](https://pic4.zhimg.com/80/19c97b837a38763a9e0cb03aa8b9ae2e_hd.jpg)

  
2，分别停止A机器与B机器的eth1网卡（ifdown eth1）3,配置A机器的keepalived.conf配置文件（B机器请修改MASTER为BACKUP，priority的值小于100，其他不变）

![](https://pic1.zhimg.com/80/d19dfc7d611d9f58264db63bc0a73bca_hd.jpg)

4，配置/etc/keepalived/scripts/master.sh脚本，并赋予可执行权限，判断公网ip是否在本机，如不在，执行启动eth1操作，并添加默认网关  
  

![](https://pic4.zhimg.com/80/687eefc1ffa29897117ff793534b5ceb_hd.jpg)

  
5，配置/etc/keepalived/scripts/slave.sh脚本，并赋予可执行权限，执行停止 eth1操作  
  

![](https://pic4.zhimg.com/80/3d631ff1aa987dc8ec1e264d5a9f0004_hd.jpg)

  
6，两边分别启动keepalived，并查看A主机的eth1网卡有没有启动，是否绑定公网ip 123.123.123.123。停止A主机的keepalived，查看B主机的网卡有没有启动，是否正常绑定公网ip。

# 文章 3
[PG高可用之主从流复制+keepalived 的高可用 – 小麦苗DBA宝典 (xmmup.com)](https://www.xmmup.com/pggaokeyongzhizhucongliufuzhikeepalived-degaokeyong.html#keepalivedconf)



总体思路是
```bash
vrrp_script check_pg_alived {

   script "/etc/keepalived/check_pg.sh"

   interval 10

   fall 3

}
```

根据 check_pg. sh 这个脚本的返回值
如果是 0 则正常不变
如果是 1 则执行
notify_master 与 notify_backup 处的脚本



# 额外博文
[一次 Keepalived 高可用的事故，让我重学了一遍它！ | HeapDump性能社区](https://heapdump.cn/article/4049495)

