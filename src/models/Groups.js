const mongoose = require('mongoose');
const Schema = mongoose.Schema

const groups_schema = new Schema({
	name: String,
	description: String,
	created_by: String,
	photo: String
}, { timestamps: true });

const groups = mongoose.model('Groups', groups_schema);
module.exports = groups;