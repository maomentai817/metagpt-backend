const fs = require('fs/promises');
const path = require('path');

exports.getProjects = async (req, res) => {
  try {
    const logsPath = path.join(__dirname, '../../metagpt/logs');
    const files = await fs.readdir(logsPath);

    const logContents = await Promise.all(
      files.map(file => fs.readFile(path.join(logsPath, file), 'utf8'))
    );

    const logsInfo = logContents.map(log =>
      log.split(/(?=\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3})/)
        .map(line => line.trim().split('|').pop().trim().split(' - ').pop())
    );

    const logsInfo1 = logsInfo.map(file => {
      const projectData = [];
      let currentProject = [];

      file.forEach(line => {
        currentProject.push(line);
        if (line.startsWith('Archive:')) {
          projectData.push(currentProject);
          currentProject = [];
        }
      });

      if (currentProject.length) {
        projectData.push(currentProject);
      }

      return projectData;
    });

    const logsInfo2 = logsInfo1.map(file =>
      file.map(project =>
        project.reduce((extractedData, line) => {
          if (line.startsWith('publish_message:')) {
            extractedData.push(line.slice(16).trim());
          } else if (line.startsWith('Archive:')) {
            const path = line.split(':')[1].trim();
            extractedData.push(path);
          }
          return extractedData;
        }, [])
      )
    );

    const logsInfo3 = logsInfo2.flat();

    res.send({
      status: 200,
      msg: '获取项目列表成功',
      data: logsInfo3
    });
  } catch (error) {
    res.status(500).send(error);
  }
};
