const express = require('express');
const router = express.Router();
const { getProjectInfo } = require('../router_handler/metagpt'); // 引入处理函数

// 读取项目日志信息
router.get('/project-info/:date', getProjectInfo); // 调用处理函数

module.exports = router;
