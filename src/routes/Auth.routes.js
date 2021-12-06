const router = require('express').Router();
const passport = require('passport')

router.use('/auth', passport.initialize());
const AuthRouter = require('../auth');
router.use('/auth', AuthRouter);
router.use('/auth', passport.session());

module.exports = router;