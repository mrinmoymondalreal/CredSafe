const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mySchema = new Schema({
    username: { type: String, required: true },
    user_id: { type: String, required: true },
    user_cred: { type: String, required: true },
    linked_app_id: { type: String, required: true },
});

module.exports = mongoose.model('userDetails', mySchema);