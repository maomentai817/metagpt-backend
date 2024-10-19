const express = require('express');
const router = express.Router();
const config = require('../router_handler/config')
const path = require('path');

// 测试连通
router.post('/connection', config.connectTest);
// 修改配置
router.post('/config', config.updateConfig);
// 获取配置信息
router.get('/config', config.getInitConfig);

module.exports = router;