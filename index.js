/*
    Copyright (C) <2017>  <github.com/ssysm>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation,version 3 of the License

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
//Import Module
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const mongojs = require('mongojs');
const querystring = require('querystring');
//Config Working Env
const db = mongojs('localhost:27017/ddbot');
const app = express();
//Config Database
const userCollection = db.collection('user');
const tagCollection = db.collection('tag');
//Config Express Setting
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({
    extended: true
})); // for parsing application/x-www-form-urlencoded
//Config Software Setting
const gpid = require('./group')
const triggerWord = "我永远喜欢";
const botWord = "!ddbot";
//Config QQ API url
const api_base = "http://localhost:5000/openqq/";
const message_api = api_base + "send_group_message"
app.post('/bot', (req, res) => {
    console.log(req.body);
    //TODO: 这个res可能会把程序卡掉
    res.sendStatus(200);
    //es6确定事件变量
    var {
        content,
        sender,
        sender_uid,
        group,
        group_uid
    } = req.body;
    //确认发送群在群白名单(group.js)
    if (gpid.includes(group_uid)) {
        //防止有人 “@我永远喜欢xxx”
        if (!content.match("@我")) {
            //防止自行反射命令
            if (!content.match("ddbot消息") && req.body.sender_uid !== req.body.receiver_uid) {
                switch (true) {
                    //自动检测部分
                    case /我永远喜欢/.test(content):
                        //cotent filter
                        var content = content.match(triggerWord).input.replace(/[&\/\\#,+()$~%:*?<>{}]/g, '');
                        //f提取名字
                        var name = content.split("我永远喜欢")[1];
                        //确定不是空名字
                        //TODO：确定不是拿空格当名字
                        if (name !== "" && req.body.from !== "api") {
                            //确定对象常量
                            const data = new Object;
                            data.user = sender;
                            data.userId = sender_uid;
                            data.idol = name;
                            data.groupId = group_uid;
                            //查询是否被推
                            userCollection.find({
                                idol: data.idol,
                                userId: data.userId
                            }, (err, dep) => {
                                //直接throw错误
                                if (err) throw err;
                                else {
                                    //如果已经被推
                                    if (dep.length !== 0) {
                                        console.log(dep)
                                        //传出消息
                                        var message = `ddbot消息: \n ${dep[0].user}(${dep[0].userId}),您已经推 ${dep[0].idol},不能再推了`
                                        axios.post(message_api, querystring.stringify({
                                            uid: group_uid,
                                            content: message
                                        }))
                                            .then((response) => {
                                                res.sendStatus(200);
                                            })
                                            .catch((err) => {
                                                res.sendStatus(500);
                                                throw err;
                                            })
                                    } else {
                                        //存储新推&idol
                                        userCollection.save(data, (err, docs) => {
                                            //错误log到console
                                            if (err) {
                                                console.log(err);
                                            } else {
                                                //查询已推
                                                userCollection.find({
                                                    userId: docs.userId
                                                }, (err, user) => {
                                                    if (err) throw err;
                                                    else {
                                                        //发送信息
                                                        var message = `ddbot消息: \n ${docs.user}(${docs.userId})刚刚加推了${docs.idol}\n现在TA一共推${user.length}个偶像`;
                                                        axios.post(message_api, querystring.stringify({
                                                            uid: group_uid,
                                                            content: message
                                                        }))
                                                            .then((response) => {
                                                                res.sendStatus(200);
                                                            })
                                                            .catch((err) => {
                                                                res.sendStatus(500);
                                                                throw err;
                                                            })
                                                    }
                                                })
                                            }
                                        })
                                    }
                                }
                            })
                        }
                        break;
                    //手动触发命令
                    case /!ddbot/.test(content):
                        //filter
                        var content = content.match(botWord).input.replace(/[&\/\\#,+()$~%.:*?<>!{}]/g, '');
                        //截取 command 和 query
                        var arr = content.split(" "),
                            result = arr.splice(0, 2);
                        result.push(arr.join(" "));
                        var keyword = result;
                        console.log(keyword)
                        var command = keyword[1];
                        if (keyword[2]) var query = keyword[2];
                        //command开关
                        switch (command) {
                            case "about":
                                var message = "ddbot:\n Made By github.com/ssysm \n Check Out at : github.com/ddmoment/ddbot\n Under GPLv3.0"
                                axios.post(message_api, querystring.stringify({
                                    uid: group_uid,
                                    content: message
                                }))
                                    .then((response) => {
                                        res.sendStatus(200);
                                    })
                                    .catch((err) => {
                                        res.sendStatus(500);
                                        throw err;
                                    })
                                break;
                            //用qq号查询推圈
                            case "lookup":
                                if (!query) {
                                    //没有query的情况下
                                    axios.post(message_api, querystring.stringify({
                                        uid: group_uid,
                                        content: `ddbot消息:\n @${sender_uid},您没有写出想要查询的qq号,范例:lookup ${sender_uid}`
                                    }))
                                        .then((response) => {
                                            res.sendStatus(200);
                                        })
                                        .catch((err) => {
                                            res.sendStatus(500);
                                            throw err;
                                        })
                                } else {
                                    //将query变成int
                                    var query = parseInt(query);
                                    //查询数据库
                                    userCollection.find({
                                        userId: query
                                    }, (err, docs) => {
                                        //直接throw错误
                                        if (err) throw err;
                                        else {
                                            //没有推
                                            if (docs.length == 0) {
                                                axios.post(message_api, querystring.stringify({
                                                    uid: group_uid,
                                                    content: `ddbot消息:\n @${sender_uid},这个人->${query},啥也不推,╮(╯▽╰)╭)`
                                                }))
                                                    .then((response) => {
                                                        res.sendStatus(200);
                                                    })
                                                    .catch((err) => {
                                                        res.sendStatus(500);
                                                        throw err;
                                                    })
                                            } else {
                                                //单推
                                                if (docs.length == 1) {
                                                    var message = `ddbot消息:\n @${sender_uid},${docs[0].user}(${docs[0].userId},单推${docs[0].idol})`
                                                    axios.post(message_api, querystring.stringify({
                                                        uid: group_uid,
                                                        content: message
                                                    }))
                                                        .then((response) => {
                                                            res.sendStatus(200);
                                                        })
                                                        .catch((err) => {
                                                            res.sendStatus(500);
                                                            throw err;
                                                        })
                                                } else {
                                                    //DD
                                                    var message = `ddbot消息:\n@${sender_uid},${docs[0].user}(${docs[0].userId}),是个dd,一共推${docs.length}个偶像,\nTA推的第一个偶像是${docs[0].idol}\n最近推的偶像是${docs[docs.length - 1].idol}`;
                                                    axios.post(message_api, querystring.stringify({
                                                        uid: group_uid,
                                                        content: message
                                                    }))
                                                        .then((response) => {
                                                            res.sendStatus(200);
                                                        })
                                                        .catch((err) => {
                                                            res.sendStatus(500);
                                                            throw err;
                                                        })
                                                }
                                            }
                                        }
                                    })
                                }
                                break;
                            //帮助
                            case "help":
                                var message =
                                    `
ddbot 帮助:\n
自动检测dd: 我永远（喜欢）...
手动命令(前缀带!ddbot):\n
about -> 关于机器人
lookup qq_id -> 用qq号(qq_id)来查询TA的圈
list qq_id -> 用qq号(qq_id)来查询TA推的idol
idol xxx -> 查询在群里被推的idol
unlink xxx -> 解推一个idol\n
标签命令(前缀带!tag):\n
[tag名字] -> 直接返回在数据库里的tag内容
create [tag名字] [tag内容] -> 创建新内容
delete [tag名字] -> 删除tag
`
                                axios.post(message_api, querystring.stringify({
                                    uid: group_uid,
                                    content: message
                                }))
                                    .then((response) => {
                                        res.sendStatus(200);
                                    })
                                    .catch((err) => {
                                        res.sendStatus(500);
                                        throw err;
                                    })
                                break;
                            //查询idol
                            case "idol":
                                //如果query不存在
                                if (!query) {
                                    axios.post(message_api, querystring.stringify({
                                        uid: group_uid,
                                        content: `ddbot消息:\n @${sender_uid},您没有写出想要查询的idol名字,范例:idol xxx`
                                    }))
                                        .then((response) => {
                                            res.sendStatus(200);
                                        })
                                        .catch((err) => {
                                            res.sendStatus(500);
                                            throw err;
                                        })
                                } else {
                                    //query存在，查询
                                    console.log(query)
                                    //调用数据库
                                    userCollection.find({
                                        idol: query
                                    }, (err, docs) => {
                                        //直接throw错误
                                        if (err) {
                                            throw err
                                        } else {
                                            //没有查询到
                                            if (docs.length == 0) {
                                                var message = `ddbot消息:\n @${sender_uid},您查询的idol 「${query}」不存在`;
                                                axios.post(message_api, querystring.stringify({
                                                    uid: group_uid,
                                                    content: message
                                                }))
                                                    .then((response) => {
                                                        res.sendStatus(200);
                                                    })
                                                    .catch((err) => {
                                                        res.sendStatus(500);
                                                        throw err;
                                                    })
                                            } else {
                                                //查询到被多人推
                                                if (docs.length !== 1)
                                                    var message =
                                                        `
ddbot消息:\n
您查询的idol 「${docs[0].idol}」
被${docs.length}个人推过,
第一个推TA的是->${docs[0].user}(${docs[0].userId}),
最近一个推TA的是->${docs[docs.length - 1].user}(${docs[docs.length - 1].userId})
    `;
                                                //查询到被一人推
                                                //代码by ct
                                                else if (docs.length === 1)
                                                    var message =
                                                        `
ddbot消息:\n
您查询的idol 「${docs[0].idol}」
被${docs.length}个人推过,
第一个和最近一个推TA的都是->${docs[0].user}(${docs[0].userId})
迫真单推?
`;
                                                axios.post(message_api, querystring.stringify({
                                                    uid: group_uid,
                                                    content: message
                                                }))
                                                    .then((response) => {
                                                        res.sendStatus(200);
                                                    })
                                                    .catch((err) => {
                                                        res.sendStatus(500);
                                                        throw err;
                                                    })
                                            }
                                        }
                                    })
                                }
                                break;
                            //解推idol
                            case "unlink":
                                //query不存在
                                if (!query) {
                                    axios.post(message_api, querystring.stringify({
                                        uid: group_uid,
                                        content: `ddbot消息:\n @${sender_uid},您没有写出想要解推的idol名字,范例:unlink xxx`
                                    }))
                                        .then((response) => {
                                            res.sendStatus(200);
                                        })
                                        .catch((err) => {
                                            res.sendStatus(500);
                                            throw err;
                                        })
                                } else {
                                    //query存在，调用数据库
                                    userCollection.findOne({
                                        userId: sender_uid,
                                        idol: query
                                    }, (err, docs) => {
                                        //直接throw错误
                                        if (err) throw err;
                                        else {
                                            //如果没有找到解推的idol
                                            if (!docs) {
                                                var message = `ddbot消息:\n@${sender},您输入的信息有误，请重新输入`
                                                axios.post(message_api, querystring.stringify({
                                                    uid: group_uid,
                                                    content: message
                                                }))
                                                    .then((response) => {
                                                        res.sendStatus(200);
                                                    })
                                                    .catch((err) => {
                                                        res.sendStatus(500);
                                                        throw err;
                                                    })
                                            } else {
                                                //找到解推的idol,执行删除操作
                                                userCollection.remove({
                                                    _id: mongojs.ObjectId(docs._id)
                                                }, (err, remove) => {
                                                    //直接throw错误
                                                    if (err) throw err;
                                                    else {
                                                        //发送信息
                                                        var message = `ddbot消息:\n@${sender_uid},您已经不再推${docs.idol}了`
                                                        axios.post(message_api, querystring.stringify({
                                                            uid: group_uid,
                                                            content: message
                                                        }))
                                                            .then((response) => {
                                                                res.sendStatus(200);
                                                            })
                                                            .catch((err) => {
                                                                res.sendStatus(500);
                                                                throw err;
                                                            })
                                                    }
                                                })
                                            }
                                        }
                                    })
                                }
                                break;
                            //list操作
                            case "list":
                                //query不存在
                                if (!query) {
                                    axios.post(message_api, querystring.stringify({
                                        uid: group_uid,
                                        content: `ddbot消息:\n @${sender_uid},您没有写出想要被查看qqid,范例:list ${sender_uid}`
                                    }))
                                        .then((response) => {
                                            res.sendStatus(200);
                                        })
                                        .catch((err) => {
                                            res.sendStatus(500);
                                            throw err;
                                        })
                                } else {
                                    //将query变成int
                                    var query = parseInt(query);
                                    //执行数据库查询操作
                                    userCollection.find({
                                        userId: query
                                    }, (err, docs) => {
                                        //直接throw错误
                                        if (err) {
                                            throw err
                                        } else {
                                            if (docs.length !== 0) {
                                                //自定义阵列
                                                var minArray = new Array;
                                                //for出最小队列
                                                for (var i = 0; i < docs.length; i++) {
                                                    var minify = new Object;
                                                    minify = docs[i].idol
                                                    minArray.push(minify);
                                                }
                                                //发送信息
                                                /*
                                                注意！ 在这里有些人可能d的太多，腾讯会返回1202
                                                这里可能需要修一下
                                                （dd太可怕了
                                                */
                                                var message = `ddbot消息:\n,${docs[0].user}(${docs[0].userId})的偶像推列表:\n ${JSON.stringify(minArray)}`
                                                axios.post(message_api, querystring.stringify({
                                                    uid: group_uid,
                                                    content: message
                                                }))
                                                    .then((response) => {
                                                        res.sendStatus(200);
                                                    })
                                                    .catch((err) => {
                                                        res.sendStatus(500);
                                                        throw err;
                                                    })
                                            } else {
                                                axios.post(message_api, querystring.stringify({
                                                    uid: group_uid,
                                                    content: `ddbot消息:\n @${sender_uid},Array Not Found or User Not Found`
                                                }))
                                                    .then((response) => {
                                                        res.sendStatus(200);
                                                    })
                                                    .catch((err) => {
                                                        res.sendStatus(500);
                                                        throw err;
                                                    })
                                            }
                                        }
                                    })
                                }
                                break;
                        }
                        break;

                    case /!tag/.test(content):
                        //filter
                        var content = content.replace(/[\/\\<>{}]/g, '');
                        //截取 command 和 query
                        var arr = content.split(" "),
                            result = arr.splice(0, 3);
                        result.push(arr.join(" "));
                        var keyword = result;
                        console.log(keyword)
                        var command = keyword[1];
                        if (keyword[2]) var query = keyword[2];
                        if (keyword[3]) var tag_content = keyword[3];
                        switch (command) {
                            case "create":
                                //query不存在
                                if (!query) {
                                    axios.post(message_api, querystring.stringify({
                                        uid: group_uid,
                                        content: `ddbot消息:\n @${sender_uid},您没有写出想要创建tag内容,范例:!tag create [tag名字] [tag内容]`
                                    }))
                                        .then((response) => {
                                            res.sendStatus(200);
                                        })
                                        .catch((err) => {
                                            res.sendStatus(500);
                                            throw err;
                                        })
                                } else {
                                    if (!tag_content) {
                                        axios.post(message_api, querystring.stringify({
                                            uid: group_uid,
                                            content: `ddbot消息:\n @${sender_uid},您没有写出想要创建tag内容,范例:!tag create [tag名字] [tag内容]`
                                        }))
                                            .then((response) => {
                                                res.sendStatus(200);
                                            })
                                            .catch((err) => {
                                                res.sendStatus(500);
                                                throw err;
                                            })
                                    } else {
                                        tagCollection.findOne({
                                            tag:query,
                                            groupId:group_uid
                                        },(err,docs)=>{
                                            if(err) throw err;
                                            else{
                                                if(!docs){
                                                    var tag = {
                                                        userId: sender_uid,
                                                        user: sender,
                                                        groupId: group_uid,
                                                        tag: query,
                                                        content: tag_content
                                                    }
                                                    tagCollection.save(tag, (err, docs) => {
                                                        if (err) throw err;
                                                        else {
                                                            axios.post(message_api, querystring.stringify({
                                                                uid: group_uid,
                                                                content: `ddbot消息:\n @${sender_uid},tag创建成功,${docs.tag}`
                                                            }))
                                                                .then((response) => {
                                                                    res.sendStatus(200);
                                                                })
                                                                .catch((err) => {
                                                                    res.sendStatus(500);
                                                                    throw err;
                                                                })
                                                        }
                                                    })
                                                }else{
                                                    axios.post(message_api, querystring.stringify({
                                                        uid: group_uid,
                                                        content: `ddbot消息:\n @${sender_uid},tag「${docs.tag}」已经存在`
                                                    }))
                                                        .then((response) => {
                                                            res.sendStatus(200);
                                                        })
                                                        .catch((err) => {
                                                            res.sendStatus(500);
                                                            throw err;
                                                        })
                                                }
                                            }
                                        })
                                    }
                                }
                                break;
                            case "delete":
                                //query不存在
                                if (!query) {
                                    axios.post(message_api, querystring.stringify({
                                        uid: group_uid,
                                        content: `ddbot消息:\n @${sender_uid},您没有写出想要delete的tag,范例:!tag delete [tag name]`
                                    }))
                                        .then((response) => {
                                            res.sendStatus(200);
                                        })
                                        .catch((err) => {
                                            res.sendStatus(500);
                                            throw err;
                                        })
                                } else {
                                    tagCollection.findOne({
                                        tag: query,
                                        groupId: group_uid,
                                        userId: sender_uid
                                    }, (err, docs) => {
                                        if (err) throw err;
                                        else {
                                            if (!docs) {
                                                axios.post(message_api, querystring.stringify({
                                                    uid: group_uid,
                                                    content: `ddbot消息:\n @${sender_uid},您删除的tag不存在`
                                                }))
                                                    .then((response) => {
                                                        res.sendStatus(200);
                                                    })
                                                    .catch((err) => {
                                                        res.sendStatus(500);
                                                        throw err;
                                                    })
                                            } else {
                                                tagCollection.remove({
                                                    _id: mongojs.ObjectId(docs._id)
                                                }, (err, docs) => {
                                                    if (err) throw err;
                                                    else {
                                                        axios.post(message_api, querystring.stringify({
                                                            uid: group_uid,
                                                            content: `ddbot消息:\n @${sender_uid},tag(${docs.tag})删除成功`
                                                        }))
                                                            .then((response) => {
                                                                res.sendStatus(200);
                                                            })
                                                            .catch((err) => {
                                                                res.sendStatus(500);
                                                                throw err;
                                                            })
                                                    }
                                                })
                                            }
                                        }
                                    })
                                }
                                break;
                            default:
                                if (!command) {
                                    axios.post(message_api, querystring.stringify({
                                        uid: group_uid,
                                        content: `ddbot消息:\n @${sender_uid},请输入tag`
                                    }))
                                        .then((response) => {
                                            res.sendStatus(200);
                                        })
                                        .catch((err) => {
                                            res.sendStatus(500);
                                            throw err;
                                        })
                                } else {
                                    tagCollection.findOne({
                                        tag: command,
                                        groupId: group_uid
                                    }, (err, docs) => {
                                        if (err) throw err;
                                        else {
                                            if (!docs) {
                                                axios.post(message_api, querystring.stringify({
                                                    uid: group_uid,
                                                    content: `ddbot消息:\n @${sender_uid},tag「${command}」不存在`
                                                }))
                                                    .then((response) => {
                                                        res.sendStatus(200);
                                                    })
                                                    .catch((err) => {
                                                        res.sendStatus(500);
                                                        throw err;
                                                    })
                                            } else {
                                                axios.post(message_api, querystring.stringify({
                                                    uid: group_uid,
                                                    content: `ddbot消息:\n${docs.content}`
                                                }))
                                                    .then((response) => {
                                                        res.sendStatus(200);
                                                    })
                                                    .catch((err) => {
                                                        res.sendStatus(500);
                                                        throw err;
                                                    })
                                            }
                                        }
                                    })
                                }
                                break;
                        }
                        break;

                    //默认
                    default:
                        res.sendStatus(200);
                        break;
                }
            }
        }
    }
})
app.get('/bot', (req, res) => {
    res.send('ok');
})
//服务器监听端口
app.listen(3000);