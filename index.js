const express = require('express');
var bodyParser = require('body-parser');
const axios = require('axios');
const mongojs = require('mongojs');


const app = express();

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.post('/bot',(req,res)=>{
    console.log(req.body);
    res.sendStatus(200);
})

app.listen(3000);