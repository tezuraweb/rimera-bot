const Config = require('./config');
const express = require('express');
const nunjucks = require('nunjucks');
const routes = require('./routes/index');

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
        app.use(express.static('static'));
        app.use('/', routes);
        app.use((err, req, res, next) => {
            res.status(err.status || 500);
            res.json({ error: err });
        });
        
        app.listen(Config.PORT);
    } catch (e) {
        console.log(e);
    }
}

module.exports = launchWebpage;

