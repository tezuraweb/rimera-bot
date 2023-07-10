const express = require('express');

const router = express.Router();

const nodesRoutes = require('./nodes.routes');
const apiRoutes = require('./api.routes');

router.use(express.json());
router.use('/api', apiRoutes);
router.use('/', nodesRoutes);

module.exports = router;