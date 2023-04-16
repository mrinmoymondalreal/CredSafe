const website = require("../models/website");
const userDetails = require("../models/UserByWebsite");
const mongoose = require('mongoose');
const bcrypt = require("bcrypt");
const web = mongoose.model('website');
const User = require("../models/Users");


await mongoose.connect('mongodb+srv://class-user:wZpqcBG9OO2FXAHl@cluster0.78cec.mongodb.net/credsafe');
async function reWeb(doc){
    var newWeb = new website(doc);
    newWeb.save();
    return newWeb;
}

async function saveUser(doc){
    // check user_id exists or not
    // check password
    // check username matches with user_id

    // await mongoose.connect('mongodb://127.0.0.1:27017/credsafe');
    var resp =  await web.findOne({ user_id: doc.user_id });

    if(resp == null) return { status: 400, msg: "Website not found" }

    var compare = await bcrypt.compare(doc.password, resp.password);
    if(!compare || !(resp.username == doc.username)){ return { status: 400, msg: "invalid cred" }; }
    
    var newUser = new userDetails(doc);
    newUser.save();

    return newUser;
}

async function addUser({ id }){
    // await mongoose.connect('mongodb://127.0.0.1:27017/credsafe');
    var u = new User({ user_id: id });
    u.save();
    return u;
}

// saveUser({
//     user_id: "4b6a31cf-4e58-40df-bc81-1038b5858ada",
// });

module.exports = {
    reWeb,
    saveUser,
    addUser
}