const mysql = require('mysql');

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'qw123456',
    // database: 'my_db_01'
    database: 'news_db'
});

// 向外共享db
module.exports = db;