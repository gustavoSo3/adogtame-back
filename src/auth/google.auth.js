const router = require('express').Router();
require('dotenv').config();

const passport = require('passport');

const GoogleStrategy = require('passport-google-oauth20');
const jwt = require('jsonwebtoken');

const Users = require('../models/Users');


passport.serializeUser((user, done) => {
	done(null, user.token);
});

passport.deserializeUser((token, done) => {

	done(null, token);
})

passport.use(new GoogleStrategy({
	callbackURL: '/api/auth/google/redirect',
	clientID: '591419004148-gp4ig1p3bemvv29ec1e0ltjmo76iugke.apps.googleusercontent.com',
	clientSecret: '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'
}, async (accessToken, refreshToken, profile, done) => {
	const user = await Users.findOne({ email: profile.emails[0].value });
	if (user) {
		const token = await jwt.sign({
			id: user._id, email: user.email
		}, process.env.TOKEN_KEY);
		user.token = token;
		done(null, user);
	} else {
		const newUser = await Users.create({
			name: profile.name.givenName,
			last_name: profile.name.familyName,
			email: profile.emails[0].value,
			profile_picture: profile.photos[0].value
		});
		const token = await jwt.sign({
			id: newUser._id, email: newUser.email
		}, process.env.TOKEN_KEY);

		newUser.token = token;
		done(null, newUser);
	}
}));


router.get('/redirect', passport.authenticate('google'), (req, res) => {
	var responseHTML = '<html><head><title>Main</title></head><body></body><script>res = %value%; window.opener.postMessage(res, "*");window.close();</script></html>'
	responseHTML = responseHTML.replace('%value%', JSON.stringify({
		user: req.user
	}));
	res.status(200).send(responseHTML);
})

router.get('/', passport.authenticate('google', {
	scope: ['profile', 'email']
}));

module.exports = router;