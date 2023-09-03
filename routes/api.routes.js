const express = require('express');
const pick = require('lodash/pick');
const News = require('../models/News');
const Mailing = require('../models/Mailing');
const Organization = require('../models/Organization');
const Department = require('../models/Department');
const User = require('../models/User');
const bot = require('../bot');

const router = express.Router();

router
    .route('/news')
    .get(async (req, res) => {
        try {
            const page = req.query.page;
            const limit = req.query.limit;

            const news = await News.getPage(page, limit);

            res.json(news);
        } catch (err) {
            res.status(400).json({ error: err });
        }
    });

router
    .route('/news-count')
    .get(async (req, res) => {
        try {
            const newsCount = await News.getNewsCount();

            res.json(newsCount);
        } catch (err) {
            res.status(400).json({ error: err });
        }
    });

router
    .route('/news/image/:id')
    .get(async (req, res) => {
        try {
            const id = req.params.id;

            const imgHref = await bot.telegram.getFileLink(id).then((res) => res.href);

            res.json(imgHref);
        } catch (err) {
            res.status(400).json({ error: err });
        }
    });

router
    .route('/news-update/:id')
    .post(async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const data = pick(req.body, 'text');

            const news = await News.update(id, data.text);

            res.json(news);
        } catch (err) {
            res.status(400).json({ error: err });
        }
    });

router
    .route('/mailing-list')
    .get(async (req, res) => {
        try {
            const newsCount = await Mailing.getAll();

            res.json(newsCount);
        } catch (err) {
            res.status(400).json({ error: err });
        }
    });

router
    .route('/mailing-create')
    .post(async (req, res) => {
        try {
            const data = pick(req.body, 'title', 'organization', 'department', 'users', 'position', 'gender', 'date', 'channels');

            const mailing = await Mailing.create(data);

            res.json(mailing);
        } catch (err) {
            res.status(400).json({ error: err });
        }
    });

router
    .route('/mailing-update/:id')
    .post(async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const data = pick(req.body, 'title', 'organization', 'department', 'users', 'position', 'gender', 'date', 'channels');

            const mailing = await Mailing.update(id, data);

            res.json(mailing);
        } catch (err) {
            res.status(400).json({ error: err });
        }
    });

router
    .route('/mailing/:id')
    .get(async (req, res) => {
        try {
            const id = parseInt(req.params.id);

            const mailing = await Mailing.getById(id);

            res.json(mailing);
        } catch (err) {
            res.status(400).json({ error: err });
        }
    });

router
    .route('/organizations')
    .get(async (req, res) => {
        try {
            const orgs = await Organization.getAll();

            res.json(orgs);
        } catch (err) {
            res.status(400).json({ error: err });
        }
    });

router
    .route('/organizations/active')
    .get(async (req, res) => {
        try {
            const idsLine = req.query.id;
            const ids = idsLine.split(',').map(id => parseInt(id));

            const orgs = await Organization.getByIds(ids);

            res.json(orgs);
        } catch (err) {
            res.status(400).json({ error: err });
        }
    });

router
    .route('/departments')
    .get(async (req, res) => {
        try {
            const parent = parseInt(req.query.parent);

            const deps = (parent == 0 || isNaN(parent)) ? await Department.getRoot() : await Department.getSubdivision(parent);

            res.json(deps);
        } catch (err) {
            res.status(400).json({ error: err });
        }
    });

router
    .route('/departments/active')
    .get(async (req, res) => {
        try {
            const idsLine = req.query.id;
            const ids = idsLine.split(',').map(id => parseInt(id));

            const deps = await Department.getByIds(ids);

            res.json(deps);
        } catch (err) {
            res.status(400).json({ error: err });
        }
    });

router
    .route('/users')
    .get(async (req, res) => {
        try {
            const users = await User.getAll();

            res.json(users);
        } catch (err) {
            res.status(400).json({ error: err });
        }
    });

router
    .route('/users/active')
    .get(async (req, res) => {
        try {
            const idsLine = req.query.id;
            const ids = idsLine.split(',').map(id => parseInt(id));

            const users = await User.getByIds(ids);

            res.json(users);
        } catch (err) {
            res.status(400).json({ error: err });
        }
    });

router
    .route('/organization/search')
    .get(async (req, res) => {
        try {
            const query = req.query.q;

            const orgs = await Organization.searchAll(query);

            res.json(orgs);
        } catch (err) {
            res.status(400).json({ error: err });
        }
    });

router
    .route('/department/search')
    .get(async (req, res) => {
        try {
            const query = req.query.q;
            const parent = parseInt(req.query.parent);

            const deps = (parent == 0 || isNaN(parent)) ? await Department.searchAll(query) : await Department.searchSubdivision(query, parent);

            res.json(deps);
        } catch (err) {
            res.status(400).json({ error: err });
        }
    });

router
    .route('/users/search')
    .get(async (req, res) => {
        try {
            const query = req.query.q;

            const orgs = await User.searchAll(query);

            res.json(orgs);
        } catch (err) {
            res.status(400).json({ error: err });
        }
    });

module.exports = router;