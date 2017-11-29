//Import Module
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const mongojs = require('mongojs');
//Config Working Env
const db = mongojs('localhost:27017/ddbot');
const app = express();
//Config Database
const userCollection = db.collection('user');
const idolCollection = db.collection('idol');
//Config Express Setting
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.post('/bot',(req,res)=>{
    console.log(req.body);
    res.sendStatus(200);
})

app.listen(3000);