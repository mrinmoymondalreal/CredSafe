const express = require("express");
const bodyParser = require('body-parser');
const bcrypt = require("bcrypt");
const { run } = require("./db/conn");
const { reWeb, saveUser } = require("./db/signup");

const app = express();

const PORT = 8000;


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", (req, res)=>{
    res.send("Hello World");
});

app.get("/reWeb", async (req, res)=>{
    const { web_name, web_url, password, username } = req.body;
    var newPass = await bcrypt.hash(password, 10);
    var resp = await run(reWeb, { web_name, web_url, password: newPass, username });
    res.send(resp);
});

app.get("/saveUsers", async (req, res)=>{
    const { user_id, username, user_cred, linked_app_id, password } = req.body;
    var resp = await saveUser({ user_id, username, user_cred, linked_app_id, password });
    res.send(resp);
})

app.get("/loginwcs", (req, res)=>{
    
});

app.listen(PORT, ()=>{
    console.log(`Server Listening on http://localhost:${PORT}`);
})