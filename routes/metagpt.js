const express = require('express');
const router = express.Router();
const { getProjectInfo, getProjectList, getProjectFile, projectStart, getEnv, createEnv, getEnvRoles } = require('../router_handler/metagpt'); // 引入处理函数

// 读取项目日志信息
router.get('/project-info/:date', getProjectInfo); // 调用处理函数
// 读取项目列表
router.get('/project/list', getProjectList);

// 读取项目具体信息
router.post('/project/file', getProjectFile);

// 项目启动， 流式输出
router.get('/start', projectStart);

// 读取场景列表
router.get('/env', getEnv);

//创建场景
router.post('/env/new', createEnv)

// 获取场景角色
router.get('/env/role', getEnvRoles);

module.exports = router;
