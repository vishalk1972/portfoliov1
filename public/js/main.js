// Global variables
let currentSection = "dashboard"
let stocks = []
let holdings = []
let watchlist = []

// DOM Elements
const navButtons = document.querySelectorAll(".nav-btn")
const sections = document.querySelectorAll(".section")
const stockModal = document.getElementById("stock-modal")
const tradeModal = document.getElementById("trade-modal")
const stockSearch = document.getElementById("stock-search")

// Declare variables
const api = {
  getPortfolioStats: async () => {},
  getWalletBalance: async () => {},
  getStocks: async (query) => {},
  getHoldings: async () => {},
  getWatchlist: async () => {},
  getStockDetails: async (stockId) => {},
  addMoney: async (amount) => {},
  withdrawMoney: async (amount) => {},
  buyStock: async (stockId, quantity, price) => {},
  sellStock: async (stockId, quantity, price) => {},
  addToWatchlist: async (stockId) => {},
  removeFromWatchlist: async (stockId) => {},
}

const initializeCharts = () => {}
const showNotification = (message, type) => {}
const updatePortfolioChart = () => {}
const updatePerformanceChart = () => {}
const formatCurrency = (value) => {}
const formatPercentage = (value) => {}
const createStockPriceChart = (canvasId, priceHistory) => {}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  initializeApp()
  setupEventListeners()
})

// Initialize application
async function initializeApp() {
  try {
    await loadDashboard()
    await loadStocks()
    initializeCharts()
  } catch (error) {
    console.error("Error initializing app:", error)
    showNotification("Error loading application", "error")
  }
}

// Setup event listeners
function setupEventListeners() {
  // Navigation
  navButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const section = this.dataset.section
      switchSection(section)
    })
  })

  // Search functionality
  if (stockSearch) {
    let searchTimeout
    stockSearch.addEventListener("input", function () {
      clearTimeout(searchTimeout)
      searchTimeout = setTimeout(() => {
        searchStocks(this.value)
      }, 300)
    })
  }

  // Modal close buttons
  document.querySelectorAll(".modal-close").forEach((button) => {
    button.addEventListener("click", function () {
      closeModal(this.closest(".modal"))
    })
  })

  // Close modal when clicking outside
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", function (e) {
      if (e.target === this) {
        closeModal(this)
      }
    })
  })

  // Wallet forms
  const addMoneyForm = document.getElementById("add-money-form")
  const withdrawMoneyForm = document.getElementById("withdraw-money-form")

  if (addMoneyForm) {
    addMoneyForm.addEventListener("submit", handleAddMoney)
  }

  if (withdrawMoneyForm) {
    withdrawMoneyForm.addEventListener("submit", handleWithdrawMoney)
  }

  // Trade form
  const tradeForm = document.getElementById("trade-form")
  if (tradeForm) {
    tradeForm.addEventListener("submit", handleTrade)
  }

  // Keyboard navigation
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAllModals()
    }
  })
}

// Section switching
function switchSection(sectionName) {
  // Update navigation
  navButtons.forEach((btn) => {
    btn.classList.remove("active")
    btn.setAttribute("aria-pressed", "false")
  })

  const activeBtn = document.querySelector(`[data-section="${sectionName}"]`)
  if (activeBtn) {
    activeBtn.classList.add("active")
    activeBtn.setAttribute("aria-pressed", "true")
  }

  // Update sections
  sections.forEach((section) => {
    section.classList.remove("active")
  })

  const activeSection = document.getElementById(sectionName)
  if (activeSection) {
    activeSection.classList.add("active")
  }

  currentSection = sectionName

  // Load section-specific data
  loadSectionData(sectionName)
}

// Load section-specific data
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
    const [portfolioStats, walletData] = await Promise.all([api.getPortfolioStats(), api.getWalletBalance()])

    updateDashboardStats(portfolioStats, walletData)
    await updatePortfolioChart()
    await updatePerformanceChart()
  } catch (error) {
    console.error("Error loading dashboard:", error)
  }
}

function updateDashboardStats(stats, wallet) {
  const totalValueEl = document.getElementById("total-value")
  const totalInvestedEl = document.getElementById("total-invested")
  const totalPlEl = document.getElementById("total-pl")
  const walletBalanceEl = document.getElementById("wallet-balance")

  if (totalValueEl) totalValueEl.textContent = formatCurrency(stats.totalCurrentValue)
  if (totalInvestedEl) totalInvestedEl.textContent = formatCurrency(stats.totalInvested)
  if (totalPlEl) {
    totalPlEl.textContent = formatCurrency(stats.totalProfitLoss)
    totalPlEl.className = `stat-value ${stats.totalProfitLoss >= 0 ? "profit" : "loss"}`
  }
  if (walletBalanceEl) walletBalanceEl.textContent = formatCurrency(wallet.balance)
}

// Stocks functions
async function loadStocks() {
  try {
    stocks = await api.getStocks()
    renderStocks(stocks)
  } catch (error) {
    console.error("Error loading stocks:", error)
  }
}

async function searchStocks(query) {
  try {
    const searchResults = await api.getStocks(query)
    renderStocks(searchResults)
  } catch (error) {
    console.error("Error searching stocks:", error)
  }
}

function renderStocks(stocksData) {
  const stocksList = document.getElementById("stocks-list")
  if (!stocksList) return

  stocksList.innerHTML = ""

  if (stocksData.length === 0) {
    stocksList.innerHTML = '<p class="no-results">No stocks found</p>'
    return
  }

  stocksData.forEach((stock) => {
    const stockCard = createStockCard(stock)
    stocksList.appendChild(stockCard)
  })
}

function createStockCard(stock) {
  const card = document.createElement("div")
  card.className = "stock-card"
  card.setAttribute("role", "listitem")

  const currentPrice = stock.current_price || 0

  card.innerHTML = `
        <div class="stock-header">
            <span class="stock-symbol">${stock.symbol}</span>
            <span class="stock-price">${formatCurrency(currentPrice)}</span>
        </div>
        <div class="stock-name">${stock.name}</div>
        <div class="stock-actions">
            <button class="btn btn-primary" onclick="showStockDetails(${stock.id})" aria-label="View details for ${stock.name}">
                View Details
            </button>
            <button class="btn btn-secondary" onclick="showTradeModal(${stock.id}, '${stock.symbol}', ${currentPrice})" aria-label="Trade ${stock.name}">
                Trade
            </button>
            <button class="btn btn-secondary" onclick="addToWatchlist(${stock.id})" aria-label="Add ${stock.name} to watchlist">
                Watch
            </button>
        </div>
    `

  return card
}

// Portfolio functions
async function loadPortfolio() {
  try {
    holdings = await api.getHoldings()
    renderHoldings(holdings)
  } catch (error) {
    console.error("Error loading portfolio:", error)
  }
}

function renderHoldings(holdingsData) {
  const holdingsList = document.getElementById("holdings-list")
  if (!holdingsList) return

  holdingsList.innerHTML = ""

  if (holdingsData.length === 0) {
    holdingsList.innerHTML = '<p class="no-results">No holdings found</p>'
    return
  }

  holdingsData.forEach((holding) => {
    const holdingCard = createHoldingCard(holding)
    holdingsList.appendChild(holdingCard)
  })
}

function createHoldingCard(holding) {
  const card = document.createElement("div")
  card.className = "holding-card"
  card.setAttribute("role", "listitem")

  const profitLossClass = holding.profit_loss >= 0 ? "profit" : "loss"

  card.innerHTML = `
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

  return card
}

// Watchlist functions
async function loadWatchlist() {
  try {
    watchlist = await api.getWatchlist()
    renderWatchlist(watchlist)
  } catch (error) {
    console.error("Error loading watchlist:", error)
  }
}

function renderWatchlist(watchlistData) {
  const watchlistItems = document.getElementById("watchlist-items")
  if (!watchlistItems) return

  watchlistItems.innerHTML = ""

  if (watchlistData.length === 0) {
    watchlistItems.innerHTML = '<p class="no-results">No stocks in watchlist</p>'
    return
  }

  watchlistData.forEach((item) => {
    const watchlistCard = createWatchlistCard(item)
    watchlistItems.appendChild(watchlistCard)
  })
}

function createWatchlistCard(item) {
  const card = document.createElement("div")
  card.className = "stock-card"
  card.setAttribute("role", "listitem")

  const currentPrice = item.current_price || 0

  card.innerHTML = `
        <div class="stock-header">
            <span class="stock-symbol">${item.symbol}</span>
            <span class="stock-price">${formatCurrency(currentPrice)}</span>
        </div>
        <div class="stock-name">${item.name}</div>
        <div class="stock-actions">
            <button class="btn btn-primary" onclick="showStockDetails(${item.stock_id})" aria-label="View details for ${item.name}">
                View Details
            </button>
            <button class="btn btn-secondary" onclick="showTradeModal(${item.stock_id}, '${item.symbol}', ${currentPrice})" aria-label="Trade ${item.name}">
                Trade
            </button>
            <button class="btn btn-danger" onclick="removeFromWatchlist(${item.stock_id})" aria-label="Remove ${item.name} from watchlist">
                Remove
            </button>
        </div>
    `

  return card
}

// Wallet functions
async function loadWallet() {
  try {
    const walletData = await api.getWalletBalance()
    updateWalletBalance(walletData.balance)
  } catch (error) {
    console.error("Error loading wallet:", error)
  }
}

function updateWalletBalance(balance) {
  const currentBalanceEl = document.getElementById("current-balance")
  if (currentBalanceEl) {
    currentBalanceEl.textContent = formatCurrency(balance)
  }
}

async function handleAddMoney(e) {
  e.preventDefault()

  const amountInput = document.getElementById("add-amount")
  const amount = Number.parseFloat(amountInput.value)

  if (!amount || amount <= 0) {
    showNotification("Please enter a valid amount", "error")
    return
  }

  try {
    const result = await api.addMoney(amount)
    updateWalletBalance(result.balance)
    amountInput.value = ""
    showNotification(result.message, "success")

    // Update dashboard if visible
    if (currentSection === "dashboard") {
      loadDashboard()
    }
  } catch (error) {
    showNotification(error.response?.data?.error || "Error adding money", "error")
  }
}

async function handleWithdrawMoney(e) {
  e.preventDefault()

  const amountInput = document.getElementById("withdraw-amount")
  const amount = Number.parseFloat(amountInput.value)

  if (!amount || amount <= 0) {
    showNotification("Please enter a valid amount", "error")
    return
  }

  try {
    const result = await api.withdrawMoney(amount)
    updateWalletBalance(result.balance)
    amountInput.value = ""
    showNotification(result.message, "success")

    // Update dashboard if visible
    if (currentSection === "dashboard") {
      loadDashboard()
    }
  } catch (error) {
    showNotification(error.response?.data?.error || "Error withdrawing money", "error")
  }
}

// Modal functions
function showModal(modal) {
  modal.classList.add("active")
  modal.setAttribute("aria-hidden", "false")

  // Focus management
  const firstFocusable = modal.querySelector("button, input, select, textarea")
  if (firstFocusable) {
    firstFocusable.focus()
  }
}

function closeModal(modal) {
  modal.classList.remove("active")
  modal.setAttribute("aria-hidden", "true")
}

function closeAllModals() {
  document.querySelectorAll(".modal").forEach((modal) => {
    closeModal(modal)
  })
}

// Stock detail modal
async function showStockDetails(stockId) {
  try {
    const stockData = await api.getStockDetails(stockId)
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
                    <canvas id="stockPriceChart" width="400" height="200" aria-label="Stock price history chart"></canvas>
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

    showModal(stockModal)

    // Create price chart
    setTimeout(() => {
      createStockPriceChart("stockPriceChart", stockData.priceHistory)
    }, 100)
  } catch (error) {
    console.error("Error showing stock details:", error)
    showNotification("Error loading stock details", "error")
  }
}

// Trade modal
function showTradeModal(stockId, symbol, currentPrice) {
  const tradeStockIdInput = document.getElementById("trade-stock-id")
  const tradePriceInput = document.getElementById("trade-price")
  const tradeModalTitle = document.getElementById("trade-modal-title")

  if (tradeStockIdInput) tradeStockIdInput.value = stockId
  if (tradePriceInput) tradePriceInput.value = currentPrice
  if (tradeModalTitle) tradeModalTitle.textContent = `Trade ${symbol}`

  showModal(tradeModal)
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
      result = await api.buyStock(stockId, quantity, price)
    } else if (action === "sell") {
      result = await api.sellStock(stockId, quantity, price)
    }

    showNotification(result.message, "success")
    closeModal(tradeModal)

    // Reset form
    document.getElementById("trade-form").reset()

    // Refresh relevant sections
    if (currentSection === "portfolio") {
      loadPortfolio()
    }
    if (currentSection === "dashboard") {
      loadDashboard()
    }
  } catch (error) {
    showNotification(error.response?.data?.error || `Error ${action}ing stock`, "error")
  }
}

// Watchlist functions
async function addToWatchlist(stockId) {
  try {
    const result = await api.addToWatchlist(stockId)
    showNotification(result.message, "success")

    if (currentSection === "watchlist") {
      loadWatchlist()
    }
  } catch (error) {
    showNotification(error.response?.data?.error || "Error adding to watchlist", "error")
  }
}

async function removeFromWatchlist(stockId) {
  try {
    const result = await api.removeFromWatchlist(stockId)
    showNotification(result.message, "success")

    if (currentSection === "watchlist") {
      loadWatchlist()
    }
  } catch (error) {
    showNotification(error.response?.data?.error || "Error removing from watchlist", "error")
  }
}
