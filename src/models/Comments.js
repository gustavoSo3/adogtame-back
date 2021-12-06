const mongoose = require('mongoose');
const Schema = mongoose.Schema

const comments_schema = new Schema({
	id_post: String,
	id_user: String,
	id_group: String,
	comment: String
}, { timestamps: true });

const groups = mongoose.model('Comments', comments_schema);
module.exports = groups;