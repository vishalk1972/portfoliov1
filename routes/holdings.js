const express = require("express")
const router = express.Router()
const db = require("../config/database")

// Get all holdings
router.get("/", async (req, res) => {
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

        // Update in database
        await db.execute(
          `
                    UPDATE holdings 
                    SET total_current_value = ?, profit_loss = ?, profit_loss_percent = ?
                    WHERE stock_id = ?
                `,
          [currentValue, profitLoss, profitLossPercent, holding.stock_id],
        )

        // Update in response
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
router.get("/stats", async (req, res) => {
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

module.exports = router
