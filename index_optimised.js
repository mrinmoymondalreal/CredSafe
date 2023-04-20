require('dotenv').config()

// Libraries
const express = require("express");
const bodyParser = require('body-parser');
const bcrypt = require("bcrypt");
const { Server } = require("socket.io");
// const jwt = require("jsonwebtoken");
// const { v4 } = require('uuid');
const http = require('http');

// custom function files
const { generateQR } = require("./function/QR");
const { reWeb, saveUser, addUser } = require("./db/signup");
// const { findQR, findUser, findQR_d } = require('./db/auth');

const PORT = process.env.PORT || 8000;
const app = express();
const server = http.createServer(app);

var allowlist = JSON.parse(process.env.ALLOW_LIST);
var corsOptionsDelegate = function (req, callback) {
  var corsOptions;
  if (allowlist.indexOf(req.header('Origin')) !== -1) {
    corsOptions = { origin: true } // reflect (enable) the requested origin in the CORS response
  } else {
    corsOptions = { origin: false } // disable CORS for this request
  }
  callback(null, corsOptions) // callback expects two parameters: error and options
}

// app.use(require('cors')(corsOptionsDelegate));
app.use(require('cors')({
  origin: "*"
}));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// TO register and configure website with us 
app.post("/reWeb", async (req, res)=>{
  const { web_name, web_url, password, username } = req.body;
  try{
    var newPass = await bcrypt.hash(password, 10);
    var resp = await reWeb({ web_name, web_url, password: newPass, username });
    res.status(resp.status).send(resp);
  }catch(err){
    res.status(500).send({status: 500, message: "Internal Server Error"});
  }
});

app.get("/credsafe_script", async (req, res)=>{
  res.sendFile(path.join(__dirname, "script.credsafe.js"));
});

// TO save user who register with certain website/app.
app.post("/confirm", async (req, res)=>{
  const { status, user_id, id, password } = req.body;
  try{
    if(status == 1){
      var resp = await saveUser({ token: user_id, doc: { user_id: id }, password });
      res.status(resp.status).send(resp);
    }else{
      res.status(200).send({status: "200", message: "confirmation recieved"})
    }
  }catch(err){
    console.log(err);
    res.status(500).send({status: 500, message: "Internal Server Error"});
  }
});

// TO give QR code for registration
app.post("/r/getQR", async (req, res)=>{
  const { token, device_id } = req.body;
  try{
    var resp = await generateQR({ token, origin: req.header("Origin") }, device_id, "register");
    res.status(resp.status).send(resp);
  }catch(err){
    res.status(500).send({ status: 500, message: "Internal Server Error" })
  }
});

// TO get QR request for Register & give it to Webiste/App
app.post("/l/getQR", async (req, res)=>{
  const { token, device_id } = req.body;
  try{
    var resp = await generateQR({ token, origin: req.header("Origin") }, device_id, "login");
    res.status(resp.status).send(resp);
  }catch(err){
    res.status(500).send({ status: 500, message: "Internal Server Error" });
  }
});


const io = new Server(server, {
  cors: {
    origin: "*",
    credentials: true
  }
});

require("./socket.js")(io);

server.listen(PORT, () => {
  console.log(`listening on http://localhost:${PORT}`);
});