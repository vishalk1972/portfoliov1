const express = require("express")
const router = express.Router()
const WalletController = require("../controllers/walletController")

// GET /api/wallet - Get wallet balance
router.get("/", WalletController.getBalance)

// POST /api/wallet/add - Add money to wallet
router.post("/add", WalletController.addMoney)

// POST /api/wallet/withdraw - Withdraw money from wallet
router.post("/withdraw", WalletController.withdrawMoney)

module.exports = router
