const axios = require('axios');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const store = require('./store')

exports.connectTest = async (req, res) => {
  const { model, apikey, baseurl } = req.body;
  const prompt = '连通测试,成功则仅返回“ok”';

  try {
    // 构建请求体
    const response = await axios.post(`${baseurl}/chat/completions`, {
      model: model[1],
      messages: [{ role: 'user', content: prompt }]
    }, {
      headers: {
        'Authorization': `Bearer ${apikey}`,
        'Content-Type': 'application/json'
      }
    });

    // 打印和返回大模型的响应
    const responseData = response.data;
    if (responseData.choices && responseData.choices.length > 0) {
      const content = responseData.choices[0].message.content;
      res.status(200).json({
        status: 200,
        msg: `${model[1]} 连接成功`,
        data: content
      });
    } else {
      res.status(500).json({ error: 'No response content from the model' });
    }

  } catch (error) {
    console.error('Error connecting to the model:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to connect to the model' });
  }
};

exports.updateConfig = async (req, res) => {
  const { model, apikey, baseurl, nround, codeReview, codeTest } = req.body;
  const modelConfigPath = path.join(__dirname, '../../metagpt/config/config2.yaml');
  // const metaGlobalConfigPath = path.join(__dirname, '../../metagpt/metagpt/software_company.py');

  // 修改 config2.yaml 文件配置
  try {
    // 读取文件内容
    let yamlContent = fs.readFileSync(modelConfigPath, 'utf8');
    let yamlData = yaml.load(yamlContent);
    // 更新参数值

    if (apikey) yamlData.llm.api_key = apikey;
    if (baseurl) yamlData.llm.base_url = baseurl;
    if (model[0]) yamlData.llm.api_type = model[0];
    if (model[1]) yamlData.llm.model = model[1];
    
    // 将修改后的值转为 YAML 格式并写回
    yamlContent = yaml.dump(yamlData, {
      lineWidth: -1, // 不限制行宽
      noCompatMode: true, // 不使用兼容模式
      quotingType: '"', // 设置引号类型
    });
    fs.writeFileSync(modelConfigPath, yamlContent, 'utf-8');

    // 保存 store 变量
    store.setStore({
      nround,
      codeReview,
      codeTest
    })

    res.send({
      status: 200,
      msg: '配置修改成功'
    })
  } catch (err) { 
    console.error('Error updating config file:', err);
    res.status(500).json({ error: 'Failed to update config file' });
  }
};

exports.getInitConfig = async (req, res) => {
  const { nround, codeReview, codeTest } = store.getStore();
  // 读取文件内容
  const modelConfigPath = path.join(__dirname, '../../metagpt/config/config2.yaml');
  let yamlContent = fs.readFileSync(modelConfigPath, 'utf8');
  let yamlData = yaml.load(yamlContent);

  res.send({
    status: 200,
    msg: '获取配置成功',
    data: {
      nround,
      codeReview,
      codeTest,
      model: [yamlData.llm.api_type,yamlData.llm.model],
      apikey: yamlData.llm.api_key,
      baseurl: yamlData.llm.base_url
    }
  })
}