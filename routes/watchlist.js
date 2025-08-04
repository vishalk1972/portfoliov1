const express = require("express")
const router = express.Router()
const db = require("../config/database")

// Get watchlist
router.get("/", async (req, res) => {
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
router.post("/add", async (req, res) => {
  try {
    const { stock_id } = req.body

    // Get stock name
    const [stockRows] = await db.execute("SELECT name FROM stocks WHERE id = ?", [stock_id])

    if (stockRows.length === 0) {
      return res.status(404).json({ error: "Stock not found" })
    }

    // Check if already in watchlist
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
router.delete("/:stock_id", async (req, res) => {
  try {
    const { stock_id } = req.params

    await db.execute("DELETE FROM watchlist WHERE stock_id = ?", [stock_id])
    res.json({ message: "Stock removed from watchlist" })
  } catch (error) {
    console.error("Error removing from watchlist:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

module.exports = router
