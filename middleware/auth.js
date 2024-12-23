const jwt = require("jsonwebtoken");
const Config = require('../config');

const auth = {
    // Verify token and attach user to request
    verifyToken: (req, res, next) => {
        const token = req.cookies['secretToken'];
        
        if (!token) {
            req.user = null;
            return next();
        }

        try {
            const decoded = jwt.verify(token, Config.TOKEN_SECRET);
            req.user = decoded;
            next();
        } catch (err) {
            console.error('Token verification failed:', err.message);
            req.user = null;
            res.clearCookie("secretToken");
            next();
        }
    },

    // Protect routes that require authentication
    requireAuth: (req, res, next) => {
        if (!req.user) {
            return res.status(401).redirect('/login');
        }
        next();
    },

    // Optional: Add role-based authorization
    requireAdmin: (req, res, next) => {
        if (!req.user || req.user.status !== 'admin') {
            return res.status(403).redirect('/news');
        }
        next();
    }
};

module.exports = auth;