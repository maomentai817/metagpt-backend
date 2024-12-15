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

// 新建角色接口
exports.createRole = async (req, res) => {
  const { roleName, profile, actions } = req.body;
  // console.log(roleName, profile, actions);

  // 检查参数是否完整
  if (!roleName || !profile || !Array.isArray(actions)) {
    return res.status(400).json({ error: 'Missing or invalid parameters' });
  }

  // 生成 Python 角色文件内容
  const pythonCode = generateRolePythonCode(roleName, profile, actions);

  // 保存 Python 文件
  const filePath = path.join(__dirname, '../../metagpt/metagpt/roles', `${convertToSnakeCase(roleName)}.py`);
  try {
    fs.writeFileSync(filePath, pythonCode);
    res.status(200).json({
      message: 'Role Python file generated successfully',
      filePath: filePath
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate Python file' });
  }
}
function convertToSnakeCase(string) {
  return string
    .replace(/([A-Z])/g, '_$1')  // 找到大写字母并在前面加上下划线
    .replace(/^_/, '')
    .toLowerCase();  // 将整个字符串转为小写
}
// 首字母大写
function capitalizeFirstLetter(string) {
  return string
    .split('_')  // 按下划线分割
    .map((word, index) => {
      // 如果是第一个单词，首字母大写，其他字母小写
      return index === 0
        ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');  // 将所有部分拼接成一个单词
}

function generateRolePythonCode(roleName, profile, actions) {
  // 将动作数组转换为 Python 代码
  const actionsCode = actions.map(action => `        self.set_actions([${capitalizeFirstLetter(action)}])`).join('\n');
  const actionsImports = actions.map(action => `from metagpt.actions.${convertToSnakeCase(action)} import ${capitalizeFirstLetter(action)}`).join('\n');

  // Python 代码模板
  const pythonTemplate = `
from metagpt.roles import Role
from metagpt.actions import Action, UserRequirement,ActionOutput
from metagpt.schema import Message
${actionsImports}
class ${roleName}(Role):
    name: str = "${roleName}"
    profile: str = "${profile}"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        ${actionsCode}  # 设置角色的动作
        self._watch([UserRequirement])  # 观察相关动作生成的消息

    async def _act(self) -> Message:
        # 在这里根据收到的消息生成行为
        pass
  `;

  return pythonTemplate;
}

exports.createRoleCode = async (req, res) => { 
  const { code, codeName } = req.body;
  // 验证参数
  if (!code || !codeName) {
    return res.status(400).json({ error: 'Missing code or codeName' });
  }

  // 设置文件保存路径
  const directoryPath = path.join(__dirname, '../../metagpt/metagpt/roles'); // 目录路径
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