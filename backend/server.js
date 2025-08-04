const express = require("express")
const cors = require("cors")
const path = require("path")
require("dotenv").config()

// Import routes
const stockRoutes = require("./routes/stocks")
const walletRoutes = require("./routes/wallet")
const transactionRoutes = require("./routes/transactions")
const holdingRoutes = require("./routes/holdings")
const watchlistRoutes = require("./routes/watchlist")

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, "../frontend")))

// API Routes
app.use("/api/stocks", stockRoutes)
app.use("/api/wallet", walletRoutes)
app.use("/api/transactions", transactionRoutes)
app.use("/api/holdings", holdingRoutes)
app.use("/api/watchlist", watchlistRoutes)

// Serve main page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"))
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: "Something went wrong!" })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📊 Portfolio Management System is ready!`)
})
