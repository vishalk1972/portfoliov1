const db = require("../config/database")

class WalletController {
  // Get wallet balance
  static async getBalance(req, res) {
    try {
      const [rows] = await db.execute("SELECT balance FROM wallet LIMIT 1")
      const balance = rows.length > 0 ? rows[0].balance : 0

      res.json({
        success: true,
        data: { balance },
      })
    } catch (error) {
      console.error("Error fetching wallet balance:", error)
      res.status(500).json({
        success: false,
        error: "Failed to fetch wallet balance",
      })
    }
  }

  // Add money to wallet
  static async addMoney(req, res) {
    try {
      const { amount } = req.body

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: "Invalid amount",
        })
      }

      await db.execute("UPDATE wallet SET balance = balance + ? WHERE id = 1", [amount])

      const [rows] = await db.execute("SELECT balance FROM wallet WHERE id = 1")

      res.json({
        success: true,
        data: { balance: rows[0].balance },
        message: "Money added successfully",
      })
    } catch (error) {
      console.error("Error adding money:", error)
      res.status(500).json({
        success: false,
        error: "Failed to add money",
      })
    }
  }

  // Withdraw money from wallet
  static async withdrawMoney(req, res) {
    try {
      const { amount } = req.body

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: "Invalid amount",
        })
      }

      // Check if sufficient balance
      const [balanceRows] = await db.execute("SELECT balance FROM wallet WHERE id = 1")
      const currentBalance = balanceRows[0].balance

      if (currentBalance < amount) {
        return res.status(400).json({
          success: false,
          error: "Insufficient balance",
        })
      }

      await db.execute("UPDATE wallet SET balance = balance - ? WHERE id = 1", [amount])

      const [rows] = await db.execute("SELECT balance FROM wallet WHERE id = 1")

      res.json({
        success: true,
        data: { balance: rows[0].balance },
        message: "Money withdrawn successfully",
      })
    } catch (error) {
      console.error("Error withdrawing money:", error)
      res.status(500).json({
        success: false,
        error: "Failed to withdraw money",
      })
    }
  }
}

module.exports = WalletController
