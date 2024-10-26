const express = require('express');
const app = express();
const bodyParser = require('body-parser');

// 入口文件

// 配置跨域
const cors = require('cors');
app.use(cors());

// 配置解析表单中间件
app.use(express.urlencoded({ extended: false }))
app.use(bodyParser.json())

// 在路由之前, 声明一个全局中间件
app.use(function (req, res, next) {
    // 优化 res.send()
    res.cc = function (error, status = 1) {
        res.send({
            status,
            // 判断 error 是错误对象还是字符串 
            msg: error instanceof Error ? error.message : error,
        })
    }

    next();
});

// 托管静态资源文件
app.use('/uploads', express.static('./uploads'))

// 导入路由
const metagpt = require('./routes/metagpt')
app.use(metagpt)
const metaConfig = require('./routes/metaConfig')
app.use(metaConfig)
// const role = require('./routes/role')
// app.use(role)
const action = require('./routes/action')
app.use(action)

app.listen(3007, () => {
    console.log('api server running at http://127.0.0.1:3007');
})