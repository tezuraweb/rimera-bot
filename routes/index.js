const express = require('express');

const router = express.Router();

const nodesRoutes = require('./nodes.routes');
const apiRoutes = require('./api.routes');

router.use(express.json());
router.use('/api', apiRoutes);
router.use('/', nodesRoutes);
router.all('*', (req, res) => {
    res.status(404);

    if (req.accepts('html')) {
        res.render('nodes/error');
        return;
    }

    if (req.accepts('json')) {
        res.json({ error: 'Not found' });
        return;
    }

    res.type('txt').send('Not found');
});

module.exports = router;