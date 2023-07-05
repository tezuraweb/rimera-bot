const express = require('express');

const router = express.Router();

router
    .route('/news')
    .get((req, res) => {
        res.render('nodes/news');
    });

router
    .route('/mailing')
    .get((req, res) => {
        res.render('nodes/mailing');
    });

module.exports = router;