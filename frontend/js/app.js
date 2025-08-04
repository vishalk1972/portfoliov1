import { Chart } from "@/components/ui/chart"
// Global variables
let currentSection = "dashboard"
let portfolioChart = null
let performanceChart = null
let stockPriceChart = null

// Utility functions
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
  const notification = document.createElement("div")
  notification.className = `notification ${type}`
  notification.textContent = message

  document.body.appendChild(notification)

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease"
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification)
      }
    }, 300)
  }, 4000)
}

// Import axios
const axios = require("axios")

// API functions
const API = {
  async get(endpoint) {
    try {
      const response = await axios.get(`/api${endpoint}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || "Network error")
    }
  },

  async post(endpoint, data) {
    try {
      const response = await axios.post(`/api${endpoint}`, data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || "Network error")
    }
  },

  async delete(endpoint) {
    try {
      const response = await axios.delete(`/api${endpoint}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || "Network error")
    }
  },
}

// Navigation
function initNavigation() {
  const navButtons = document.querySelectorAll(".nav-btn")

  navButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const section = this.dataset.section
      switchSection(section)
    })
  })
}

function switchSection(sectionName) {
  // Update navigation buttons
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.remove("active")
  })

  const activeBtn = document.querySelector(`[data-section="${sectionName}"]`)
  if (activeBtn) {
    activeBtn.classList.add("active")
  }

  // Update sections
  document.querySelectorAll(".section").forEach((section) => {
    section.classList.remove("active")
  })

  const activeSection = document.getElementById(sectionName)
  if (activeSection) {
    activeSection.classList.add("active")
  }

  currentSection = sectionName

  // Load section data
  loadSectionData(sectionName)
}

async function loadSectionData(sectionName) {
  try {
    switch (sectionName) {
      case "dashboard":
        await loadDashboard()
        break
      case "stocks":
        await loadStocks()
        break
      case "portfolio":
        await loadPortfolio()
        break
      case "watchlist":
        await loadWatchlist()
        break
      case "wallet":
        await loadWallet()
        break
    }
  } catch (error) {
    console.error(`Error loading ${sectionName}:`, error)
    showNotification(`Error loading ${sectionName}`, "error")
  }
}

// Dashboard functions
async function loadDashboard() {
  try {
    const [portfolioStats, walletData] = await Promise.all([API.get("/holdings/stats"), API.get("/wallet")])

    updateDashboardStats(portfolioStats, walletData)
    await updateCharts()
  } catch (error) {
    console.error("Error loading dashboard:", error)
  }
}

function updateDashboardStats(stats, wallet) {
  document.getElementById("total-value").textContent = formatCurrency(stats.totalCurrentValue)
  document.getElementById("total-invested").textContent = formatCurrency(stats.totalInvested)

  const totalPlEl = document.getElementById("total-pl")
  totalPlEl.textContent = formatCurrency(stats.totalProfitLoss)
  totalPlEl.className = `stat-value ${stats.totalProfitLoss >= 0 ? "profit" : "loss"}`

  document.getElementById("wallet-balance").textContent = formatCurrency(wallet.balance)
}

async function updateCharts() {
  try {
    const holdings = await API.get("/holdings")

    // Portfolio Chart
    const ctx1 = document.getElementById("portfolioChart")
    if (ctx1 && holdings.length > 0) {
      if (portfolioChart) {
        portfolioChart.destroy()
      }

      portfolioChart = new Chart(ctx1, {
        type: "pie",
        data: {
          labels: holdings.map((h) => h.symbol),
          datasets: [
            {
              data: holdings.map((h) => Number.parseFloat(h.total_current_value)),
              backgroundColor: [
                "#FF6384",
                "#36A2EB",
                "#FFCE56",
                "#4BC0C0",
                "#9966FF",
                "#FF9F40",
                "#FF6384",
                "#C9CBCF",
                "#4BC0C0",
                "#FF6384",
              ],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
            },
          },
        },
      })
    }

    // Performance Chart
    const ctx2 = document.getElementById("performanceChart")
    if (ctx2 && holdings.length > 0) {
      if (performanceChart) {
        performanceChart.destroy()
      }

      performanceChart = new Chart(ctx2, {
        type: "bar",
        data: {
          labels: holdings.map((h) => h.symbol),
          datasets: [
            {
              label: "Profit/Loss",
              data: holdings.map((h) => Number.parseFloat(h.profit_loss)),
              backgroundColor: holdings.map((h) => (Number.parseFloat(h.profit_loss) >= 0 ? "#28a745" : "#dc3545")),
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      })
    }
  } catch (error) {
    console.error("Error updating charts:", error)
  }
}

// Stocks functions
async function loadStocks() {
  try {
    const stocks = await API.get("/stocks")
    renderStocks(stocks)
  } catch (error) {
    console.error("Error loading stocks:", error)
  }
}

function renderStocks(stocks) {
  const stocksList = document.getElementById("stocks-list")
  stocksList.innerHTML = ""

  if (stocks.length === 0) {
    stocksList.innerHTML = '<p class="no-results">No stocks found</p>'
    return
  }

  stocks.forEach((stock) => {
    const stockCard = document.createElement("div")
    stockCard.className = "stock-card"

    const currentPrice = stock.current_price || 0

    stockCard.innerHTML = `
            <div class="stock-header">
                <span class="stock-symbol">${stock.symbol}</span>
                <span class="stock-price">${formatCurrency(currentPrice)}</span>
            </div>
            <div class="stock-name">${stock.name}</div>
            <div class="stock-actions">
                <button class="btn btn-primary" onclick="showStockDetails(${stock.id})">
                    View Details
                </button>
                <button class="btn btn-secondary" onclick="showTradeModal(${stock.id}, '${stock.symbol}', ${currentPrice})">
                    Trade
                </button>
                <button class="btn btn-secondary" onclick="addToWatchlist(${stock.id})">
                    Watch
                </button>
            </div>
        `

    stocksList.appendChild(stockCard)
  })
}

// Portfolio functions
async function loadPortfolio() {
  try {
    const holdings = await API.get("/holdings")
    renderHoldings(holdings)
  } catch (error) {
    console.error("Error loading portfolio:", error)
  }
}

function renderHoldings(holdings) {
  const holdingsList = document.getElementById("holdings-list")
  holdingsList.innerHTML = ""

  if (holdings.length === 0) {
    holdingsList.innerHTML = '<p class="no-results">No holdings found</p>'
    return
  }

  holdings.forEach((holding) => {
    const holdingCard = document.createElement("div")
    holdingCard.className = "holding-card"

    const profitLossClass = holding.profit_loss >= 0 ? "profit" : "loss"

    holdingCard.innerHTML = `
            <div class="holding-info">
                <h3>${holding.symbol}</h3>
                <p>${holding.name}</p>
            </div>
            <div class="holding-quantity">
                <h4>Quantity</h4>
                <p>${holding.quantity}</p>
            </div>
            <div class="holding-value">
                <h4>Current Value</h4>
                <p>${formatCurrency(holding.total_current_value)}</p>
            </div>
            <div class="holding-pl">
                <h4>P&L</h4>
                <p class="${profitLossClass}">
                    ${formatCurrency(holding.profit_loss)}<br>
                    <small>(${formatPercentage(holding.profit_loss_percent)})</small>
                </p>
            </div>
        `

    holdingsList.appendChild(holdingCard)
  })
}

// Watchlist functions
async function loadWatchlist() {
  try {
    const watchlist = await API.get("/watchlist")
    renderWatchlist(watchlist)
  } catch (error) {
    console.error("Error loading watchlist:", error)
  }
}

function renderWatchlist(watchlist) {
  const watchlistItems = document.getElementById("watchlist-items")
  watchlistItems.innerHTML = ""

  if (watchlist.length === 0) {
    watchlistItems.innerHTML = '<p class="no-results">No stocks in watchlist</p>'
    return
  }

  watchlist.forEach((item) => {
    const watchlistCard = document.createElement("div")
    watchlistCard.className = "stock-card"

    const currentPrice = item.current_price || 0

    watchlistCard.innerHTML = `
            <div class="stock-header">
                <span class="stock-symbol">${item.symbol}</span>
                <span class="stock-price">${formatCurrency(currentPrice)}</span>
            </div>
            <div class="stock-name">${item.name}</div>
            <div class="stock-actions">
                <button class="btn btn-primary" onclick="showStockDetails(${item.stock_id})">
                    View Details
                </button>
                <button class="btn btn-secondary" onclick="showTradeModal(${item.stock_id}, '${item.symbol}', ${currentPrice})">
                    Trade
                </button>
                <button class="btn btn-danger" onclick="removeFromWatchlist(${item.stock_id})">
                    Remove
                </button>
            </div>
        `

    watchlistItems.appendChild(watchlistCard)
  })
}

// Wallet functions
async function loadWallet() {
  try {
    const walletData = await API.get("/wallet")
    document.getElementById("current-balance").textContent = formatCurrency(walletData.balance)
  } catch (error) {
    console.error("Error loading wallet:", error)
  }
}

// Modal functions
function showModal(modal) {
  modal.classList.add("active")
}

function closeModal(modal) {
  modal.classList.remove("active")
}

// Stock details modal
async function showStockDetails(stockId) {
  try {
    const stockData = await API.get(`/stocks/${stockId}`)
    const modalBody = document.getElementById("modal-body")

    const currentPrice = stockData.priceHistory[0]?.close || 0
    const openPrice = stockData.priceHistory[0]?.open || 0
    const highPrice = stockData.priceHistory[0]?.high || 0
    const lowPrice = stockData.priceHistory[0]?.low || 0

    modalBody.innerHTML = `
            <div class="stock-detail">
                <h3>${stockData.stock.name} (${stockData.stock.symbol})</h3>
                <div class="current-price">${formatCurrency(currentPrice)}</div>
                
                <div class="price-info">
                    <div>
                        <h4>Open</h4>
                        <p>${formatCurrency(openPrice)}</p>
                    </div>
                    <div>
                        <h4>High</h4>
                        <p>${formatCurrency(highPrice)}</p>
                    </div>
                    <div>
                        <h4>Low</h4>
                        <p>${formatCurrency(lowPrice)}</p>
                    </div>
                </div>
                
                <div class="chart-container">
                    <h4>Price History (30 Days)</h4>
                    <canvas id="stockPriceChart" width="400" height="200"></canvas>
                </div>
                
                <div class="stock-actions" style="margin-top: 1rem;">
                    <button class="btn btn-primary" onclick="showTradeModal(${stockId}, '${stockData.stock.symbol}', ${currentPrice})">
                        Trade Stock
                    </button>
                    <button class="btn btn-secondary" onclick="addToWatchlist(${stockId})">
                        Add to Watchlist
                    </button>
                </div>
            </div>
        `

    showModal(document.getElementById("stock-modal"))

    // Create price chart
    setTimeout(() => {
      createStockPriceChart(stockData.priceHistory)
    }, 100)
  } catch (error) {
    console.error("Error showing stock details:", error)
    showNotification("Error loading stock details", "error")
  }
}

function createStockPriceChart(priceHistory) {
  const ctx = document.getElementById("stockPriceChart")
  if (!ctx) return

  if (stockPriceChart) {
    stockPriceChart.destroy()
  }

  const labels = priceHistory.map((item) => new Date(item.date).toLocaleDateString()).reverse()
  const prices = priceHistory.map((item) => item.close).reverse()

  stockPriceChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Close Price",
          data: prices,
          borderColor: "#667eea",
          backgroundColor: "rgba(102, 126, 234, 0.1)",
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: false,
        },
      },
    },
  })
}

// Trade modal
function showTradeModal(stockId, symbol, currentPrice) {
  document.getElementById("trade-stock-id").value = stockId
  document.getElementById("trade-price").value = currentPrice
  document.getElementById("trade-modal-title").textContent = `Trade ${symbol}`

  showModal(document.getElementById("trade-modal"))
}

async function handleTrade(e) {
  e.preventDefault()

  const action = e.submitter.dataset.action
  const stockId = document.getElementById("trade-stock-id").value
  const quantity = Number.parseInt(document.getElementById("trade-quantity").value)
  const price = Number.parseFloat(document.getElementById("trade-price").value)

  if (!quantity || quantity <= 0) {
    showNotification("Please enter a valid quantity", "error")
    return
  }

  if (!price || price <= 0) {
    showNotification("Please enter a valid price", "error")
    return
  }

  try {
    let result
    if (action === "buy") {
      result = await API.post("/transactions/buy", {
        stock_id: stockId,
        quantity,
        price,
      })
    } else if (action === "sell") {
      result = await API.post("/transactions/sell", {
        stock_id: stockId,
        quantity,
        price,
      })
    }

    showNotification(result.message, "success")
    closeModal(document.getElementById("trade-modal"))

    // Reset form
    document.getElementById("trade-form").reset()

    // Refresh relevant sections
    if (currentSection === "portfolio") {
      await loadPortfolio()
    }
    if (currentSection === "dashboard") {
      await loadDashboard()
    }
  } catch (error) {
    showNotification(error.message, "error")
  }
}

// Watchlist functions
async function addToWatchlist(stockId) {
  try {
    const result = await API.post("/watchlist/add", { stock_id: stockId })
    showNotification(result.message, "success")

    if (currentSection === "watchlist") {
      await loadWatchlist()
    }
  } catch (error) {
    showNotification(error.message, "error")
  }
}

async function removeFromWatchlist(stockId) {
  try {
    const result = await API.delete(`/watchlist/${stockId}`)
    showNotification(result.message, "success")

    if (currentSection === "watchlist") {
      await loadWatchlist()
    }
  } catch (error) {
    showNotification(error.message, "error")
  }
}

// Wallet form handlers
async function handleAddMoney(e) {
  e.preventDefault()

  const amount = Number.parseFloat(document.getElementById("add-amount").value)

  if (!amount || amount <= 0) {
    showNotification("Please enter a valid amount", "error")
    return
  }

  try {
    const result = await API.post("/wallet/add", { amount })
    document.getElementById("current-balance").textContent = formatCurrency(result.balance)
    document.getElementById("add-amount").value = ""
    showNotification(result.message, "success")

    if (currentSection === "dashboard") {
      await loadDashboard()
    }
  } catch (error) {
    showNotification(error.message, "error")
  }
}

async function handleWithdrawMoney(e) {
  e.preventDefault()

  const amount = Number.parseFloat(document.getElementById("withdraw-amount").value)

  if (!amount || amount <= 0) {
    showNotification("Please enter a valid amount", "error")
    return
  }

  try {
    const result = await API.post("/wallet/withdraw", { amount })
    document.getElementById("current-balance").textContent = formatCurrency(result.balance)
    document.getElementById("withdraw-amount").value = ""
    showNotification(result.message, "success")

    if (currentSection === "dashboard") {
      await loadDashboard()
    }
  } catch (error) {
    showNotification(error.message, "error")
  }
}

// Search functionality
function setupSearch() {
  const searchInput = document.getElementById("stock-search")
  let searchTimeout

  searchInput.addEventListener("input", function () {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(async () => {
      try {
        const stocks = await API.get(`/stocks?search=${encodeURIComponent(this.value)}`)
        renderStocks(stocks)
      } catch (error) {
        console.error("Error searching stocks:", error)
      }
    }, 300)
  })
}

// Initialize app
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Initializing Portfolio Management App...")

  // Initialize navigation
  initNavigation()

  // Setup search
  setupSearch()

  // Setup modal event listeners
  document.querySelectorAll(".modal-close").forEach((button) => {
    button.addEventListener("click", function () {
      closeModal(this.closest(".modal"))
    })
  })

  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", function (e) {
      if (e.target === this) {
        closeModal(this)
      }
    })
  })

  // Setup form event listeners
  document.getElementById("add-money-form").addEventListener("submit", handleAddMoney)
  document.getElementById("withdraw-money-form").addEventListener("submit", handleWithdrawMoney)
  document.getElementById("trade-form").addEventListener("submit", handleTrade)

  // Load initial data
  await loadDashboard()

  console.log("✅ App initialized successfully")
})

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.querySelectorAll(".modal").forEach((modal) => {
      closeModal(modal)
    })
  }
})
