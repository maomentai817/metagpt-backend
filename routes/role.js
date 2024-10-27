const express = require('express');
const router = express.Router();
const role = require('../router_handler/role')

// 获取 角色列表
router.get('/role/list', role.getRoleList)

// 获取 角色包含行为列表
router.post('/role/actions', role.getRoleActions)

// 获取 角色信息代码
router.post('/role/code', role.getRoleCode)

module.exports = router;