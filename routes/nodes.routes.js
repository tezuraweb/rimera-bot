const express = require('express');
const pick = require('lodash/pick');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const Config = require('../config');
const { requireAuth } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next))
        .catch((err) => {
            console.error('Error:', err);
            res.status(500).render('error', { 
                error: 'Internal server error', 
                user: req.user 
            });
        });
};

const protectedRoute = (viewName) => asyncHandler(async (req, res) => {
    res.render(`nodes/${viewName}`, { user: req.user });
});

// Public routes
router.get('/', (req, res) => {
    return req.user ? res.redirect('/news') : res.redirect('/login');
});

router.get('/login', (req, res) => {
    if (req.user) {
        return res.redirect('/news');
    }
    return res.render('nodes/login', { authFailed: req.query.authFailed });
});

router.get('/signup', (req, res) => {
    if (req.user) {
        return res.redirect('/news');
    }
    return res.render('nodes/signup', { signupFailed: req.query.signupFailed });
});

// Protected routes
router.get('/news', requireAuth, protectedRoute('news'));
router.get('/mailing', requireAuth, protectedRoute('mailing'));
router.get('/message-manager', requireAuth, protectedRoute('message-manager'));
router.get('/faq', requireAuth, protectedRoute('faq'));
router.get('/emails', requireAuth, protectedRoute('emails'));
router.get('/feedback', requireAuth, protectedRoute('feedback'));

router.get('/stats', requireAuth, asyncHandler(async (req, res) => {
    const stats = await User.getStats();
    return res.render('nodes/stats', { user: req.user, stats });
}));

// Auth routes
router.get('/logout', asyncHandler(async (req, res) => {
    res.clearCookie("secretToken").redirect('/login');
}));

router.post('/signup', asyncHandler(async (req, res) => {
    const { username, password } = pick(req.body, ['username', 'password']);

    if (!username?.trim() || !password?.trim()) {
        return res.redirect('/signup/?signupFailed=invalidCredentials');
    }

    const user = await User.backofficeCheck(username);

    if (!user) {
        return res.redirect('/signup/?signupFailed=noUser');
    }
    if (user.password !== null) {
        return res.redirect('/signup/?signupFailed=signedUp');
    }
    if (user.status !== 'admin') {
        return res.redirect('/signup/?signupFailed=noAccess');
    }

    const encryptedPassword = await bcrypt.hash(password, 10);
    await User.backofficeSignUp(user.id, encryptedPassword);

    return res.redirect('/login');
}));

router.post('/login', asyncHandler(async (req, res) => {
    const { username, password } = pick(req.body, ['username', 'password']);

    if (!username?.trim() || !password?.trim()) {
        return res.redirect('/login/?authFailed=invalidCredentials');
    }

    const user = await User.backofficeCheck(username);

    if (!user || user.password == null) {
        return res.redirect('/login/?authFailed=noUser');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
        return res.redirect('/login/?authFailed=wrongPassword');
    }

    const token = jwt.sign(
        { user_id: user.id, user_name: user.name },
        Config.TOKEN_SECRET,
        { expiresIn: "9h" }
    );

    return res
        .cookie("secretToken", token, { 
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        })
        .redirect('/news');
}));

module.exports = router;