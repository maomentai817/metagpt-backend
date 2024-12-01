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
        data: files.map(envs => envs.slice(0, -3))
    })
}