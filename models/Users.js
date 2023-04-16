const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mySchema = new Schema({
    user_id: { type: String, required: true },
});

module.exports = mongoose.model('appusers', mySchema);