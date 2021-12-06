const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
	const token = req.body.token || req.query.token || req.headers["x-access-token"];
	if (!token) {
		return res.status(401).json({ code: 401, err: "token required as part of body:token or as part of the url query:token or as header: x-access-token" });
	}
	try {
		const decoded = jwt.verify(token, process.env.TOKEN_KEY);
		req.user = decoded;
	} catch (err) {
		return res.status(400).json({ code: 400, err: "Error processing" });
	}
	return next();
};