const router = require('express').Router();
const path = require('path');
const multer = require('multer');
const multerS3 = require('multer-s3');
const aws = require('aws-sdk');

aws.config.update({
	secretAccessKey: process.env.DB_AWS_KEY,
	accessKeyId: process.env.DB_AWS_IDKEY,
	region: 'us-east-1'
});

const s3 = new aws.S3();

const upload = multer({
	storage: multerS3({
		s3: s3,
		bucket: 'adogtame-fotos',
		key: function (req, file, cb) {
			let extArray = file.mimetype.split("/");
			let extension = extArray[extArray.length - 1];
			cb(null, `${Date.now()}.${extension}`); //file key
		}
	}),
	dest: path.join(__dirname, '..', 'public', 'images'),
	fileFilter: (req, file, cb) => {
		if (file.mimetype === "image/jpg" || file.mimetype === "image/jpeg") {
			cb(null, true);
		} else {
			cb(null, false);
			return cb(new Error("Wrong file type"));
		}
	}
});

router.get('/images/:image', (req, res) => {
	var params = { Bucket: 'adogtame-fotos', Key: req.params.image };
	s3.getObject(params, function (err, data) {
		if (!err) {
			res.writeHead(200, { 'Content-Type': 'image/jpeg' });
			res.write(data.Body, 'binary');
			res.end(null, 'binary');
		} else {
			console.log(err)
			res.status(400);
		}
	});
});

router.post('/images', upload.single('image'), (req, res) => {
	res.json(req.file.key);
});

module.exports = router;
