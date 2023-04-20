const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mySchema = new Schema({
    web_url: { type: String, required: true },
    user_id: { type: String, required: true },
});

module.exports = mongoose.model('UserByWebsite', mySchema);