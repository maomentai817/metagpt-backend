const fs = require('fs');
const path = require('path');

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
        // 获取该目录下以 name 开头的文件内容
        const files = await fs.promises.readdir(projectPath);
        const matchedFile = files.find(file => file.startsWith(name));

        if (!matchedFile) {
            return res.cc('项目不存在', 404);
        }

        const filePath = path.join(projectPath, matchedFile);
        const fileContent = await fs.promises.readFile(filePath, 'utf8');

        // 按 "Project Name" 分割文件内容为数组
        function parseProjectContent(content) {
            const projectRegex = /Project Name:\s*(.*?),\s*Role:\s*(.*?),\s*Action:\s*(.*?),\s*File Path:\s*(.*?),\s*File Name:\s*(.*?),\s*Context:\s*([\s\S]*?)(?=\s*Project Name:|$)/g;
            const projects = [];
            let match;

            while ((match = projectRegex.exec(content)) !== null) {
                // 抽离角色名和职业
                const roleRegex = /(\w+)\((.*?)\)/;
                const roleMatch = match[2].match(roleRegex);

                // 获取 context 内容并处理为空的情况
                const context = match[6] ? match[6].trim() : '暂无内容';

                const project = {
                    projectName: match[1],
                    role: match[2],
                    roleName: roleMatch ? roleMatch[1] : '',
                    roleJob: roleMatch ? roleMatch[2] : '',
                    action: match[3],
                    filePath: match[4],
                    fileName: match[5],
                    fileType: match[5].split('.').pop(),
                    context: context,
                };
                projects.push(project);
            }

            return projects;
        }

        res.send({
            status: 200,
            data: {
                name: name,
                steps: parseProjectContent(fileContent)
            }
        });
    } catch (error) {
        return res.cc('发生错误', 500);
    }
}
