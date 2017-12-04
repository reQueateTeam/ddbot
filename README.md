# ddbot
qq群dd机器人(API基于Mojo::Webqq)，数据库基于MongoDB

# 使用方法

1.先按照 [@sjdy521 Mojo-Webqq](https://github.com/sjdy521/Mojo-Webqq) 安装好Perl和Mojo::Webqq,运行MongoDB数据库（Express服务器在3000端口监听,Perl api在5000端口监听,MongoDB数据库无验证可读写在loalhost:27017端口监听)

2.`git clone https://github.com/reQueateteam/ddbot/ && cd ddbot`

3.在repo根目录创建一个叫`group.js`的JavaScript Module

3.(继续)

样例`group.js`文件
```
module.exports = [
    123123123 //在此输入群号,使用','如果要运行在多个qq群里
]
```
4.`npm install && npm start`

5.开启perl API服务器 `perl api.pl`,按照提示扫描二维码登陆

6.完成,如果出bug别忘来开issue和pr哦！
