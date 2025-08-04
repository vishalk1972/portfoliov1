const express = require("express")
const router = express.Router()
const db = require("../config/database")

// Get wallet balance
router.get("/", async (req, res) => {
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
router.post("/add", async (req, res) => {
  try {
    const { amount } = req.body

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" })
    }

    await db.execute("UPDATE wallet SET balance = balance + ? WHERE id = 1", [amount])

    const [rows] = await db.execute("SELECT balance FROM wallet WHERE id = 1")
    res.json({ balance: rows[0].balance, message: "Money added successfully" })
  } catch (error) {
    console.error("Error adding money:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Withdraw money from wallet
router.post("/withdraw", async (req, res) => {
  try {
    const { amount } = req.body

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" })
    }

    // Check if sufficient balance
    const [balanceRows] = await db.execute("SELECT balance FROM wallet WHERE id = 1")
    const currentBalance = balanceRows[0].balance

    if (currentBalance < amount) {
      return res.status(400).json({ error: "Insufficient balance" })
    }

    await db.execute("UPDATE wallet SET balance = balance - ? WHERE id = 1", [amount])

    const [rows] = await db.execute("SELECT balance FROM wallet WHERE id = 1")
    res.json({ balance: rows[0].balance, message: "Money withdrawn successfully" })
  } catch (error) {
    console.error("Error withdrawing money:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

module.exports = router
