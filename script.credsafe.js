(function(){
  var socket, func, token, joined = false, callback;
  const screen = document.querySelector(".scr"),
        loading = document.querySelector(".loading"),
        loadingText = document.querySelector(".loading-text");
  const conn = "http://localhost:8000";
  function initScript(callback){
    const script= document.createElement("script");
    script.src = `${conn}/socket.io/socket.io.js`;
    script.onload = function(){callback()};
    document.body.insertBefore(script, document.querySelector("script[c-id='hello']"));
  }
  function isDef(a){
    return !(a == null || a == undefined);
  }

  function initApp(tok){
    token = tok;
    socket = io(conn);
    console.log(!isDef(getDeviceID()));
    !isDef(getDeviceID()) ? socket.emit("generate_id", { token: tok }) : join_room(tok);
    socket.on("generate_id", (d)=>{
      if(d.status == 200){ setDeviceID(d.data); join_room(tok); }
    });
  }
  
  function join_room(tok){
    socket.emit("join_id", { token: tok , device_id: getDeviceID() });
    socket.on("join_id", (d)=>{
      if(d.status == 200) { 
        joined = true;
        if(func){ func == 'register' ? initRegister(callback) : initLogin(callback); }
      }
    })
  }

  async function initLogin(onSucess){
    console.log(joined);
    if(!joined) {func = 'login'; callback = onSucess; return;}
    loading.style.display = "none";
    loadingText.innerHTML = "Loading QR for you";
    var resp = await fetch(`${conn}/l/getQR`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        token: token,
        device_id: getDeviceID()
      })
    });
    resp = await resp.json();
    if(resp.status == 200){
      screen.style.display = "flex";
      document.querySelector(".cred_qr").src = resp.message;
      initScreen(onSucess);
    }
  }

  async function initRegister(onSucess){
    if(!joined) {func = 'register'; callback = onSucess; return;}
    loading.style.display = "none";
    loadingText.innerHTML = "Loading QR for you";
    var resp = await fetch(`${conn}/r/getQR`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        token: token,
        device_id: getDeviceID()
      })
    });
    resp = await resp.json();
    if(resp.status == 200){
      screen.style.display = "flex";
      document.querySelector(".cred_qr").src = resp.message;
      initScreen(onSucess);
    }
  }

  function initScreen(onSucess){
    socket.on("waiting_re", (d)=>{
      if(d.status = 200){
        loading.style.display = "flex";
        loadingText.innerHTML = d.message;
        screen.style.display = "none";
      }
    });
    socket.on("pro_done", (d)=>{
      if(d.status == 200){
        onSucess(d.data);
        loadingText.innerHTML = "Process Done";
        document.querySelector(".loader").style.display = "none";
      }
    })
  }

  window.initLogin = initLogin;
  window.initRegister = initRegister;

  function setDeviceID(id){
    !getDeviceID() ? localStorage.setItem("device_id", id) : null;
  }
  function getDeviceID(){
    return localStorage.getItem("device_id");
  }

  window.initApp = (tok)=>{
    initScript(()=>{initApp(tok)});
  };
})();