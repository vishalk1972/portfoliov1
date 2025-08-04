const express = require("express")
const router = express.Router()
const StockController = require("../controllers/stockController")

// GET /api/stocks - Get all stocks with optional search
router.get("/", StockController.getAllStocks)

// GET /api/stocks/:id - Get stock details with price history
router.get("/:id", StockController.getStockDetails)

module.exports = router
