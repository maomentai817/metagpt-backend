const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// 读取项目日志信息
exports.getProjectInfo = (req, res) => {
    const { date } = req.params;
    const logFilePath = path.join(__dirname, '../..', 'metagpt', 'logs', `${date}.txt`);

    fs.readFile(logFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.cc('日志文件不存在', 404);
        }

        const lines = data.split('\n');
        const publishMessages = [];
        let archivePaths = [];

        lines.forEach(line => {
            if (line.includes('publish_message')) {
                const match = line.match(/publish_message: (.+?)\}/);
                if (match) {
                    publishMessages.push(match[1]);
                }
            }
            if (line.includes('Archive')) {
                const archiveMatch = line.split('Archive: ')[1];
                if (archiveMatch) {
                    archivePaths = archiveMatch.split(',').map(item => item.trim());
                }
            }
        });

        res.send({
            publishMessages,
            archivePaths
        });
    });
};

// 读取项目列表
exports.getProjectList = async (req, res) => {
    const projectPath = path.join(__dirname, '../../metagpt/logs/result');
    // 读取该目录下所有文件名
    const files = await fs.readdirSync(projectPath);
    // 文件名为 projectName_new_num.log, 仅截取 projectName, 去掉 _new_num, 文件名中可能带有 _
    function extractProjectName(fileName) {
        const regex = /^(.*?)_new_\d+\.log$/; // \d+ 匹配一串数字
        const match = fileName.match(regex);
        return match ? match[1] : null;
    }
    // 提取第一个项目的 Context 内容
    function extractFirstContext(log) {
        const contextRegex = /Context:\s*([\s\S]*?)(?=\nProject Name:|$)/; // 匹配 Context 内容直到下一个 Project Name
        const match = log.match(contextRegex);
        return match ? match[1].trim() : null;
    }

    const projectList = files.map(file => {
        const projectName = extractProjectName(file);
        // 读取文件内容
        const logFilePath = path.join(projectPath, file);
        const logContent = fs.readFileSync(logFilePath, 'utf8');
        const firstContext = extractFirstContext(logContent);
        return {
            name: projectName,
            desc: firstContext
        };
    }).filter(Boolean);

    res.send({
        status: 200,
        data: projectList
    })
}

// 读取项目具体信息
exports.getProjectFile = async (req, res) => {
    const { name } = req.body;
    const projectPath = path.join(__dirname, '../../metagpt/logs/result');

    try {
        const files = await fs.promises.readdir(projectPath);
        const matchedFile = files.find(file => file.startsWith(name));

        if (!matchedFile) {
            return res.cc('项目不存在', 404);
        }

        const filePath = path.join(projectPath, matchedFile);
        const fileContent = await fs.promises.readFile(filePath, 'utf8');
        console.log(fileContent);
        function parseProjectContent(content) {
            const projectRegex = /Project Name:\s*(.*?),\s*Role:\s*(.*?),\s*Action:\s*(.*?),\s*Time:\s*(.*?),\s*Action Duration:\s*(.*?)\s*Version:\s*(.*?),\s*File Path:\s*(.*?),\s*File Name:\s*(.*?),\s*Context:\s*([\s\S]*?)(?=\s*Project Name:|$)/g;
            const projects = [];
            let match;

            while ((match = projectRegex.exec(content)) !== null) {
                const roleRegex = /(\w+)\((.*?)\)/;
                const roleMatch = match[2].match(roleRegex);

                const context = match[9] ? match[9].trim() : '暂无内容';

                const project = {
                    projectName: match[1],
                    role: match[2],
                    roleName: roleMatch ? roleMatch[1] : '',
                    roleJob: roleMatch ? roleMatch[2] : '',
                    action: match[3],
                    time: match[4],
                    actionDuration: match[5],
                    version: match[6],
                    filePath: match[7],
                    fileName: match[8],
                    fileType: match[8].split('.').pop(),
                    context: context,
                };
                projects.push(project);
            }

            return projects;
        }


        const steps = parseProjectContent(fileContent);

        res.send({
            status: 200,
            data: {
                name: name,
                steps: steps
            }
        });
    } catch (error) {
        return res.cc('发生错误', 500);
    }
};



exports.projectStart = async (req, res) => {
    // 获取项目描述信息和项目名称
    const projectDescription = req.query.description || '';
    const projectName = req.query.projectName || '';
    // env 名
    const envName = req.query.envName || 'software_company';

    // 构建参数数组
    const pythonArgs = [
        projectDescription,
        '--project-name',
        projectName
    ];

    const pythonPath = path.join(__dirname, `../../metagpt/metagpt/env/${envName}.py`);
    const pythonProcess = spawn('python', [pythonPath, ...pythonArgs]);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');

    pythonProcess.stdout.on('data', (data) => {
        res.write(`data: ${data.toString()}\n\n`);
    });

    pythonProcess.stderr.on('data', (data) => {
        res.write(`data: ${data.toString()}\n\n`);
    });

    pythonProcess.on('close', (code) => {
        res.write(`data: Script ended with code ${code}\n\n`);
        res.end();
    });
}

exports.getEnv = async (req, res) => { 
    const projectPath = path.join(__dirname, '../../metagpt/metagpt/env');
    // 读取文件夹下 py 文件名返回
    const files = await fs.readdirSync(projectPath);
    res.send({
        status: 200,
        data: files.map(envs => envs.slice(0, -3)).filter(env => env !== 'model')
    })
}

// 创建场景的处理函数
exports.createEnv = async (req, res) => {
    // 模拟模板文件所在目录
    const TEMPLATE_DIR = path.join(__dirname, '../../metagpt/metagpt/env');  // 模板文件所在目录
    const OUTPUT_DIR = path.join(__dirname, '../../metagpt/metagpt/env');  // 输出目录
    const { name, role } = req.body; // 从前端请求体获取 name 和 role 数组

    // 输入验证
    if (!name || !role || role.length === 0) {
        return res.status(400).json({ message: '模板名称和角色列表是必需的' });
    }

    try {
        // 1. 查找模板文件
        const templateFilePath = path.join(TEMPLATE_DIR, 'model.py');
        if (!fs.existsSync(templateFilePath)) {
            return res.status(404).json({ message: `模板文件 model.py 不存在` });
        }

        // 2. 复制模板文件并重命名
        const outputFilePath = path.join(OUTPUT_DIR, `${name}.py`);
        fs.copyFileSync(templateFilePath, outputFilePath);  // 复制文件

        // 3. 修改模板文件中的角色导入语句
        await modifyRoleImports(outputFilePath, role);

        // 4. 修改 team.hire() 中的角色
        await modifyTeamHireRoles(outputFilePath, role);

        // 5. 返回成功响应
        res.status(201).json({
            message: '场景创建成功',
            file: `${name}.py`  // 返回创建的文件名
        });

    } catch (error) {
        console.error('创建场景时出错:', error);
        res.status(500).json({ message: '服务器错误，创建场景失败' });
    }
};

// 修改模板中的角色导入语句
async function modifyRoleImports(filePath, roles) {
    const importStatements = roles.map(role => {
        // 转换角色为正确的类名格式，首字母大写
        const className = capitalizeFirstLetter(role);
        return `from metagpt.roles.${role} import ${className}`;
    }).join('\n');

    // 读取文件内容
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');

    // 插入角色导入语句到文件顶部
    const updatedContent = importStatements + '\n' + fileContent;

    // 写回修改后的文件
    await fs.promises.writeFile(filePath, updatedContent, 'utf-8');
}

// 修改 team.hire() 行代码中的角色
async function modifyTeamHireRoles(filePath, roles) {
    const roleStr = roles.map(role => {
        // 转换角色为正确的类名格式，并生成 hire 调用
        const className = capitalizeFirstLetter(role);
        return `${className}(context=ctx)`;
    }).join(', '); // 将角色数组转为字符串

    // 读取文件内容
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');

    // 使用更通用的正则表达式来替换 team.hire() 中的角色
    const updatedContent = fileContent.replace(/team\.hire\(\[[^\]]*\]\)/, `team.hire([${roleStr}])`);

    // 写回修改后的文件
    await fs.promises.writeFile(filePath, updatedContent, 'utf-8');
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


// 读取场景文件并提取角色
exports.getEnvRoles = async (req, res) => {
    const envName = req.query.envName;
    // 构建场景文件的路径，假设文件存放在 ../metagpt/env 目录
    const envFilePath = path.join(__dirname, '../../metagpt/metagpt/env', `${envName}.py`);

    // 检查文件是否存在
    if (!fs.existsSync(envFilePath)) {
        throw new Error('场景文件不存在');
    }

    // 读取文件内容
    const fileContent = await fs.promises.readFile(envFilePath, 'utf-8');
    let roles = [];

    if (envName !== 'software_company') {
        // 使用正则表达式查找 team.hire([...]) 中的角色信息
        const roleRegex = /team\.hire\(\[([^\]]+)\]\)/;
        const match = fileContent.match(roleRegex);
        if (!match) {
            throw new Error('没有找到角色信息');
        }

        // 提取角色部分
        const rolesString = match[1];  // 获取 team.hire 中的角色部分
        roles = rolesString
            .split(',')  // 按逗号分割角色
            .map(role => role.trim())  // 去除空格
            .map(role => {
                // 提取角色名，例如 'Architect(context=ctx)' -> 'Architect'
                const roleName = role.split('(')[0].trim();
                return roleName;
            });
    } else { 
        const roleRegex = /from\s+metagpt\.roles\s+import\s*\(([^)]+)\)/s;  // 使用修正后的正则
        const match = fileContent.match(roleRegex);

        if (!match) {
            throw new Error('没有找到角色信息');
        }

        // 提取角色部分
        const rolesString = match[1].trim();  // 获取括号中的角色部分
        // 将角色列表按逗号和空格拆分为数组
        roles = rolesString.split(/\s*,\s*/).filter(role => role);

    }
    return res.send({
        status: 200,
        data: roles
    });
};