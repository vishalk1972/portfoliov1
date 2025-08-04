// Main Application Controller
class App {
  constructor() {
    this.isInitialized = false
  }

  async init() {
    if (this.isInitialized) return

    try {
      console.log("🚀 Initializing Portfolio Management App...")

      // Initialize navigation
      Navigation.init()

      // Initialize charts
      const Charts = {} // Declare Charts variable here
      Charts.init()

      // Setup global event listeners
      this.setupGlobalEventListeners()

      // Load initial data
      await this.loadInitialData()

      this.isInitialized = true
      console.log("✅ App initialized successfully")
    } catch (error) {
      console.error("❌ App initialization failed:", error)
      const Utils = {} // Declare Utils variable here
      Utils.showNotification("Failed to initialize application", "error")
    }
  }

  async loadInitialData() {
    try {
      // Load dashboard data by default
      const Dashboard = {} // Declare Dashboard variable here
      await Dashboard.load()
    } catch (error) {
      console.error("Error loading initial data:", error)
    }
  }

  setupGlobalEventListeners() {
    // Modal close functionality
    this.setupModalEventListeners()

    // Keyboard shortcuts
    this.setupKeyboardShortcuts()

    // Form submissions
    this.setupFormEventListeners()
  }

  setupModalEventListeners() {
    // Close modal buttons
    document.querySelectorAll(".modal-close").forEach((button) => {
      button.addEventListener("click", function () {
        const modal = this.closest(".modal")
        Modal.close(modal)
      })
    })

    // Close modal when clicking outside
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.addEventListener("click", function (e) {
        if (e.target === this) {
          Modal.close(this)
        }
      })
    })
  }

  setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      // Close modals with Escape key
      if (e.key === "Escape") {
        Modal.closeAll()
      }

      // Navigation shortcuts (Ctrl + number)
      if (e.ctrlKey && e.key >= "1" && e.key <= "5") {
        e.preventDefault()
        const sections = ["dashboard", "stocks", "portfolio", "watchlist", "wallet"]
        const sectionIndex = Number.parseInt(e.key) - 1
        if (sections[sectionIndex]) {
          Navigation.switchSection(sections[sectionIndex])
        }
      }
    })
  }

  setupFormEventListeners() {
    // Wallet forms
    const addMoneyForm = document.getElementById("add-money-form")
    const withdrawMoneyForm = document.getElementById("withdraw-money-form")
    const tradeForm = document.getElementById("trade-form")

    const Wallet = {} // Declare Wallet variable here
    if (addMoneyForm) {
      addMoneyForm.addEventListener("submit", Wallet.handleAddMoney)
    }

    if (withdrawMoneyForm) {
      withdrawMoneyForm.addEventListener("submit", Wallet.handleWithdrawMoney)
    }

    if (tradeForm) {
      tradeForm.addEventListener("submit", Wallet.handleTrade)
    }
  }
}

// Modal Management
const Modal = {
  show(modal) {
    modal.classList.add("active")
    modal.setAttribute("aria-hidden", "false")

    // Focus management
    const firstFocusable = modal.querySelector("button, input, select, textarea")
    if (firstFocusable) {
      firstFocusable.focus()
    }
  },

  close(modal) {
    modal.classList.remove("active")
    modal.setAttribute("aria-hidden", "true")
  },

  closeAll() {
    document.querySelectorAll(".modal").forEach((modal) => {
      this.close(modal)
    })
  },
}

// Trading functionality
const Trading = {
  showStockModal(stockId, symbol, currentPrice) {
    const tradeStockIdInput = document.getElementById("trade-stock-id")
    const tradePriceInput = document.getElementById("trade-price")
    const tradeModalTitle = document.getElementById("trade-modal-title")
    const tradeModal = document.getElementById("trade-modal")

    if (tradeStockIdInput) tradeStockIdInput.value = stockId
    if (tradePriceInput) tradePriceInput.value = currentPrice
    if (tradeModalTitle) tradeModalTitle.textContent = `Trade ${symbol}`

    Modal.show(tradeModal)
  },

  async handleTrade(e) {
    e.preventDefault()

    const action = e.submitter.dataset.action
    const stockId = document.getElementById("trade-stock-id").value
    const quantity = Number.parseInt(document.getElementById("trade-quantity").value)
    const price = Number.parseFloat(document.getElementById("trade-price").value)

    if (!quantity || quantity <= 0) {
      const Utils = {} // Declare Utils variable here
      Utils.showNotification("Please enter a valid quantity", "error")
      return
    }

    if (!price || price <= 0) {
      const Utils = {} // Declare Utils variable here
      Utils.showNotification("Please enter a valid price", "error")
      return
    }

    try {
      let result
      const API = {} // Declare API variable here
      if (action === "buy") {
        result = await API.transactions.buy(stockId, quantity, price)
      } else if (action === "sell") {
        result = await API.transactions.sell(stockId, quantity, price)
      }

      const Utils = {} // Declare Utils variable here
      Utils.showNotification(result.message, "success")
      Modal.close(document.getElementById("trade-modal"))

      // Reset form
      document.getElementById("trade-form").reset()

      // Refresh relevant sections
      const Portfolio = {} // Declare Portfolio variable here
      const Dashboard = {} // Declare Dashboard variable here
      if (Navigation.currentSection === "portfolio") {
        await Portfolio.load()
      }
      if (Navigation.currentSection === "dashboard") {
        await Dashboard.load()
      }
    } catch (error) {
      const Utils = {} // Declare Utils variable here
      Utils.showNotification(error.message, "error")
    }
  },
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const app = new App()
  app.init()
})

// Make functions globally available for onclick handlers
const Stocks = {} // Declare Stocks variable here
const Watchlist = {} // Declare Watchlist variable here
window.showStockDetails = Stocks.showDetails
window.showTradeModal = Trading.showStockModal
window.addToWatchlist = Watchlist.addStock
window.removeFromWatchlist = Watchlist.removeStock
