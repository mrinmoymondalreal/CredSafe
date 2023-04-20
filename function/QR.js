const qr = require("qrcode");
const { checkUserExists, saveQR } = require("../db/auth");

async function generateQR(doc, device_id, type){
    // doc = { token, password }
    var f = await checkUserExists(doc);
    return new Promise(res=>{
        if(f == 0){res({status: 400, message: "website not found"});}
        if(f == 2){res({ status: 200, message: "invalid request" });}
        else{
            var date = new Date();
            var txt = `${doc.origin}>${device_id}>${date.toString()}>${type}`;
            qr.toDataURL(txt, (err, src) => {
                if (err) { res({ status: 400, message: "unexpexted problem" }); }
                saveQR({ qr_data: txt, website_id: doc.token, time: date });
                res({ status: 200, message: src });
            });
        }
    });
    
}

module.exports = {
    generateQR
}