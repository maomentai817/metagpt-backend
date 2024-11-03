const express = require('express');
const router = express.Router();
const { getProjectInfo, getProjectList, getProjectFile } = require('../router_handler/metagpt'); // 引入处理函数

// 读取项目日志信息
router.get('/project-info/:date', getProjectInfo); // 调用处理函数
// 读取项目列表
router.get('/project/list', getProjectList);

// 读取项目具体信息
router.post('/project/file', getProjectFile);

module.exports = router;
