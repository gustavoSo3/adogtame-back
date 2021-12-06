const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const auth = require('../middlewares/auth');
const Groups = require('../models/Groups');
const Posts = require('../models/Posts');
const GroupUser = require('../models/GroupUser');
const Comments = require('../models/Comments');

require('dotenv').config();
/** 
 * @swagger
 * /groups:
 *  get:
 *    description: return all groups
 *    parameters:
 *      - in: Header
 *        Bearer: token
 *        description: token 
 *        type: string
 *    responses:
 *      200:
 *        description: success response
 *      401:
 *        description: invalid token
*/

router.get('/groups', auth, async (req, res) => {
	try {
		const groups = await Groups.find({});
		res.json(groups);
	} catch (err) {
		console.error(err);
	}
});


/** 
 * @swagger
 * /groups/{id}:
 *  get:
 *    description: return the specific group
 *    parameters:
 *      - in: Header
 *        Bearer: token
 *        description: token 
 *        type: string
 *      - in: path
 *        name: id
 *        description: group id 
 *        type: string
 *    responses:
 *      200:
 *        description: success response
 *      204:
 *        description: user doesn't exist in database
 *      401:
 *        description: invalid token or not recieved
*/
router.get('/groups/:id', auth, async (req, res) => {
	try {
		if (mongoose.Types.ObjectId.isValid(req.params.id)) {

			const group = await Groups.findById(req.params.id);
			if (group) {
				res.json(group);
			} else {
				res.status(400).json({ code: 400, err: "Wrong group id" });
			}
		} else {
			res.status(400).json({ code: 400, err: "A valid group id needed" });
		}
	} catch (err) {
		console.error(err);
	}
});


/** 
 * @swagger
 * /groups/{id}/posts:
 *  get:
 *    description: return all the post of a specific group
 *    parameters:
 *      - in: Header
 *        Bearer: token
 *        description: token 
 *        type: string
 *      - in: path
 *        name: id
 *        description: group id 
 *        type: string
 *    responses:
 *      200:
 *        description: success response
 *      204:
 *        description: user doesn't exist in database
 *      401:
 *        description: invalid token or not recieved
*/
router.get('/groups/:id/posts', auth, async (req, res) => {
	try {
		const isPartOfGroup = await GroupUser.findOne({ id_group: req.params.id, id_user: req.user.id });
		if (isPartOfGroup) {
			const posts = await Posts.find({ id_group: req.params.id });
			res.json(posts);
		} else {
			res.status(403).json({ code: 403, err: "You cant see this groups posts" });
		}
	} catch (err) {
		console.error(err);
	}
});

/** 
 * @swagger
 * /groups:
 *  post:
 *    description: create group
 *    parameters:
 *      - in: Header
 *        Bearer: token
 *        description: token 
 *        type: string
 *      - in: body
 *        name: params
 *        description: group name, group description
 *        type: object
 *        properties:
 *          name:
 *            type: string
 *          description: 
 *            type: string
 *    responses:
 *      200:
 *        description: success response
 *      400:
 *        description: bad data request
*/
router.post('/groups', auth, async (req, res) => {
	try {
		const { name, description, photo } = req.body;
		if (name && description) {
			const exist = await Groups.findOne({ name: req.body.name });
			if (!exist) {
				const newGroup = await Groups.create({
					name,
					description,
					created_by: req.user.id,
					photo
				});
				const newGroupUser = await GroupUser.create({
					id_group: newGroup._id,
					id_user: req.user.id,
					permissions: "admin"
				});
				res.json(newGroup);
			} else {
				res.status(400).json({ code: 400, err: "Group already exists" });
			}
		} else {
			res.status(400).json({ code: 400, err: "you need atleast name, and description" });
		}
	} catch (err) {
		console.error(err);
	}
});

/** 
* @swagger
* /groups/{id}:
*  put:
*    description: create group
*    parameters:
*      - in: Header
*        Bearer: token
*        description: token 
*        type: string
*      - in: path
*        name: id
*        description: group id 
*        type: string
*      - in: body
*        name: params
*        description: (optional) group name, (optional) group description
*        type: object
*        properties:
*          name:
*            type: string
*          description: 
*            type: string
*    responses:
*      200:
*        description: success response
*      400:
*        description: bad data request
*/
router.put('/groups/:id', auth, async (req, res) => {
	try {
		if (mongoose.Types.ObjectId.isValid(req.params.id)) {

			const group = await Groups.findById(req.params.id);
			if (group) {
				const permissions = await GroupUser.findOne({ id_group: req.params.id, id_user: req.user.id });
				if (permissions && (permissions.permissions === "admin")) {
					Groups.findByIdAndUpdate(req.params.id, req.body, (err, doc) => {
						if (!err) {
							res.json(doc);
						} else {
							res.status(400).json({ code: 400, err: "Error processing request" });
						}
					});
				} else {
					res.status(403).json({ code: 403, err: "You cant edit this group" });
				}
			} else {
				res.status(400).json({ code: 400, err: "Group not existing" });
			}
		} else {
			res.status(400).json({ code: 400, err: "A valid group id is needed" });
		}
	} catch (err) {
		console.error(err);
	}
});

/** 
* @swagger
* /groups/{id}:
*  delete:
*    description: delete an existing user
*    parameters:
*      - in: Header
*        Bearer: token
*        description: token 
*        type: string
*      - in: path
*        name: id
*        description: group id 
*        type: string
*    responses:
*      200:
*        description: success response
*      400:
*        description: bad data request
*/

router.delete('/groups/:id', auth, async (req, res) => {
	try {
		const group = await Groups.findById(req.params.id);
		if (group) {
			const permissions = await GroupUser.findOne({ id_group: req.params.id, id_user: req.user.id });
			if (permissions && (permissions.permissions === "admin")) {
				await GroupUser.deleteMany({ id_group: req.params.id });
				const posts = await Posts.find({ id_group: req.params.id });
				posts.forEach(async (post) => {
					await Comments.deleteMany({ id_post: post._id });
				});
				await Posts.deleteMany({ id_group: req.params.id });
				await Groups.findByIdAndDelete(req.params.id);
				res.json({ message: "Group deleted" });
			} else {
				res.status(403).json({ code: 403, err: "You dont have permisions to do this" });
			}
		} else {
			res.status(400).json({ code: 400, err: "Wrong group id" });
		}
	} catch (err) {
		console.error(err);
	}
});

/** 
* @swagger
* /groups/{id}/permissions:
*  get:
*    description: return all the permissions of a group
*    parameters:
*      - in: Header
*        Bearer: token
*        description: token 
*        type: string
*      - in: path
*        name: id
*        description: group id 
*        type: string
*    responses:
*      200:
*        description: success response
*      204:
*        description: user doesn't exist in database
*      401:
*        description: invalid token or not recieved
*/
router.get('/groups/:id/permissions', auth, async (req, res) => {
	try {
		const permissions = await GroupUser.findOne({ id_group: req.params.id, id_user: req.user.id });
		if (permissions) {
			res.json(permissions);
		} else {
			res.json({ permissions: "none" });
		}
	} catch (err) {
		console.error(err);
	}
});

/** 
* @swagger
* /groups/{id}/permissions/{id_user}:
*  post:
*    description: create a new permission on a group
*    parameters:
*      - in: Header
*        Bearer: token
*        description: token 
*        type: string
*      - in: body
*        name: params
*        description: user id
*        type: object
*        properties:
*          permission: 
*            type: string
*    responses:
*      200:
*        description: success response
*      400:
*        description: bad data request
*/
router.post('/groups/:id/permissions/:id_user', auth, async (req, res) => {
	try {
		const group = await Groups.findById(req.params.id);
		if (group) {

			const permissions = await GroupUser.findOne({ id_group: req.params.id, id_user: req.user.id });
			if (permissions && (permissions.permissions === "admin")) {
				const { permission } = req.body;
				if (permission && (permission === "user" || permission === "admin")) {
					const exist = await GroupUser.findOne({ id_group: req.params.id, id_user: req.params.id_user });
					if (!exist) {
						const newGroupUser = await GroupUser.create({
							id_group: req.params.id,
							id_user: req.paramas.id_user,
							permissions: permission
						});
						res.json(newGroupUser);
					} else {
						const updatedGroupUser = await GroupUser.findOneAndUpdate({ id_group: req.params.id, id_user: req.params.id_user }, {
							permissions: permission
						});
						res.json(updatedGroupUser);
					}
				} else {
					res.status(400).json({ code: 403, err: "You must send a permission" });
				}
			} else {
				res.status(403).json({ code: 403, err: "You cant change this" });
			}
		} else {
			res.status(400).json({ code: 400, err: "Wrong Group id" });
		}
	} catch (err) {
		console.error(err);
	}
});

/** 
* @swagger
* /groups/{id}/permissions/{id_user}:
*  delete:
*    description: delete an existing permission
*    parameters:
*      - in: Header
*        Bearer: token
*        description: token 
*        type: string
*      - in: path
*        name: id
*        description: post id 
*        type: string
*      - in: path
*        name: id_permission
*        description: permission id 
*        type: string
*    responses:
*      200:
*        description: success response
*      400:
*        description: bad data request
*/
router.delete('/groups/:id/permissions/:id_permission', auth, async (req, res) => {
	try {
		const group = await Groups.findById(req.params.id);
		if (group) {
			const permissions = await GroupUser.findOne({ id_group: req.params.id, id_user: req.user.id });
			if (permissions && (permissions.permissions === "admin")) {
				const exist = await GroupUser.findById(req.params.id_permission);
				if (exist) {
					const deletedGroupUser = await GroupUser.findByIdAndDelete(req.params.id_permission);
					res.json(deletedGroupUser);
				} else {
					res.status(400).json({ code: 403, err: "This permission doesnt exist" });
				}
			} else {
				res.status(403).json({ code: 403, err: "You cant change this" });
			}
		} else {
			res.status(400).json({ code: 400, err: "Wrong Group id" });
		}
	} catch (err) {
		console.error(err);
	}
});

/** 
* @swagger
* /groups/{id}/subscribe:
*  post:
*    description: create a new permission on a group
*    parameters:
*      - in: Header
*        Bearer: token
*        description: token 
*        type: string
*      - in: body
*        name: params
*        description: user id
*        type: object
*        properties:
*          id_user:
*            type: string
*          permission: 
*            type: string
*    responses:
*      200:
*        description: success response
*      400:
*        description: bad data request
*/
router.post('/groups/:id/subscribe', auth, async (req, res) => {
	try {
		const group = await Groups.findById(req.params.id);
		if (group) {
			const exist = await GroupUser.findOne({ id_group: req.params.id, id_user: req.user.id });
			if (!exist) {
				const newGroupUser = await GroupUser.create({
					id_group: req.params.id,
					id_user: req.user.id,
					permissions: "user"
				});
				res.json(newGroupUser);
			} else {
				res.json(exist);
			}
		} else {
			res.status(400).json({ code: 400, err: "Wrong Group id" });
		}
	} catch (err) {
		console.error(err);
	}
});

/** 
* @swagger
* /groups/{id}/subscribe/{id_permission}:
*  delete:
*    description: delete an existing permission
*    parameters:
*      - in: Header
*        Bearer: token
*        description: token 
*        type: string
*      - in: path
*        name: id
*        description: post id 
*        type: string
*      - in: path
*        name: id_permission
*        description: permission id 
*        type: string
*    responses:
*      200:
*        description: success response
*      400:
*        description: bad data request
*/
router.delete('/groups/:id/subscribe', auth, async (req, res) => {
	try {
		const group = await Groups.findById(req.params.id);
		if (group) {
			const exist = await GroupUser.findOne({ id_group: req.params.id, id_user: req.user.id });
			if (exist) {
				const deletedGrupUser = await GroupUser.findOneAndDelete({
					id_group: req.params.id,
					id_user: req.user.id
				});
			}
			res.json({ message: "Unsubscribed" });
		} else {
			res.status(400).json({ code: 400, err: "Wrong Group id" });
		}
	} catch (err) {
		console.error(err);
	}
});

module.exports = router;