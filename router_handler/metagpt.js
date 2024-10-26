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
