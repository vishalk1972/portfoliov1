const mysql = require("mysql2")

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "your_password", // Change this to your MySQL password
  database: "portfolio_management",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

const promisePool = pool.promise()

module.exports = promisePool
