// API Configuration
const API_BASE_URL = "/api"

// Import axios
const axios = require("axios")

// API Helper Functions
const api = {
  // Stocks API
  async getStocks(search = "") {
    try {
      const url = search ? `${API_BASE_URL}/stocks?search=${encodeURIComponent(search)}` : `${API_BASE_URL}/stocks`
      const response = await axios.get(url)
      return response.data
    } catch (error) {
      console.error("Error fetching stocks:", error)
      throw error
    }
  },

  async getStockDetails(stockId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/stocks/${stockId}`)
      return response.data
    } catch (error) {
      console.error("Error fetching stock details:", error)
      throw error
    }
  },

  // Wallet API
  async getWalletBalance() {
    try {
      const response = await axios.get(`${API_BASE_URL}/wallet`)
      return response.data
    } catch (error) {
      console.error("Error fetching wallet balance:", error)
      throw error
    }
  },

  async addMoney(amount) {
    try {
      const response = await axios.post(`${API_BASE_URL}/wallet/add`, { amount })
      return response.data
    } catch (error) {
      console.error("Error adding money:", error)
      throw error
    }
  },

  async withdrawMoney(amount) {
    try {
      const response = await axios.post(`${API_BASE_URL}/wallet/withdraw`, { amount })
      return response.data
    } catch (error) {
      console.error("Error withdrawing money:", error)
      throw error
    }
  },

  // Transactions API
  async getTransactions() {
    try {
      const response = await axios.get(`${API_BASE_URL}/transactions`)
      return response.data
    } catch (error) {
      console.error("Error fetching transactions:", error)
      throw error
    }
  },

  async buyStock(stockId, quantity, price) {
    try {
      const response = await axios.post(`${API_BASE_URL}/transactions/buy`, {
        stock_id: stockId,
        quantity,
        price,
      })
      return response.data
    } catch (error) {
      console.error("Error buying stock:", error)
      throw error
    }
  },

  async sellStock(stockId, quantity, price) {
    try {
      const response = await axios.post(`${API_BASE_URL}/transactions/sell`, {
        stock_id: stockId,
        quantity,
        price,
      })
      return response.data
    } catch (error) {
      console.error("Error selling stock:", error)
      throw error
    }
  },

  // Holdings API
  async getHoldings() {
    try {
      const response = await axios.get(`${API_BASE_URL}/holdings`)
      return response.data
    } catch (error) {
      console.error("Error fetching holdings:", error)
      throw error
    }
  },

  async getPortfolioStats() {
    try {
      const response = await axios.get(`${API_BASE_URL}/holdings/stats`)
      return response.data
    } catch (error) {
      console.error("Error fetching portfolio stats:", error)
      throw error
    }
  },

  // Watchlist API
  async getWatchlist() {
    try {
      const response = await axios.get(`${API_BASE_URL}/watchlist`)
      return response.data
    } catch (error) {
      console.error("Error fetching watchlist:", error)
      throw error
    }
  },

  async addToWatchlist(stockId) {
    try {
      const response = await axios.post(`${API_BASE_URL}/watchlist/add`, {
        stock_id: stockId,
      })
      return response.data
    } catch (error) {
      console.error("Error adding to watchlist:", error)
      throw error
    }
  },

  async removeFromWatchlist(stockId) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/watchlist/${stockId}`)
      return response.data
    } catch (error) {
      console.error("Error removing from watchlist:", error)
      throw error
    }
  },
}

// Utility Functions
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

function formatPercentage(percentage) {
  return `${percentage >= 0 ? "+" : ""}${percentage.toFixed(2)}%`
}

function showNotification(message, type = "info") {
  // Create notification element
  const notification = document.createElement("div")
  notification.className = `notification notification-${type}`
  notification.textContent = message

  // Add styles
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `

  // Set background color based on type
  const colors = {
    success: "#28a745",
    error: "#dc3545",
    warning: "#ffc107",
    info: "#17a2b8",
  }
  notification.style.backgroundColor = colors[type] || colors.info

  // Add to DOM
  document.body.appendChild(notification)

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease"
    setTimeout(() => {
      document.body.removeChild(notification)
    }, 300)
  }, 3000)
}

// Add CSS animations for notifications
const style = document.createElement("style")
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`
document.head.appendChild(style)
