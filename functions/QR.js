const qr = require("qrcode");
const { checkUserExists, saveQR } = require("../db/auth");

async function generateQR(doc, website_name, device_id, type){
    var f = await checkUserExists(doc);
    // console.log(f);
    return new Promise(res=>{
        if(f == 0){res({status: 400, msg: "Error Occured"});}
        else{
            var txt = `${website_name}>${device_id}>${new Date().toString()}>${type}`;
            qr.toDataURL(txt, (err, src) => {
                if (err) {console.log(err); res({status: 400, msg: "Error Occured"});}
                saveQR({ qr_data: txt, website_id: doc.user_id });
                res({status: 200, msg: src});
            });
        }
    });
}

module.exports = {
    generateQR
}