const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const auth = require('../middlewares/auth');
const Posts = require('../models/Posts');
const Users = require('../models/Users');
const Groups = require('../models/Groups');
const GroupUser = require('../models/GroupUser');

require('dotenv').config();


/** 
 * @swagger
 * /users:
 *  get:
 *    description: return all users
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
router.get('/users', auth, async (req, res) => {
	try {
		const users = await Users.find({});
		res.json(users);
	} catch (err) {
		console.error(err);
	}
});

/** 
* @swagger
* /users/{id}:
*  get:
*    description: return the user specified
*    parameters:
*      - in: Header
*        Bearer: token
*        description: token 
*        type: string
*      - in: path
*        name: id
*        description: user id 
*        type: string
*    responses:
*      200:
*        description: Success response
*      400:
*        description: There is no user with this id
*/
router.get('/users/:id', auth, async (req, res) => {
	try {
		if (mongoose.Types.ObjectId.isValid(req.params.id)) {
			const user = await Users.findById(req.params.id);
			if (user) {
				res.json(user);
			} else {
				res.status(400).json({ code: 400, error: "There is no user with this id" });
			}
		} else {
			res.status(400).json({ code: 400, error: "invalid user id" });
		}
	} catch (err) {
		console.error(err);
	}
});

/** 
* @swagger
* /users/{id}/groups:
*  get:
*    description: return all the user groups
*    parameters:
*      - in: Header
*        Bearer: token
*        description: token 
*        type: string
*      - in: path
*        name: id
*        description: user id 
*        type: string
*    responses:
*      200:
*        description: success response
*      204:
*        description: user doesn't exist in database
*      401:
*        description: invalid token or not recieved
*/
router.get('/users/:id/groups', auth, async (req, res) => {
	try {
		let groups = [];
		const groupUser = await GroupUser.find({ id_user: req.params.id });
		for (let x = 0; x < groupUser.length; x++) {
			groups.push(await Groups.findById(groupUser[x].id_group));
		}
		res.json(groups);
	} catch (err) {
		console.error(err);
	}
});


/** 
* @swagger
* /users/{:id}/groups/posts:
*  get:
*    description: return all the user post
*    parameters:
*      - in: Header
*        Bearer: token
*        description: token 
*        type: string
*      - in: path
*        name: id
*        description: user id 
*        type: string
*    responses:
*      200:
*        description: success response
*      204:
*        description: user doesn't exist in database
*      401:
*        description: invalid token or not recieved
*/
router.get('/users/:id/groups/posts', auth, async (req, res) => {
	try {
		const groupUser = await GroupUser.find({ id_user: req.params.id });
		const list = groupUser.map(e => {
			return e.id_group;
		})
		console.log(list)
		const nose = await Posts.find({ id_group: { "$in": list } }).sort({ createdAt: -1 });
		console.log(nose);
		res.json(nose);
	} catch (err) {
		console.error(err);
	}
});

/** 
* @swagger
* /users/{id}/groups/not_sub:
*  get:
*    description: return all the user post
*    parameters:
*      - in: Header
*        Bearer: token
*        description: token 
*        type: string
*      - in: path
*        name: id
*        description: user id 
*        type: string
*    responses:
*      200:
*        description: success response
*      204:
*        description: user doesn't exist in database
*      401:
*        description: invalid token or not recieved
*/
router.get('/users/:id/groups/not_sub', auth, async (req, res) => {
	try {
		const groupUser = await GroupUser.find({ id_user: req.params.id });
		const list = groupUser.map(e => {
			return e.id_group;
		})
		const notSub = await Groups.find({ _id: { "$nin": list } });
		res.json(notSub);
	} catch (err) {
		console.error(err);
	}
});

/** 
* @swagger
* /users/{id}/posts:
*  get:
*    description: return all the user post
*    parameters:
*      - in: Header
*        Bearer: token
*        description: token 
*        type: string
*      - in: path
*        name: id
*        description: user id 
*        type: string
*    responses:
*      200:
*        description: success response
*      204:
*        description: user doesn't exist in database
*      401:
*        description: invalid token or not recieved
*/
router.get('/users/:id/posts', auth, async (req, res) => {
	try {
		const posts = await Posts.find({ id_user: req.params.id });
		res.json(posts);
	} catch (err) {
		console.error(err);
	}
});

/** 
* @swagger
* /users/login:
*  post:
*    description: login
*    parameters:
*      - in: body
*        name: params
*        description: user email, user password
*        type: object
*        properties:
*          email:
*            type: string
*          password: 
*            type: string
*    responses:
*      200:
*        description: success response
*      400:
*        description: bad data request
*/
router.post('/users/login', async (req, res) => {
	try {
		const { email, password } = req.body
		if (!(email && password)) {
			res.status(400).send("Missing body parameters");
		}
		const checkUser = await Users.findOne({ email });
		if (checkUser && (await bcrypt.compare(password, checkUser.password))) {
			const token = jwt.sign({
				id: checkUser._id, email
			}, process.env.TOKEN_KEY);
			checkUser.token = token;
			res.status(200).json(checkUser);
		} else {
			res.status(400).send("Bad credentials");
		}
	} catch (err) {
		console.log(err);
	}
});

/** 
* @swagger
* /users:
*  post:
*    description: add an user
*    parameters:
*      - in: Header
*        Bearer: token
*        description: token 
*        type: string
*      - in: body
*        name: params
*        description: user email, user password, user name, user last name and user phone number
*        type: object
*        properties:
*          email:
*            type: string
*          password: 
*            type: string
*          name: 
*            type: string
*          last_name:
*            type: string
*          phone_number:
*            type: string
*          tags:
*            type: string
*          date_birth:
*            type: string
*          profile_picture:
*            type: string
*    responses:
*      200:
*        description: success response
*      400:
*        description: bad data request
*/
router.post('/users', async (req, res) => {
	try {
		const { name, email, password, last_name, date_birth, tags, phone_number, profile_picture } = req.body;
		if (!(name && email && password)) {
			res.status(400).json({ code: 400, error: "You need at least: name, email, and password" });
		}
		const userExist = await Users.findOne({ email });
		if (userExist) {
			res.status(409).json({ code: 400, error: "There is a username, with this email, try login in" });
		} else {
			const encryptedPassword = await bcrypt.hash(password, 10);
			const newUser = await Users.create({
				name,
				email: email.toLowerCase(),
				password: encryptedPassword,
				last_name,
				date_birth,
				tags, phone_number,
				profile_picture
			});

			const token = await jwt.sign({
				id: newUser._id, email
			}, process.env.TOKEN_KEY);
			newUser.token = token;
			res.status(201).json(newUser);
		}
	} catch (err) {
		console.error(err);
	}
});
/** 
* @swagger
* /users/{id}:
*  put:
*    description: update an existing user
*    parameters:
*      - in: Header
*        Bearer: token
*        description: token 
*        type: string
*      - in: path
*        name: id
*        description: user id 
*        type: string
*      - in: body
*        name: params
*        description: (optional) user email, (optional) user password, (optional) user name, (optional) user last name and (optional) user phone number
*        type: object
*        properties:
*          email:
*            type: string
*          password: 
*            type: string
*          name: 
*            type: string
*          last_name:
*            type: string
*          phone_number:
*            type: string
*          tags:
*            type: string
*          date_birth:
*            type: string
*          profile_picture:
*            type: string
*    responses:
*      200:
*        description: success response
*      400:
*        description: bad data request
*/

router.put('/users/:id', auth, async (req, res) => {
	try {
		const userExist = await Users.findById(req.params.id);
		if (userExist) {
			if (userExist._id.toString() === req.user.id) {
				const updatedUser = await Users.findByIdAndUpdate(req.params.id, req.body);
				res.json(updatedUser);
			} else {
				res.status(403).json({ code: 403, error: "You dont have permisions to update this user" });
			}
		} else {
			res.status(400).json({ code: 400, error: "This user doesnt exist" });
		}
	} catch (err) {
		console.error(err);
	}
});


/** 
* @swagger
* /users/{id}:
*  delete:
*    description: delete an existing user
*    parameters:
*      - in: Header
*        Bearer: token
*        description: token 
*        type: string
*      - in: path
*        name: id
*        description: user id 
*        type: string
*    responses:
*      200:
*        description: success response
*      400:
*        description: bad data request
*/
router.delete('/users/:id', auth, async (req, res) => {
	try {
		const userExist = await Users.findById(req.params.id);
		if (userExist) {
			if (userExist._id.toString() === req.user.id) {
				const deletedUser = await Users.findByIdAndDelete(req.params.id);
				res.json(deletedUser);
			} else {
				res.status(403).json({ code: 403, error: "You dont have permisions to delete this user" });
			}
		} else {
			res.status(400).json({ code: 400, error: "This user doesnt exist" });
		}
	} catch (err) {
		console.error(err);
	}
});

module.exports = router;