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
  const { name, role, ACT } = req.body;
  const actionPath = path.join(__dirname, '../../metagpt/metagpt/actions');
  const actionFilePath = path.join(actionPath, `${name}.py`);

  // 检查文件是否存在
  if (!fs.existsSync(actionFilePath)) {
    // 如果找不到，尝试根据 role 和 ACT 查找对应的角色文件
    const rolePath = path.join(__dirname, '../../metagpt/metagpt/roles');
    const roleFilePath = path.join(rolePath, `${role}.py`);

    // 检查角色文件是否存在
    if (fs.existsSync(roleFilePath)) {
      const roleFileContent = await fs.readFileSync(roleFilePath, 'utf-8');

      // 查找对应的 import 语句，提取模块名和行为名
      const importRegex = /from\s+metagpt\.actions(?:\.(\w+))?\s+import\s+([\w, ]+)/g;
      let match;

      // 遍历所有匹配的 import 语句
      while ((match = importRegex.exec(roleFileContent)) !== null) {
        const moduleName = match[1] || ''; // 提取模块名
        const actionNames = match[2].split(',').map(action => action.trim()); // 提取行为名列表

        // 检查是否有任何行为名与 ACT 匹配
        if (actionNames.includes(ACT)) {
          // 如果模块名为空，则直接查找 `__init__.py`
          const foundActionFilePath = path.join(actionPath, moduleName ? `${moduleName}.py` : '__init__.py');

          // 检查该 action 文件是否存在
          if (fs.existsSync(foundActionFilePath)) {
            const actionInfo = await fs.readFileSync(foundActionFilePath, 'utf-8');
            return res.send({
              status: 200,
              data: actionInfo
            });
          }
        }
      }

      return res.send({
        status: 404,
        msg: 'Action file not found for the specified role and ACT.'
      });
    } else {
      return res.send({
        status: 404,
        msg: 'Role file not found.'
      });
    }
  }

  // 根据 name 获取该目录下对应的 py 文件内容
  const actionInfo = await fs.readFileSync(actionFilePath, 'utf-8');
  res.send({
    status: 200,
    data: actionInfo
  });
};
function convertToSnakeCase(string) {
  return string
    .replace(/([A-Z])/g, '_$1')  // 找到大写字母并在前面加上下划线
    .replace(/^_/, '')
    .toLowerCase();  // 将整个字符串转为小写
}
exports.createActionCode = async (req, res) => { 
  const { code, codeName } = req.body;
  // 验证参数
  if (!code || !codeName) {
    return res.status(400).json({ error: 'Missing code or codeName' });
  }

  // 设置文件保存路径
  const directoryPath = path.join(__dirname, '../../metagpt/metagpt/actions'); // 目录路径
  const filePath = path.join(directoryPath, `${convertToSnakeCase(codeName)}.py`); // 文件路径

  // 确保目录存在，不存在则创建
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }

  // 写入文件
  fs.writeFile(filePath, code, 'utf8', (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to save the file' });
    }
    res.status(200).json({ message: 'File saved successfully', filePath });
  });
}