const jwt = require("jsonwebtoken");

const Config = require('../config');

const verifyToken = (req, res, next) => {
    if (!req.cookies['secretToken']) {
        return next();
    }

    try {
        const decoded = jwt.verify(req.cookies['secretToken'], Config.TOKEN_SECRET);
        req.user = decoded;
    } catch (err) {
        console.log(err.message);
    }

    return next();
};

module.exports = verifyToken;