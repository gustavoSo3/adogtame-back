const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const auth = require('../middlewares/auth');
const Posts = require('../models/Posts');
const GroupUser = require('../models/GroupUser');
const Comments = require('../models/Comments');

require('dotenv').config();
/** 
 * @swagger
 * /posts:
 *  get:
 *    description: return all the post in the database
 *    parameters:
 *      - in: Header
 *        Bearer: token
 *        description: token 
 *        type: string
 *    responses:
 *      200:
 *        description: success
 *      204:
 *        description: success response
 *      401:
 *        description: bad data request
*/

router.get('/posts', auth, async (req, res) => {
	try {
		const posts = await Posts.find({});
		res.json(posts);
	} catch (err) {
		console.error(err);
	}
});

/** 
* @swagger
* /posts/{id}:
*  get:
*    description: return the specified post
*    parameters:
*      - in: Header
*        Bearer: token
*        description: token 
*        type: string
*      - in: path
*        name: id
*        description: post id 
*        type: string
*    responses:
*      200:
*        description: success response
*      204:
*        description: post doesn't exist in database
*      401:
*        description: invalid token or not recieved
*/

router.get('/posts/:id', auth, async (req, res) => {
	try {
		const post = await Posts.findById(req.params.id);
		if (post) {
			res.json(post);
		} else {
			res.status(400).json({ code: 400, err: "Wrong post id" });
		}
	} catch (err) {
		console.error(err);
	}
});

/** 
* @swagger
* /posts:
*  post:
*    description: create post
*    parameters:
*      - in: Header
*        Bearer: token
*        description: token 
*        type: string
*      - in: body
*        name: params
*        description: user id, group id, post title, post information, post photo, post location, post contact info, post pet type
*        type: object
*        properties:
*          id_group: 
*            type: string
*          title: 
*            type: string
*          information:
*            type: string
*          photo:
*            type: string
*          location:
*            type: string
*          contact_info:
*            type: string
*          pet_type:
*            type: string 
*    responses:
*      200:
*        description: success response
*      400:
*        description: bad data request
*/
router.post('/posts', auth, async (req, res) => {
	try {
		const isPartOfGroup = await GroupUser.findOne({ id_group: req.body.id_group, id_user: req.user.id });
		if (isPartOfGroup) {
			const { id_group, title, information, photo, location, contact_info, pet_type } = req.body;
			if (!(id_group && title && information && photo && location && contact_info && pet_type)) {
				res.status(400).json({ code: 400, err: "you need at least: id_group, title, information, photo, location, contact_info, pet_type " });
			} else {
				const createdPost = await Posts.create({
					id_user: req.user.id,
					id_group,
					title,
					information,
					photo,
					location,
					contact_info,
					pet_type,
					resolved: false
				});
				res.json(createdPost);
			}
		}
	} catch (err) {
		console.error(err);
	}
});

/** 
* @swagger
* /posts/{id}:
*  put:
*    description: update the post
*    parameters:
*      - in: Header
*        Bearer: token
*        description: token 
*        type: string
*      - in: path
*        name: id
*        description: post id 
*        type: string
*      - in: body
*        name: params
*        description: (optional) user id, (optional) group id, (optional) post title, (optional) post information, (optional) post photo, (optional) post location, (optional) post contact info, (optional) post pet type
*        type: object
*        properties:
*          id_user:
*            type: string
*          id_group: 
*            type: string
*          title: 
*            type: string
*          information:
*            type: string
*          photo:
*            type: string
*          location:
*            type: string
*          contact_info:
*            type: string
*          pet_type:
*            type: string 
*    responses:
*      200:
*        description: success response
*      400:
*        description: bad data request
*/
router.put('/posts/:id', auth, async (req, res) => {
	try {
		const post = Posts.findById(req.params.id);
		if (post) {
			if (post.id_user === req.user.id) {
				const updatedPost = Posts.findByIdAndUpdate(req.params.id, req.body);
				res.json(updatedPost);
			} else {
				res.status(403).json({ code: 403, err: "You dont have permissions to do this" });
			}
		} else {
			res.status(400).json({ code: 400, err: "Post no exist" });
		}
	} catch (err) {
		console.error(err);
	}
});

/** 
* @swagger
* /posts/{id}:
*  delete:
*    description: delete an existing user
*    parameters:
*      - in: Header
*        Bearer: token
*        description: token 
*        type: string
*      - in: path
*        name: id
*        description: post id 
*        type: string
*    responses:
*      200:
*        description: success response
*      400:
*        description: bad data request
*/

router.delete('/posts/:id', auth, async (req, res) => {
	try {
		const post = Posts.findById(req.params.id);
		if (post) {
			if (post.id_user === req.user.id) {
				await Comments.deleteMany({ id_post: req.params.id });
				await Posts.findByIdAndDelete(req.params.id);
				res.json({ mesage: "Post deleted" });
			} else {
				res.status(403).json({ code: 403, err: "You dont have permissions to do this" });
			}
		} else {
			res.status(400).json({ code: 400, err: "Post no exist" });
		}
	} catch (err) {
		console.error(err);
	}
});





/** 
* @swagger
* /posts/{id}/comments:
*  get:
*    description: return all the comments
*    parameters:
*      - in: Header
*        Bearer: token
*        description: token 
*        type: string
*      - in: path
*        name: id
*        description: post id 
*        type: string
*    responses:
*      200:
*        description: success response
*      204:
*        description: user doesn't exist in database
*      401:
*        description: invalid token or not recieved
*/
router.get('/posts/:id/comments', auth, async (req, res) => {
	try {
		const post = await Posts.findById(req.params.id);
		if (post) {
			const isPartOfGroup = await GroupUser.findOne({ id_group: post.id_group, id_user: req.user.id });
			if (isPartOfGroup) {
				const comments = await Comments.find({ id_post: req.params.id })
				res.json(comments);
			} else {
				res.status(403).json({ code: 403, err: "You cant see this post comments" });
			}
		} else {
			res.status(400).json({ code: 400, err: "Wrong post id" });
		}
	} catch (err) {
		console.err(err);
	}
});

/** 
* @swagger
* /posts/{id}/comments:
*  post:
*    description: create group
*    parameters:
*      - in: Header
*        Bearer: token
*        description: token 
*        type: string
*      - in: body
*        name: params
*        description: user id, comment
*        type: object
*        properties:
*          id_user:
*            type: string
*          comment: 
*            type: string
*    responses:
*      200:
*        description: success response
*      400:
*        description: bad data request
*/
router.post('/posts/:id/comments', auth, async (req, res) => {
	try {
		const post = await Posts.findById(req.params.id);
		if (post) {
			const { comment } = req.body;
			if (comment) {
				const isPartOfGroup = await GroupUser.findOne({ id_group: post.id_group, id_user: req.user.id });
				console.log(isPartOfGroup)
				if (isPartOfGroup) {
					console.log(isPartOfGroup.id_group)
					const newComment = await Comments.create({
						id_group: isPartOfGroup.id_group,
						id_post: post._id,
						id_user: req.user.id,
						comment
					});
					console.log(newComment)
					res.json(newComment);
				} else {
					res.status(403).json({ code: 403, err: "You cant see this post comments" });
				}
			} else {
				res.status(400).json({ code: 400, err: "You must send a comment" });
			}
		} else {
			res.status(400).json({ code: 400, err: "Wrong post id" });
		}
	} catch (err) {
		console.error(err);
	}
});

/** 
* @swagger
* /posts/{id}/comments/{id_comment}:
*  delete:
*    description: delete an existing comment
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
*        name: id_comment
*        description: comment id 
*        type: string
*    responses:
*      200:
*        description: success response
*      400:
*        description: bad data request
*/
router.delete('/posts/:id/comments/:id_comment', async (req, res) => {
	try {
		const post = await Posts.findById(req.params.id);
		if (post) {
			const isPartOfGroup = await GroupUser.findOne({ id_group: post.id_group, id_user: req.user.id });
			if (isPartOfGroup) {
				const comment = await Comments.findById(req.paramas.id_comment);
				if (comment) {
					if (isPartOfGroup.permission === "admin" || comment.id_user === req.user.id) {
						const deletedComment = await Comment.findByIdAndDelete(req.paramas.id_comment);
						res.json({ message: "Comment deleted" });
					} else {
						res.status(403).json({ code: 403, err: "You cant delete this comment" });
					}
				} else {
					res.status(400).json({ code: 400, err: "Wrong comment id" });
				}
			} else {
				res.status(403).json({ code: 403, err: "You cant access this posts comments" });
			}
		} else {
			res.status(400).json({ code: 400, err: "Wrong post id" });
		}
	} catch (err) {
		console.error(err);
	}
});

module.exports = router;