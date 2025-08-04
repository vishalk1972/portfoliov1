// API Configuration and Functions
import axios from "axios" // Declare axios variable

const API = {
  baseURL: "/api",

  // Generic API call function
  async call(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
        ...options,
      }

      const response = await axios(url, config)
      return response.data
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error)

      // Handle different error types
      if (error.response) {
        // Server responded with error status
        throw new Error(error.response.data.error || "Server error occurred")
      } else if (error.request) {
        // Request was made but no response received
        throw new Error("Network error - please check your connection")
      } else {
        // Something else happened
        throw new Error("An unexpected error occurred")
      }
    }
  },

  // Stocks API
  stocks: {
    async getAll(search = "") {
      const endpoint = search ? `/stocks?search=${encodeURIComponent(search)}` : "/stocks"
      return await API.call(endpoint)
    },

    async getDetails(stockId) {
      return await API.call(`/stocks/${stockId}`)
    },
  },

  // Wallet API
  wallet: {
    async getBalance() {
      return await API.call("/wallet")
    },

    async addMoney(amount) {
      return await API.call("/wallet/add", {
        method: "POST",
        data: { amount },
      })
    },

    async withdrawMoney(amount) {
      return await API.call("/wallet/withdraw", {
        method: "POST",
        data: { amount },
      })
    },
  },

  // Transactions API
  transactions: {
    async getAll() {
      return await API.call("/transactions")
    },

    async buy(stockId, quantity, price) {
      return await API.call("/transactions/buy", {
        method: "POST",
        data: {
          stock_id: stockId,
          quantity,
          price,
        },
      })
    },

    async sell(stockId, quantity, price) {
      return await API.call("/transactions/sell", {
        method: "POST",
        data: {
          stock_id: stockId,
          quantity,
          price,
        },
      })
    },
  },

  // Holdings API
  holdings: {
    async getAll() {
      return await API.call("/holdings")
    },

    async getStats() {
      return await API.call("/holdings/stats")
    },
  },

  // Watchlist API
  watchlist: {
    async getAll() {
      return await API.call("/watchlist")
    },

    async add(stockId) {
      return await API.call("/watchlist/add", {
        method: "POST",
        data: { stock_id: stockId },
      })
    },

    async remove(stockId) {
      return await API.call(`/watchlist/${stockId}`, {
        method: "DELETE",
      })
    },
  },
}
