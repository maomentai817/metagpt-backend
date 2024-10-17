const express = require('express');
const router = express.Router();
const config = require('../router_handler/config')
const path = require('path');

router.post('/connection', config.connectTest);

module.exports = router;