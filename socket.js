const { checkUserExists, findQR, findUser, findQR_d, checkUserByWebsite } = require("./db/auth");
const { v4 } = require("uuid");
const { addUser } = require("./db/signup");
const jwt = require("jsonwebtoken");

function formatdata(txt){
  var f = txt.split(">");
  // console.log(f.length < 4, ["register", "login"].indexOf(f[3]), new Date(f[2]).toString() == "Invalid Date");
  if(f.length < 4 || ["register", "login"].indexOf(f[3]) < -1 || new Date(f[2]).toString() == "Invalid Date") return null;
  const data = {
    web_url: f[0],
    device_id: f[1],
    date: f[2],
    type: f[3]
  }
  return data;
}

module.exports = (function(io){
  var records = [];
  io.on("connection", (socket) => {
    console.log("a user connected")
    socket.on("generate_id", async (d)=>{
      var f = await checkUserExists({ token: d.token, origin: socket.handshake.headers.origin || '' });
      console.log(d, f);
      // hove to remove f == 2
      if(f == 1) { 
        socket.emit("generate_id", { status: 200, data: v4() });
      }else{
        socket.emit("generate_id", { status: 400 });
      }
    })

    socket.on("join_id", async (d)=>{
      console.log(d, socket.handshake.headers.origin);
      var f = await checkUserExists({ token: d.token, origin: socket.handshake.headers.origin || '' });
      console.log("Join", f);
      if(f == 1 || f == 2) { 
        socket.join(d.device_id || d.user_id);
        io.to(d.device_id || d.user_id).emit("join_id", { status: 200 });
        // TO be removed after testing
        // setTimeout(()=>(io.to(d.device_id || d.user_id).emit("waiting_re", {status: 200, message: "scanned by app, waiting for confirmation"})), 2000);
        // setTimeout(()=>(io.to(d.device_id || d.user_id).emit("pro_done", {
        //   status: 200,
        //   data: "tokenkknjkbnfndbkx bnmxb "
        // })), 5000);
      }else{
        socket.emit("join_id", { status: 400 })
      }
    });

    socket.on("connectapp", async (d)=>{
      socket.join(d.id);
      var temp_data = formatdata(d.data);
      if(temp_data){
        var f = await findQR({ qr_data: d.data });
        var f2 = await findUser(d.id);
        if(f == 1 && f2 == 1){
          var f3 = await checkUserByWebsite(d.id, temp_data.web_url);
          if(temp_data.type == 'login' && f3 == 1){
            records.push({ key: d.id, value: d.data });
            io.to(d.id).emit("connectapp", { status: 200 });
            io.to(temp_data.device_id).emit("waiting_re", {status: 200, message: "scanned by app, waiting for confirmation"});
          }else if(temp_data.type == "register"){
            io.to(temp_data.device_id).emit("waiting_re", {status: 200, message: "scanned by app, waiting for confirmation"});
            io.to(d.id).emit("connectapp", { status: 200 });
          }else{
            io.to(d.id).emit("connectapp", { status: 400 });
          }
        }else{
          io.to(d.id).emit("connectapp", {status: 400, message: "invalid qr"});
        }
      }else{
        io.to(d.id).emit("connectapp", {status: 400, message: "invalid qr"});
      }
    });

    socket.on("scancomplete", async (d)=>{
      // {
      //   status: 200,
      //   message: [
      //     'https://support.lenovo.com/qrcode?sn=PF19CK87&mtm=81UT00LKIN',
      //     '1a0a5192-45b9-4c7c-95ec-5292ffc3e440'
      //   ]
      // }

      if(d.status == 200) {
        var temp_data = formatdata(d.message.data);
        var data, status;
        if(temp_data.type == "register"){
          data = d.message.user_id;
          status = 200;
          io.to(temp_data.device_id).emit("pro_done", {
            status,
            data: data
          });
        }else{
          console.log("h");
          if(records.some((e)=> ( e.key == d.message.user_id && e.value == d.message.data ) )){
            var id = v4();
            data = jwt.sign({ id: d.message.user_id }, id);
            var f = await findQR_d(d.message.data);
            io.to(f.website_id).emit("keys", id);
            status = 200;
            io.to(temp_data.device_id).emit("pro_done", {
              status,
              data: data
            });
          }
        }
      }
    });

    socket.on("user_signup", async (d)=>{
      var resp = await addUser({ id: d.data });
      socket.join(d.data);
      io.to(d.data).emit("user_signup", { status: 200 });
    });
    
  });
});