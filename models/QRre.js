const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mySchema = new Schema({
    qr_data: { type: String, required: true },
    website_id: { type: String, required: true },
});

module.exports = mongoose.model('QRre', mySchema);