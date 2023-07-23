const express = require('express');
const pick = require('lodash/pick');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const Config = require('../config');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

router
    .route('/news')
    .get(auth, (req, res) => {
        try {
            if (!req.user) {
                return res.redirect('/login')
            }
    
            return res.render('nodes/news', { user: req.user });
        } catch (err) {
            console.log(err);
        }
    });

router
    .route('/mailing')
    .get(auth, (req, res) => {
        if (!req.user) {
            return res.redirect('/login')
        }
        
        return res.render('nodes/mailing', { user: req.user });
    });

router
    .route('/login')
    .get((req, res) => {   
        return res.render('nodes/login', {
            authFailed: req.query.authFailed
        });
    });

router
    .route('/signup')
    .get((req, res) => {   
        return res.render('nodes/signup', {
            signupFailed: req.query.signupFailed
        });
    });

router
    .route('/logout')
    .get(async (req, res) => {
        try {
            return res.clearCookie("secretToken").redirect('/login');
        } catch (err) {
            console.log(err);
        }
    });

router
    .route('/signup')
    .post(async (req, res) => {
        try {
            const { username, password } = pick(req.body, 'username', 'password');

            if (!(password && username)) {
                return res.redirect('/signup/?signupFailed=invalidCredentials');
            }

            const user = await User.backofficeCheck(username);

            if (!user) {
                return res.redirect('/signup/?signupFailed=noUser');
            }
            if (user.password !== null) {
                return res.redirect('/signup/?signupFailed=signedUp');
            }
            if (user.status != 'admin') {
                return res.redirect('/signup/?signupFailed=noAccess');
            }

            encryptedPassword = await bcrypt.hash(password, 10);

            const userSignedUp = await User.backofficeSignUp(
                user.id,
                encryptedPassword,
            );

            return res.redirect('/login');
        } catch (err) {
            console.log(err);
        }
    });

router
    .route('/login')
    .post(async (req, res) => {
        try {
            const { username, password } = pick(req.body, 'username', 'password');

            if (!(username && password)) {
                return res.redirect('/login/?authFailed=invalidCredentials');
            }

            const user = await User.backofficeCheck(username);

            if (!user || user.password == null) {
                return res.redirect('/login/?authFailed=noUser');
            }

            if (user && (await bcrypt.compare(password, user.password))) {
                const token = jwt.sign(
                    { user_id: user.id, user_name: user.name },
                    Config.TOKEN_SECRET,
                    {
                        expiresIn: "9h",
                    }
                );

                return res.cookie("secretToken", token, { httpOnly: true }).redirect('/news');
            } else {
                return res.redirect('/login/?authFailed=wrongPassword');
            }
        } catch (err) {
            console.log(err);
        }
    });

module.exports = router;