const express = require('express');
const nunjucks = require('nunjucks');
const cookieParser = require("cookie-parser");

const routes = require('./routes/index');
const Config = require('./config');

const app = new express();

const launchWebpage = () => {
    try {
        nunjucks.configure('views', {
            autoescape: true,
            express: app,
        });

        app.set('view engine', 'njk');

        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));
        app.use(cookieParser());
        app.use(express.static('static'));
        app.use('/', routes);
        app.use((err, req, res, next) => {
            res.status(err.status || 500);
            res.json({ error: err });
        });

        const server = app.listen(Config.PORT, Config.HOST, () => {
            console.log(`Web server is running on ${host}:${port}`);
        });

        return server;
    } catch (e) {
        console.log(e);
    }
}

module.exports = launchWebpage;

