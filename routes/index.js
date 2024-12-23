const express = require('express');
const { verifyToken } = require('../middleware/auth');
const nodesRoutes = require('./nodes.routes');
const apiRoutes = require('./api.routes');

const router = express.Router();

// Apply token verification globally
router.use(express.json());
router.use(verifyToken);

// Apply routes
router.use('/api', apiRoutes);
router.use('/', nodesRoutes);

module.exports = router;