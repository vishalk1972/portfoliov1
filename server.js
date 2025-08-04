const express = require("express")
const cors = require("cors")
const path = require("path")
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
app.use(express.static(path.join(__dirname, "public")))

// Routes
app.use("/api/stocks", stockRoutes)
app.use("/api/wallet", walletRoutes)
app.use("/api/transactions", transactionRoutes)
app.use("/api/holdings", holdingRoutes)
app.use("/api/watchlist", watchlistRoutes)

// Serve main page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"))
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
