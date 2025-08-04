const db = require("../config/database")

class StockController {
  // Get all stocks with search functionality
  static async getAllStocks(req, res) {
    try {
      const { search } = req.query
      let query = `
                SELECT s.*, 
                       sp.close as current_price,
                       sp.open,
                       sp.high,
                       sp.low
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
      res.json({
        success: true,
        data: rows,
        count: rows.length,
      })
    } catch (error) {
      console.error("Error fetching stocks:", error)
      res.status(500).json({
        success: false,
        error: "Failed to fetch stocks",
      })
    }
  }

  // Get stock details with price history
  static async getStockDetails(req, res) {
    try {
      const { id } = req.params

      // Get stock details
      const [stockRows] = await db.execute("SELECT * FROM stocks WHERE id = ?", [id])

      if (stockRows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Stock not found",
        })
      }

      // Get price history (last 30 days)
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
        success: true,
        data: {
          stock: stockRows[0],
          priceHistory: priceRows,
        },
      })
    } catch (error) {
      console.error("Error fetching stock details:", error)
      res.status(500).json({
        success: false,
        error: "Failed to fetch stock details",
      })
    }
  }
}

module.exports = StockController
