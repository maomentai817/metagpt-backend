const express = require('express');
const router = express.Router();
const project = require('../router_handler/project')
const path = require('path');

// 获取完成项目日志信息
router.get('/project/logs', project.getProjects)

module.exports = router;