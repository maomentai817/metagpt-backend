const express = require('express');
const router = express.Router();
const action = require('../router_handler/action')
const path = require('path');

// 获取 action 列表
router.get('/action/list', action.getActionList)

// 获取 action 详情
router.post('/action/info', action.getActionInfo)

module.exports = router;