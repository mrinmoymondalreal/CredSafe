const website = require("../models/website");
const userDetails = require("../models/UserByWebsite");
const mongoose = require('mongoose');
const bcrypt = require("bcrypt");
const web = mongoose.model('website');
const User = require("../models/Users");
const QRModel = require("../models/QRre");

mongoose.connect('mongodb+srv://class-user:wZpqcBG9OO2FXAHl@cluster0.78cec.mongodb.net/credsafe');

async function checkUserExists(doc){
    var resp =  await website.findOne({ user_id: doc.token });
    if(resp == null) return 0;
    console.log("checkUser:", doc.origin, resp.web_url);
    if(!(doc.origin == resp.web_url)) return 2;
    return 1;
}

async function saveQR({qr_data, website_id}){
    var obj = new QRModel({ qr_data, website_id });
    obj.save();
    return obj;
}

async function findQR({ qr_data }){
    var obj = await QRModel.findOne({ qr_data });
    return (obj == null) ? 0 : 1;
}

async function findUser(user_id){
    var f = await User.findOne({ user_id });
    return f == null ? 0 : 1;
}

async function findQR_d(qr_data){
    var f = await QRModel.findOne({ qr_data });
    return f;
}

async function checkUserByWebsite(id, url){
    var resp = await userDetails.findOne({ user_id: id });
    console.log(resp, url, id);
    if(resp == null) return 0;
    if(resp.web_url == url) return 1;
    return 0;
}


// checkUserExists()

module.exports = {
    checkUserExists,
    saveQR,
    findQR,
    findUser,
    findQR_d,
    checkUserByWebsite
}