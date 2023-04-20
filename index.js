const express = require("express");
const bodyParser = require('body-parser');
const bcrypt = require("bcrypt");
const { reWeb, saveUser, addUser } = require("./db/signup");
const { generateQR } = require("./functions/QR");
const path = require("path");
const { Server } = require("socket.io");
const { findQR, findUser, findQR_d } = require('./db/auth');
const jwt = require("jsonwebtoken");
const { v4 } = require('uuid');
const http = require('http');

var cors = require('cors');

const app = express();

const PORT = process.env.PORT || 8000;
const server = http.createServer(app);

var allowlist = ['http://localhost:8000', 'http://localhost:2000'];
// var allowlist = JSON.parse(process.env.ALLOW_LIST);
// console.log(allowlist);
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

// app.get("/", async (req, res)=>{
//     var img = await generateQR("facebook.com:dkdkdkkd:887171188181");
//     res.send(`<img src="${img}">`);
// });

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
    var resp = await generateQR({ user_id, password }, req.header("Origin"), device_id, "register");
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
    // console.log(req.body);
    console.log(req.header("Origin"), device_id)
    try{
        res.send(resp);
    }catch(err){
        console.log(err);
        res.send({ status: 500, msg: "Internal Server Error" })
    }
});

app.get("/d/credsafe", (req, res)=>{
    res.download(path.join(__dirname, "app/credsafe_android.apk"));
});


function formatdata(data){
  return data.split(">");
}

const io = new Server(server, {
  cors: {
    origin: allowlist,
    credentials: true
  }
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on("join_id", (d)=>{
    socket.join(d);
    console.log("A User Joined", d);
  });
  try{
    var id = v4();
    socket.emit("device_id", {
      status: 200,
      id: id
    });
    socket.join(id);
  }catch(err){
    socket.emit("device_id", {
      status: 500,
      id: "error"
    });
  }
  socket.on("connectapp", async (d)=>{
    // {
    //   id: 'aca67b9d-636c-475b-8042-ac1f8dca2936',
    //   data: 'https://support.lenovo.com/qrcode?sn=PF19CK87&mtm=81UT00LKIN'
    // }
    socket.join(d.id);
    var temp_data = formatdata(d.data);
    console.log(temp_data);
    if(temp_data.length < 4 || new Date(temp_data[2]).toString() == "Invalid Date" || ["register", "login"].indexOf(temp_data[3]) < -1){
      io.to(d.id).emit("connectapp", {
        status: 400
      });
    }else{
      var f = await findQR({ qr_data: d.data });
      var f2 = await findUser(d.id);
      if(f == 1 && f2 == 1){
        io.to(d.id).emit("connectapp", {
          status: 200
        });
        // if(temp_data[3] == "register"){
        io.to(temp_data[1]).emit("waiting_re", "Scanned By App, Waiting for Confirmation");
        // }else{
        //   io.to().emit("", {

        //   });
        // }
      }else{
        io.to(d.id).emit("connectapp", {
          status: 400
        });
      }
    }
  });

  socket.on("scancomplete", async (d)=>{
    // {
    //   status: 200,
    //   msg: [
    //     'https://support.lenovo.com/qrcode?sn=PF19CK87&mtm=81UT00LKIN',
    //     '1a0a5192-45b9-4c7c-95ec-5292ffc3e440'
    //   ]
    // }
    if(d.status == 200) {
      var temp_data = formatdata(d.msg.data);
      var data;
      if(temp_data[3] == "register"){
        data = d.msg.user_id;
      }else{
        var id = v4();
        data = jwt.sign({ id: d.msg.user_id }, id);
        var f = await findQR_d(d.msg.data);
        io.to(f.website_id).emit("keys", id);
      }
      console.log(d.msg.data);
      io.to(temp_data[1]).emit("pro_done", {
        status: 200,
        data: data
      });
      // }else{
      //   io.to(temp_data[1]).emit("pro_done");
      // }
    }
    // console.log(d);
  });

  socket.on("user_signup", async (d)=>{
    var resp = await addUser({ id: d.data });
    socket.join(d.data);
    // console.log(d);
    // console.log(resp);
    io.to(d.data).emit("user_signup", { status: 200 });
  });

});

server.listen(PORT, () => {
  console.log(`listening on http://localhost:${PORT}`);
});

// app.listen(PORT, ()=>{
//     console.log(`Server Listening on http://localhost:${PORT}`);
// });