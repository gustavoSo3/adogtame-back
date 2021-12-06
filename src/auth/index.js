const router = require('express').Router();
const google = require('./google.auth');

router.use('/google', google);

module.exports = router;