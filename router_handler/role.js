const path = require('path');
const fs = require('fs'); 

// 获取 角色列表
exports.getRoleList = async (req, res) => {
  const rolePath = path.join(__dirname, '../../metagpt/metagpt/roles')
  // 读取该目录下所有 py 文件名， 除了 __init__
  const files = await fs.readdirSync(rolePath).filter(file => file.endsWith('.py') && file !== '__init__.py')
  // 获取文件名，不包含 .py
  const roleList = files.map(file => file.slice(0, -3))
  res.send({
    status: 200,
    data: roleList
  })
}

// 获取 角色包含行为列表
exports.getRoleActions = async (req, res) => {
  const { name } = req.body;
  const rolePath = path.join(__dirname, '../../metagpt/metagpt/roles');

  try {
    // 读取该角色的 actions
    const roleFilePath = path.join(rolePath, `${name}.py`);
    const roleFileContent = await fs.readFileSync(roleFilePath, 'utf-8');

    // 提取以 'from metagpt.actions' 或 'from metagpt.actions.*' 开头的行
    const actionRegex = /from\s+metagpt\.actions(?:\.\w+)?\s+import\s+(.*?)(?=\n|$)/gm;

    let actions = [];
    let match;

    // 匹配所有相关行
    while ((match = actionRegex.exec(roleFileContent)) !== null) {
      // 提取 import 后的行为名单词
      const actionList = match[1].split(',').map(action => action.trim());
      actions = actions.concat(actionList);
    }

    // 去重
    actions = [...new Set(actions)];

    // 返回提取的 actions
    res.send({ status: 200, data: actions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to read role file.' });
  }
};

// 获取角色信息代码
exports.getRoleCode = async (req, res) => {
  const { name } = req.body;
  const rolePath = path.join(__dirname, '../../metagpt/metagpt/roles');
  const roleFilePath = path.join(rolePath, `${name}.py`);

  // 检查文件是否存在
  if (!fs.existsSync(roleFilePath)) {
    return res.status(404).json({ error: 'Role file not found.' });
  }

  try {
    const roleFileContent = await fs.readFileSync(roleFilePath, 'utf-8');

    res.send({
      status: 200,
      data: roleFileContent
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to read role file.' });
  }
};