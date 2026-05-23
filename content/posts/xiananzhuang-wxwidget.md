---
title: "先安装 wxwidget"
date: 2023-08-29
description: "安装 Cmake"
categories: ["索引"]
tags: ["参数配置", "安装部署"]
series: []
---

安装 Cmake

```bash
wget https://cmake.org/files/v3.12/cmake-3.12.3.tar.gz

./configure --prefix=/usr/local/cmake 
make -j 8
make install
```

# 先安装 wxwidget

在CentOS 7上安装wxWidgets可以按照以下步骤进行：

1. 打开终端并以root用户身份登录或使用sudo权限。

2. 更新系统软件包列表以确保您使用的是最新版本的软件包：
  
   ```
   yum update
   ```

3. 安装所需的编译工具和依赖项：

   ```
   yum groupinstall "Development Tools"
   yum install gtk2-devel
   ```

4. 下载并解压wxWidgets源代码。您可以从wxWidgets官方网站下载最新的稳定版本：
  
   ```
   wget https://github.com/wxWidgets/wxWidgets/releases/download/v3.1.5/wxWidgets-3.1.5.tar.bz2
   tar -xvf wxWidgets-3.1.5.tar.bz2
   cd wxWidgets-3.1.5
   ```

5. 配置并构建wxWidgets：

   ```
   ./configure --prefix=/usr/local/wxwidgets  --with-gtk ; make -j8 && make install 
   ```
   
6. 安装完成后，您可以验证wxWidgets是否正确安装：

   ```
   wx-config --version
   ```

7. 如果输出显示了安装的版本号，则说明wxWidgets已成功安装在您的CentOS 7系统上。

​		请注意，这些步骤可能因系统和软件包版本而有所不同。

​		在实际操作中，根据系统的情况，可能需要进行一些额外的调整。如果遇到问题，您可以参考wxWidgets官方文档或在开发社区中寻求帮助。

# 环境变量处理

```bash
cat >> ~/.bash_profile <<"EOF"
export PATH=/usr/local/cmake/bin:$PATH
export PATH=/usr/local/wxwidgets/bin:$PATH
export LD_LIBRARY_PATH=/usr/local/wxwidgets/lib:/usr/local/pgsql/lib:/usr/local/boost/lib:$LD_LIBRARY_PATH
EOF

. ~/.bash_profile
ldconfig
```

# 编译安装 boost

```bash
 下载 boost 源码
 解压
 ./bootstrap.sh --prefix=/usr/local/boost
 ./b2 install --prefix=/usr/local/boost  --with=all
```

# 编译安装 pgagent

```bash
# 下载
wget https://github.com/pgadmin-org/pgagent/archive/refs/tags/pgagent-4.2.2.tar.gz

# 安装
cmake .
make -j8 && make install 
```

# 使用

```sql
do $$
declare
    job_id int;
begin
    /* add a job and get its id: */
    insert into 
        pgagent.pga_job (jobjclid, jobname) 
    values 
        (1 /*1=Routine Maintenance*/, 'my job name') 
    returning 
        jobid 
    into 
        job_id;
    /* add a step to the job: */
    insert into 
        pgagent.pga_jobstep (jstjobid, jstname, jstkind, jstcode, jstdbname) 
    values 
        (
            job_id, 
            'my step name', 
            's',                    /* sql step */
            'insert into public.test (id) values(random()*(25-10)+10) ',  /* the sql to run */
            'test'                  /* the name of the database to run the step against */
        );
    /* add a schedule to the job. This one runs every minute: */
    insert into
        pgagent.pga_schedule (jscjobid, jscname) 
    values 
        (job_id, 'my schedule name');
end $$; 
```

>  参考: 
>
> [Install Boost library from source on CentOS 7. (github.com)](https://gist.github.com/1duo/2d1d851f76f8297be264b52c1f31a2ab)
>
> [pgAgent编译安装及配置(详细) - 墨天轮 (modb.pro)](https://www.modb.pro/db/159134)
>
> [pgagent浅析 - 墨天轮 (modb.pro)](https://www.modb.pro/db/1694530038595145728)
>
> [PgAgent源码安装_Meepoljd的博客-CSDN博客](https://blog.csdn.net/Meepoljd/article/details/123258719)
>
> [CentOS 7 安装Boost 1.61_51CTO博客_centos安装boost](https://blog.51cto.com/u_5048284/3688925)
>
> [software installation - How to install a custom boost version in CentOS? - Unix & Linux Stack Exchange](https://unix.stackexchange.com/questions/98918/how-to-install-a-custom-boost-version-in-centos)
>
> 

