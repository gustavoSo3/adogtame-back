const mongoose = require('mongoose');
const Schema = mongoose.Schema

const user_schema = new Schema({
    email: String,
    password: String,
    name: String,
    last_name: String,
    date_birth: Date,
    tags: String,
    phone_number: String,
    profile_picture: String,
    token: String
}, { timestamps: true });

const user = mongoose.model('Users', user_schema);
module.exports = user;