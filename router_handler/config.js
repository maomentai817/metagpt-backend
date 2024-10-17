const axios = require('axios');

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
        msg: `${model} 连接成功`,
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
