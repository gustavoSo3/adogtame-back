const mongoose = require('mongoose');
const Schema = mongoose.Schema

const group_user_schema = new Schema({
	id_group: String,
	id_user: String,
	permissions: String //false means you are a user true you are the admin
}, { timestamps: true });

const groups = mongoose.model('Group-Users', group_user_schema);
module.exports = groups;