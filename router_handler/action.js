const path = require('path');
const fs = require('fs');

// 获取 action 列表
exports.getActionList = async (req, res) => {
  const actionPath = path.join(__dirname, '../../metagpt/metagpt/actions')
  // 获取该目录下所有 py 文件名, 不包括 __init__
  const files = await fs.readdirSync(actionPath).filter(file => file.endsWith('.py') && file !== '__init__.py')
  // 获取文件名，不包含 .py
  const actionList = files.map(file => file.slice(0, -3))
  res.send({
    status: 200,
    data: actionList
  })
  
}

// 获取 action 详情
exports.getActionInfo = async (req, res) => {
  const { name } = req.body

  const actionPath = path.join(__dirname, '../../metagpt/metagpt/actions')
  // 根据 name 获取该目录下对应的 py 文件内容
  const actionInfo = await fs.readFileSync(`${actionPath}/${name}.py`, 'utf8')
  res.send({
    status: 200,
    data: actionInfo
  })
}
