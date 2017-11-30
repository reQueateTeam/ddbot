# ddbot
qq群dd机器人(API基于Mojo::qq)，数据库基于MongoDB

# 使用方法

1.先按照 [@sjdy521 Mojo-Webqq](https://github.com/sjdy521/Mojo-Webqq) 安装好Perl和Mojo::qq,并开启日志上报版api（Express服务器在3000端口监听,Perl在5000端口监听,运行MongoDB服务器(运行27017端口))

2.`git clone https://github.com/DDMoment/ddbot/ && cd ddbot`

3.在repo根目录创建一个叫`group.js`的JavaScript Module

3.(继续)

样例`group.js`文件
```
module.exports = [
    123123123 //在此输入群号,使用','如果要运行在多个qq群里
]
```

4.开启perl API服务器

5.`npm install && npm start`

6.完成,如果出bug别忘来开issue和pr哦！
