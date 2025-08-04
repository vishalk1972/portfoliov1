const express = require("express")
const router = express.Router()
const db = require("../config/database")

// Get all transactions
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.execute(`
            SELECT t.*, s.symbol, s.name 
            FROM transactions t
            JOIN stocks s ON t.stock_id = s.id
            ORDER BY t.date DESC
        `)

    res.json({
      success: true,
      data: rows,
    })
  } catch (error) {
    console.error("Error fetching transactions:", error)
    res.status(500).json({
      success: false,
      error: "Failed to fetch transactions",
    })
  }
})

// Buy stock
router.post("/buy", async (req, res) => {
  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    const { stock_id, quantity, price } = req.body
    const total_price = quantity * price

    // Validate input
    if (!stock_id || !quantity || !price || quantity <= 0 || price <= 0) {
      await connection.rollback()
      return res.status(400).json({
        success: false,
        error: "Invalid input parameters",
      })
    }

    // Check wallet balance
    const [walletRows] = await connection.execute("SELECT balance FROM wallet WHERE id = 1")
    const balance = walletRows[0].balance

    if (balance < total_price) {
      await connection.rollback()
      return res.status(400).json({
        success: false,
        error: "Insufficient balance",
      })
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
      // Update existing holding
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
      // Insert new holding
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
    res.json({
      success: true,
      message: "Stock purchased successfully",
    })
  } catch (error) {
    await connection.rollback()
    console.error("Error buying stock:", error)
    res.status(500).json({
      success: false,
      error: "Failed to purchase stock",
    })
  } finally {
    connection.release()
  }
})

// Sell stock
router.post("/sell", async (req, res) => {
  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    const { stock_id, quantity, price } = req.body
    const total_price = quantity * price

    // Validate input
    if (!stock_id || !quantity || !price || quantity <= 0 || price <= 0) {
      await connection.rollback()
      return res.status(400).json({
        success: false,
        error: "Invalid input parameters",
      })
    }

    // Check if user has enough holdings
    const [holdingRows] = await connection.execute("SELECT * FROM holdings WHERE stock_id = ?", [stock_id])

    if (holdingRows.length === 0 || holdingRows[0].quantity < quantity) {
      await connection.rollback()
      return res.status(400).json({
        success: false,
        error: "Insufficient holdings",
      })
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
      // Delete holding if quantity becomes 0
      await connection.execute("DELETE FROM holdings WHERE stock_id = ?", [stock_id])
    } else {
      // Update holding
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
    res.json({
      success: true,
      message: "Stock sold successfully",
    })
  } catch (error) {
    await connection.rollback()
    console.error("Error selling stock:", error)
    res.status(500).json({
      success: false,
      error: "Failed to sell stock",
    })
  } finally {
    connection.release()
  }
})

module.exports = router
