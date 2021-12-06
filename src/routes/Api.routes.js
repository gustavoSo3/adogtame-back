const router = require('express').Router();

const GroupsRouter = require('./Groups.routes');
const UsersRouter = require('./Users.routes');
const PostsRouter = require('./Posts.routes');
const AuthRouter = require('./Auth.routes');
const ImagesRouter = require('./Images.routes');


router.get('/', (req, res) => { res.send('adogtame api') });

router.use(GroupsRouter);
router.use(UsersRouter);
router.use(PostsRouter);
router.use(AuthRouter);
router.use(ImagesRouter);

module.exports = router;