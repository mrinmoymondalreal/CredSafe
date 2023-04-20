const website = require("../models/website");
const userDetails = require("../models/UserByWebsite");
const mongoose = require('mongoose');
const bcrypt = require("bcrypt");
// const web = mongoose.model('website');
const User = require("../models/Users");

mongoose.connect('mongodb+srv://class-user:wZpqcBG9OO2FXAHl@cluster0.78cec.mongodb.net/credsafe');

function reWeb(doc){
    // doc = { web_name, password, username, password, web_url }
    return new Promise(async res=>{

        var flag = 1, check;

        check = await website.findOne({ web_url: doc.web_url });

        if(check != null){ res({ status: 400, message: "website already exists" }); flag = 0; }

        check = await website.findOne({ username: doc.username });
        if(check != null){ res({ status: 400, message: "username exists" }); flag = 0; }
        if(flag == 1){
            var newWeb = new website(doc);
            newWeb.save();
            res({status: 200, message: {
                username: newWeb.username,
                website_name: newWeb.web_name,
                website_url: newWeb.web_url,
                ref_id: newWeb.user_id
            }});
        }else{
            res({status: 200, message: "unexpected problem"})
        }

    });
}

async function saveUser(doc){

    var resp =  await website.findOne({ user_id: doc.token });

    if(resp == null) return { status: 400, message: "no website found with this user_id" }

    var compare = await bcrypt.compare(doc.password, resp.password);
    if(!compare){ return { status: 400, message: "invalid credentials" }; }

    var resp2 = await User.findOne({ user_id: doc.doc.user_id });
    if(resp2 == null) return ({ status: 400, message: "user id provided is invalid" });

    resp2 = await userDetails.findOne({ web_url: resp.web_url, user_id: doc.doc.user_id });
    if(resp2 != null) return ({ status: 400, message: "user already registered with you." })
    
    var newUser = new userDetails({ web_url: resp.web_url, user_id: doc.doc.user_id });
    newUser.save();
    return { status: 200, message: newUser };

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