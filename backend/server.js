const express = require("express")
const cors = require("cors")
const path = require("path")
require("dotenv").config()

// Import database
const db = require("./config/database")

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
app.use(express.static(path.join(__dirname, "../frontend")))

// Test database connection
async function testDB() {
  try {
    const [rows] = await db.execute("SELECT 1")
    console.log("✅ Database connected successfully")
  } catch (error) {
    console.error("❌ Database connection failed:", error.message)
  }
}

// API Routes

// Get all stocks
app.get("/api/stocks", async (req, res) => {
  try {
    const { search } = req.query
    let query = `
            SELECT s.*, 
                   sp.close as current_price,
                   sp.open, sp.high, sp.low
            FROM stocks s
            LEFT JOIN stock_prices sp ON s.id = sp.stock_id 
            AND sp.date = (SELECT MAX(date) FROM stock_prices WHERE stock_id = s.id)
        `

    let params = []
    if (search) {
      query += " WHERE s.symbol LIKE ? OR s.name LIKE ?"
      params = [`%${search}%`, `%${search}%`]
    }

    query += " ORDER BY s.symbol"

    const [rows] = await db.execute(query, params)
    res.json(rows)
  } catch (error) {
    console.error("Error fetching stocks:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Get stock details
app.get("/api/stocks/:id", async (req, res) => {
  try {
    const { id } = req.params

    const [stockRows] = await db.execute("SELECT * FROM stocks WHERE id = ?", [id])
    if (stockRows.length === 0) {
      return res.status(404).json({ error: "Stock not found" })
    }

    const [priceRows] = await db.execute(
      `
            SELECT date, open, close, high, low 
            FROM stock_prices 
            WHERE stock_id = ? 
            ORDER BY date DESC 
            LIMIT 30
        `,
      [id],
    )

    res.json({
      stock: stockRows[0],
      priceHistory: priceRows,
    })
  } catch (error) {
    console.error("Error fetching stock details:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Get wallet balance
app.get("/api/wallet", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT balance FROM wallet LIMIT 1")
    const balance = rows.length > 0 ? rows[0].balance : 0
    res.json({ balance })
  } catch (error) {
    console.error("Error fetching wallet balance:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Add money to wallet
app.post("/api/wallet/add", async (req, res) => {
  try {
    const { amount } = req.body

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" })
    }

    await db.execute("UPDATE wallet SET balance = balance + ? WHERE id = 1", [amount])
    const [rows] = await db.execute("SELECT balance FROM wallet WHERE id = 1")

    res.json({
      balance: rows[0].balance,
      message: "Money added successfully",
    })
  } catch (error) {
    console.error("Error adding money:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Withdraw money from wallet
app.post("/api/wallet/withdraw", async (req, res) => {
  try {
    const { amount } = req.body

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" })
    }

    const [balanceRows] = await db.execute("SELECT balance FROM wallet WHERE id = 1")
    const currentBalance = balanceRows[0].balance

    if (currentBalance < amount) {
      return res.status(400).json({ error: "Insufficient balance" })
    }

    await db.execute("UPDATE wallet SET balance = balance - ? WHERE id = 1", [amount])
    const [rows] = await db.execute("SELECT balance FROM wallet WHERE id = 1")

    res.json({
      balance: rows[0].balance,
      message: "Money withdrawn successfully",
    })
  } catch (error) {
    console.error("Error withdrawing money:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Get all transactions
app.get("/api/transactions", async (req, res) => {
  try {
    const [rows] = await db.execute(`
            SELECT t.*, s.symbol, s.name 
            FROM transactions t
            JOIN stocks s ON t.stock_id = s.id
            ORDER BY t.date DESC
        `)
    res.json(rows)
  } catch (error) {
    console.error("Error fetching transactions:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Buy stock
app.post("/api/transactions/buy", async (req, res) => {
  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    const { stock_id, quantity, price } = req.body
    const total_price = quantity * price

    // Check wallet balance
    const [walletRows] = await connection.execute("SELECT balance FROM wallet WHERE id = 1")
    const balance = walletRows[0].balance

    if (balance < total_price) {
      await connection.rollback()
      return res.status(400).json({ error: "Insufficient balance" })
    }

    // Insert transaction
    await connection.execute(
      `
            INSERT INTO transactions (stock_id, price, quantity, total_price, buy_sell)
            VALUES (?, ?, ?, ?, 1)
        `,
      [stock_id, price, quantity, total_price],
    )

    // Update wallet
    await connection.execute("UPDATE wallet SET balance = balance - ? WHERE id = 1", [total_price])

    // Update or insert holdings
    const [holdingRows] = await connection.execute("SELECT * FROM holdings WHERE stock_id = ?", [stock_id])

    if (holdingRows.length > 0) {
      const holding = holdingRows[0]
      const newQuantity = holding.quantity + quantity
      const newTotalPriceBought = holding.total_price_bought + total_price
      const currentValue = newQuantity * price
      const profitLoss = currentValue - newTotalPriceBought
      const profitLossPercent = (profitLoss / newTotalPriceBought) * 100

      await connection.execute(
        `
                UPDATE holdings 
                SET quantity = ?, total_price_bought = ?, total_current_value = ?,
                    profit_loss = ?, profit_loss_percent = ?
                WHERE stock_id = ?
            `,
        [newQuantity, newTotalPriceBought, currentValue, profitLoss, profitLossPercent, stock_id],
      )
    } else {
      const currentValue = quantity * price
      await connection.execute(
        `
                INSERT INTO holdings (stock_id, quantity, total_price_bought, total_current_value, profit_loss, profit_loss_percent)
                VALUES (?, ?, ?, ?, 0, 0)
            `,
        [stock_id, quantity, total_price, currentValue],
      )
    }

    await connection.commit()
    res.json({ message: "Stock purchased successfully" })
  } catch (error) {
    await connection.rollback()
    console.error("Error buying stock:", error)
    res.status(500).json({ error: "Internal server error" })
  } finally {
    connection.release()
  }
})

// Sell stock
app.post("/api/transactions/sell", async (req, res) => {
  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    const { stock_id, quantity, price } = req.body
    const total_price = quantity * price

    // Check if user has enough holdings
    const [holdingRows] = await connection.execute("SELECT * FROM holdings WHERE stock_id = ?", [stock_id])

    if (holdingRows.length === 0 || holdingRows[0].quantity < quantity) {
      await connection.rollback()
      return res.status(400).json({ error: "Insufficient holdings" })
    }

    // Insert transaction
    await connection.execute(
      `
            INSERT INTO transactions (stock_id, price, quantity, total_price, buy_sell)
            VALUES (?, ?, ?, ?, 0)
        `,
      [stock_id, price, quantity, total_price],
    )

    // Update wallet
    await connection.execute("UPDATE wallet SET balance = balance + ? WHERE id = 1", [total_price])

    // Update holdings
    const holding = holdingRows[0]
    const newQuantity = holding.quantity - quantity

    if (newQuantity === 0) {
      await connection.execute("DELETE FROM holdings WHERE stock_id = ?", [stock_id])
    } else {
      const avgBuyPrice = holding.total_price_bought / holding.quantity
      const newTotalPriceBought = newQuantity * avgBuyPrice
      const currentValue = newQuantity * price
      const profitLoss = currentValue - newTotalPriceBought
      const profitLossPercent = (profitLoss / newTotalPriceBought) * 100

      await connection.execute(
        `
                UPDATE holdings 
                SET quantity = ?, total_price_bought = ?, total_current_value = ?,
                    profit_loss = ?, profit_loss_percent = ?
                WHERE stock_id = ?
            `,
        [newQuantity, newTotalPriceBought, currentValue, profitLoss, profitLossPercent, stock_id],
      )
    }

    await connection.commit()
    res.json({ message: "Stock sold successfully" })
  } catch (error) {
    await connection.rollback()
    console.error("Error selling stock:", error)
    res.status(500).json({ error: "Internal server error" })
  } finally {
    connection.release()
  }
})

// Get all holdings
app.get("/api/holdings", async (req, res) => {
  try {
    const [rows] = await db.execute(`
            SELECT h.*, s.symbol, s.name,
                   sp.close as current_price
            FROM holdings h
            JOIN stocks s ON h.stock_id = s.id
            LEFT JOIN stock_prices sp ON s.id = sp.stock_id 
            AND sp.date = (SELECT MAX(date) FROM stock_prices WHERE stock_id = s.id)
            ORDER BY h.profit_loss_percent DESC
        `)

    // Update current values based on latest prices
    for (const holding of rows) {
      if (holding.current_price) {
        const currentValue = holding.quantity * holding.current_price
        const profitLoss = currentValue - holding.total_price_bought
        const profitLossPercent = (profitLoss / holding.total_price_bought) * 100

        await db.execute(
          `
                    UPDATE holdings 
                    SET total_current_value = ?, profit_loss = ?, profit_loss_percent = ?
                    WHERE stock_id = ?
                `,
          [currentValue, profitLoss, profitLossPercent, holding.stock_id],
        )

        holding.total_current_value = currentValue
        holding.profit_loss = profitLoss
        holding.profit_loss_percent = profitLossPercent
      }
    }

    res.json(rows)
  } catch (error) {
    console.error("Error fetching holdings:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Get portfolio statistics
app.get("/api/holdings/stats", async (req, res) => {
  try {
    const [holdings] = await db.execute(`
            SELECT h.*, s.symbol, s.name,
                   sp.close as current_price
            FROM holdings h
            JOIN stocks s ON h.stock_id = s.id
            LEFT JOIN stock_prices sp ON s.id = sp.stock_id 
            AND sp.date = (SELECT MAX(date) FROM stock_prices WHERE stock_id = s.id)
        `)

    let totalInvested = 0
    let totalCurrentValue = 0
    let totalProfitLoss = 0

    for (const holding of holdings) {
      totalInvested += Number.parseFloat(holding.total_price_bought)
      if (holding.current_price) {
        const currentValue = holding.quantity * holding.current_price
        totalCurrentValue += currentValue
      }
    }

    totalProfitLoss = totalCurrentValue - totalInvested
    const totalProfitLossPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0

    res.json({
      totalInvested,
      totalCurrentValue,
      totalProfitLoss,
      totalProfitLossPercent,
      totalStocks: holdings.length,
    })
  } catch (error) {
    console.error("Error fetching portfolio stats:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Get watchlist
app.get("/api/watchlist", async (req, res) => {
  try {
    const [rows] = await db.execute(`
            SELECT w.*, s.symbol, s.name,
                   sp.close as current_price,
                   sp.open, sp.high, sp.low
            FROM watchlist w
            JOIN stocks s ON w.stock_id = s.id
            LEFT JOIN stock_prices sp ON s.id = sp.stock_id 
            AND sp.date = (SELECT MAX(date) FROM stock_prices WHERE stock_id = s.id)
            ORDER BY w.added_at DESC
        `)
    res.json(rows)
  } catch (error) {
    console.error("Error fetching watchlist:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Add to watchlist
app.post("/api/watchlist/add", async (req, res) => {
  try {
    const { stock_id } = req.body

    const [stockRows] = await db.execute("SELECT name FROM stocks WHERE id = ?", [stock_id])
    if (stockRows.length === 0) {
      return res.status(404).json({ error: "Stock not found" })
    }

    const [existingRows] = await db.execute("SELECT id FROM watchlist WHERE stock_id = ?", [stock_id])
    if (existingRows.length > 0) {
      return res.status(400).json({ error: "Stock already in watchlist" })
    }

    await db.execute("INSERT INTO watchlist (stock_id, stock_name) VALUES (?, ?)", [stock_id, stockRows[0].name])
    res.json({ message: "Stock added to watchlist" })
  } catch (error) {
    console.error("Error adding to watchlist:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Remove from watchlist
app.delete("/api/watchlist/:stock_id", async (req, res) => {
  try {
    const { stock_id } = req.params
    await db.execute("DELETE FROM watchlist WHERE stock_id = ?", [stock_id])
    res.json({ message: "Stock removed from watchlist" })
  } catch (error) {
    console.error("Error removing from watchlist:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

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

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📊 Portfolio Management System is ready!`)
  await testDB()
})
