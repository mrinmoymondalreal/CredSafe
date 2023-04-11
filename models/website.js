const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { v4: uuidv4 } = require('uuid');

const mySchema = new Schema({
    web_name: { type: String, required: true },
    web_url: { type: String, required: true },
    username: { type: String, required: true },
    user_id: { type: String, required: true, default: () => uuidv4() },
    password: { type: String, required: true },
});

module.exports = mongoose.model('website', mySchema);