const express = require("express");
const bodyParser = require('body-parser');
const bcrypt = require("bcrypt");
const { reWeb, saveUser, addUser } = require("./db/signup");
const { generateQR } = require("./functions/QR");
const path = require("path");

var cors = require('cors');

const app = express();

const PORT = process.env.PORT || 8000;

var allowlist = ['http://localhost:8000', 'http://localhost:2000']
var corsOptionsDelegate = function (req, callback) {
  var corsOptions;
  if (allowlist.indexOf(req.header('Origin')) !== -1) {
    corsOptions = { origin: true } // reflect (enable) the requested origin in the CORS response
  } else {
    corsOptions = { origin: false } // disable CORS for this request
  }
  callback(null, corsOptions) // callback expects two parameters: error and options
}

app.use(cors(corsOptionsDelegate));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", async (req, res)=>{
    var img = await generateQR("facebook.com:dkdkdkkd:887171188181");
    res.send(`<img src="${img}">`);
});

app.get("/signup", async (req, res)=>{
    res.sendFile(path.join(__dirname, "frontend/signup.html"));
});

app.post("/reWeb", async (req, res)=>{
    const { web_name, web_url, password, username } = req.body;
    var newPass = await bcrypt.hash(password, 10);
    var resp = await reWeb({ web_name, web_url, password: newPass, username });
    res.send(resp);
});

app.post("/saveUsers", async (req, res)=>{
    const { user_id, username, user_cred, linked_app_id, password } = req.body;
    var resp = await saveUser({ user_id, username, user_cred, linked_app_id, password });
    res.send(resp);
});

app.post('/reUser', async (req, res)=>{
    var resp = await addUser({ id: req.body.id });
    if(resp != null) res.send({status: 200});
    else res.send({status: 400});
});

app.get("/getQR", (req, res)=>{
    const { user_id, username, password } = req.body;
});

app.post("/r/getQR", async (req, res)=>{
    const { user_id, password, device_id } = req.body;
    var resp = await generateQR({ user_id, password }, req.header("Origin"), user_id, "register");
    // console.log(req.header("Origin"), device_id)
    try{
        res.send(resp);
    }catch(err){
        res.send({ status: 500, msg: "Internal Server Error" })
    }
});

app.post("/l/getQR", async (req, res)=>{
    const { user_id, password, device_id } = req.body;
    var resp = await generateQR({ user_id, password }, req.header("Origin"), device_id, "login");
    // console.log(req.header("Origin"), device_id)
    try{
        res.send(resp);
    }catch(err){
        res.send({ status: 500, msg: "Internal Server Error" })
    }
});

app.get("/d/credsafe", (req, res)=>{
    res.download(path.join(__dirname, "app/credsafe_android.apk"));
})

app.listen(PORT, ()=>{
    console.log(`Server Listening on http://localhost:${PORT}`);
});