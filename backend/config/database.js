const mysql = require("mysql2")
require("dotenv").config()

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "your_password",
  database: process.env.DB_NAME || "portfolio_management",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

const promisePool = pool.promise()

module.exports = promisePool
