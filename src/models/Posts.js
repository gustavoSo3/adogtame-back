const mongoose = require('mongoose');
const Schema = mongoose.Schema

const post_schema = new Schema({
	id_user: String,
	id_group: String,
	title: String,
	information: String,
	photo: String,
	location: String,
	contact_info: String,
	pet_type: String,
	resolved: Boolean
}, { timestamps: true });

const post = mongoose.model('Posts', post_schema);
module.exports = post;