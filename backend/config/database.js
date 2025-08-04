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
  acquireTimeout: 60000,
  timeout: 60000,
})

const promisePool = pool.promise()

// Test database connection
const testConnection = async () => {
  try {
    const connection = await promisePool.getConnection()
    console.log("✅ Database connected successfully")
    connection.release()
  } catch (error) {
    console.error("❌ Database connection failed:", error.message)
  }
}

testConnection()

module.exports = promisePool
