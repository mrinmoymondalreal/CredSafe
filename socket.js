const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const { v4 } = require('uuid');
const { addUser } = require('./db/signup');
const { findQR, findUser, findQR_d } = require('./db/auth');
const jwt = require("jsonwebtoken");


function formatdata(data){
  return data.split(">");
}

const io = new Server(server, {
  cors: {
    origin: [ 'http://localhost:2000' ],
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
  })

  socket.on("user_signup", async (d)=>{
    var resp = await addUser({ id: d.data });
    socket.join(d.data);
    // console.log(d);
    // console.log(resp);
    io.to(d.data).emit("user_signup", { status: 200 });
  });

});

server.listen(3000, () => {
  console.log('listening on *:3000');
});