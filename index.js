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
const message_api = api_base + "send_group_message";
app.post('/bot', (req, res) => {
    console.log(req.body);
    res.sendStatus(200);
    var {
        content,
        sender,
        sender_uid,
        group,
        group_uid
    } = req.body;
    if (gpid.includes(group_uid) || !/ddbot消息/.test(content) || !/@/.test(content)) {
        switch (true) {
            case /我永远喜欢/.test(content):
                var content = content.match(triggerWord).input.replace(/[&\/\\#,+()$@~%:*?<>!{}]/g, '');
                var name = content.split("我永远喜欢")[1];
                if (name !== "" && req.body.from !== "api") {
                    const data = new Object;
                    data.user = sender;
                    data.userId = sender_uid;
                    data.idol = name;
                    data.group = group;
                    data.groupId = group_uid;
                    userCollection.find({
                        idol: data.idol,
                        userId: data.userId
                    }, (err, dep) => {
                        if (err) throw err;
                        else {
                            if (dep.length !== 0) {
                                console.log(dep)
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
                                userCollection.save(data, (err, docs) => {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        userCollection.find({
                                            userId: docs.userId
                                        }, (err, user) => {
                                            if (err) throw err;
                                            else {
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
            case /!ddbot/.test(content):
                var content = content.match(botWord).input.replace(/[&\/\\#,+()$~%.:*?<>!{}]/g, '');
                var arr = content.split(" "),
                    result = arr.splice(0,2);
                    result.push(arr.join(" "));
                var keyword = result;
                console.log(keyword)
                var command = keyword[1];
                if (keyword[2]) var query = keyword[2];
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
                    case "lookup":
                        if (!query) {
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
                            var query = parseInt(query);
                            userCollection.find({
                                userId: query
                            }, (err, docs) => {
                                if (err) throw err;
                                else {
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
                                            var message = `ddbot消息:\n@${sender_uid},${docs[0].user}(${docs[0].userId}),是个dd,一共推${docs.length}个偶像,\nTA推的第一个偶像是${docs[0].idol}\n最近推的偶像是${docs[docs.length-1].idol}`;
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
                    case "help":
                        var message =
                            `
ddbot 帮助:\n
自动检测dd: 我永远（喜欢）...
手动命令:\n
about -> 关于机器人
lookup qq_id -> 用qq号(qq_id)来查询TA的圈
list qq_id -> 用qq号(qq_id)来查询TA推的前10个idol
idol xxx -> 查询在群里被推的idol
unlink xxx -> 解推一个idol
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
                    case "idol":
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
                            console.log(query)
                            userCollection.find({
                                idol: query
                            }, (err, docs) => {
                                if (err) {
                                    throw err
                                } else {
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
                                        if (docs.length !== 1)
                                            var message =
                                                `
ddbot消息:\n
您查询的idol 「${docs[0].idol}」
被${docs.length}个人推过,
第一个推TA的是->${docs[0].user}(${docs[0].userId}),
最近一个推TA的是->${docs[docs.length-1].user}(${docs[docs.length-1].userId})
    `;
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
                        case "unlink":
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
                        } else{
                            userCollection.findOne({
                                userId:sender_uid,
                                idol:query
                            },(err,docs)=>{
                                if(err) throw err;
                                else{
                                    if(!docs){
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
                                    }else{
                                        userCollection.remove({
                                            _id:mongojs.ObjectId(docs._id)
                                        },(err,remove)=>{
                                            if(err) throw err;
                                            else{
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
                        case "list":
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
                        } else{
                            userCollection.find({
                                userId:sender_uid
                            }).limit(10,(err,docs)=>{
                                if(err){
                                    throw err
                                }else{
                                    var message = `ddbot消息:\n@${sender_uid},${docs[0].userId}的偶像推列表为（MongoDB数据,只取前10）\n ${JSON.stringify(docs,null,2)}`
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
                        break;
                    default:
                        res.sendStatus(200);
                        break;
                }
        }
    }
})
app.get('/bot',(req,res)=>{
    res.send('ok');
})
app.listen(3000);
