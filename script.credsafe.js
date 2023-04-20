(function(){
  var socket, func, token, joined = false, callback;
  const screen = document.querySelector(".scr"),
        loading = document.querySelector(".loading"),
        loadingText = document.querySelector(".loading-text");
  const conn = "http://localhost:8000/credsafe_script";
  function initScript(callback){
    const script= document.createElement("script");
    script.src = `${conn}/socket.io/socket.io.js`;
    script.onload = function(){callback()};
    var style = document.createElement('style');
    style.innerHTML = `body{
            margin: 0;
            padding: 0;
        }
        .bg_credsafe{
            position: fixed;
            background: rgba(0, 0, 0, 0.6);
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: sans-serif;
        }
        .model{
            width: 600px;
            height: 500px;
            background: #fff;
            border-radius: 10px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }
        .cred_qr{
            max-width: 100%;
        }
        .main_text{
            font-size: 25px;
            font-weight: bold;
        }

        .loading{
            justify-content: center;
            align-items: center;
        }

        .loader{
            margin-right: 20px;
            width: 30px;
            height: 30px;
            border: 8px solid;
            border-left: 8px solid transparent;
            border-radius: 100%;
            animation: loading infinite 2s linear;
            transform-origin: center;
        }

        @keyframes loading {
            0%{
                transform: rotate(0deg);
            }
            100%{
                transform: rotate(360deg);
            }
        }`;
    document.head.appendChild(style);
    document.body.innerHTML = document.body.innerHTML + `<div class="bg_credsafe">
    <div class="model">
        <div class="scr" style="display: none;flex-direction: column;">
            <img class="cred_qr" width="300" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHQAAAB0CAYAAABUmhYnAAAAAklEQVR4AewaftIAAAKdSURBVO3BQY7cQAwEwSxC//9yeo48NSBIs17TjIgfrDGKNUqxRinWKMUapVijFGuUYo1SrFGKNUqxRinWKMUapVijFGuUYo1y8VASfpLKHUnoVLokdCpdEn6SyhPFGqVYoxRrlIuXqbwpCb+JypuS8KZijVKsUYo1ysWXJeEOlTuS0Kn8pCTcofJNxRqlWKMUa5SLYZLQqXRJmKxYoxRrlGKNcjGMyolKl4RJijVKsUYp1igXX6byNyXhROUJld+kWKMUa5RijXLxsiT8ZipdEjqVkyT8ZsUapVijFGuU+ME/LAknKv+TYo1SrFGKNcrFQ0noVLokvEmlU7kjCZ3KSRLepPJNxRqlWKMUa5SLL1PpknCHykkSOpU7kvA3JaFTeaJYoxRrlGKNEj94URKeUOmScKLSJaFTOUnCHSonSbhD5U3FGqVYoxRrlIuHktCpdEnoVLoknKicJOGOJNyhcpKEO1S+qVijFGuUYo0SP3hREk5U7khCp/KmJNyh8qYkdCpPFGuUYo1SrFHiB/+wJHQqXRI6lS4JncoTSehUflKxRinWKMUaJX7wQBJ+ksoTSehUTpLQqdyRhBOVNxVrlGKNUqxRLl6m8qYknCShUzlROUlCp9IloVPpknBHEjqVJ4o1SrFGKdYoF1+WhDtUvikJnUqn0iXhDpU7kvCmYo1SrFGKNcrFMEk4UemS8EQSTlROVN5UrFGKNUqxRrkYTuUOlZMkdConSehUvqlYoxRrlGKNcvFlKt+kcpKETuUkCZ1Kp9Il4Tcp1ijFGqVYo1y8LAk/KQmdykkSTlS6JHQqJyonSehU3lSsUYo1SrFGiR+sMYo1SrFGKdYoxRqlWKMUa5RijVKsUYo1SrFGKdYoxRqlWKMUa5RijfIHfREA5mJl58EAAAAASUVORK5CYII=" alt="">
            <div class="main_text">Scan QR to start Login</div>
        </div>
        <div class="loading" style="display: flex">
            <div class="loader"></div>
            <div class="loading-text">Loading</div>
        </div>
    </div>
</div>`;
    document.body.insertBefore(script, document.querySelector("script"));
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