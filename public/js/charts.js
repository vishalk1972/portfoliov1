import { Chart } from "@/components/ui/chart"
// Chart instances
let portfolioChart = null
let performanceChart = null
let stockPriceChart = null

// Declare formatCurrency and api variables
const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value)
}

const api = {
  getHoldings: async () => {
    // Mock implementation for demonstration purposes
    return [
      { symbol: "AAPL", total_current_value: "1000", profit_loss: "50" },
      { symbol: "GOOGL", total_current_value: "2000", profit_loss: "-100" },
      // Add more holdings as needed
    ]
  },
}

// Initialize charts
function initializeCharts() {
  initializePortfolioChart()
  initializePerformanceChart()
}

// Portfolio Distribution Pie Chart
function initializePortfolioChart() {
  const ctx = document.getElementById("portfolioChart")
  if (!ctx) return

  portfolioChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: [],
      datasets: [
        {
          data: [],
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
          borderWidth: 2,
          borderColor: "#fff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding: 20,
            usePointStyle: true,
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || ""
              const value = formatCurrency(context.parsed)
              const percentage = ((context.parsed / context.dataset.data.reduce((a, b) => a + b, 0)) * 100).toFixed(1)
              return `${label}: ${value} (${percentage}%)`
            },
          },
        },
      },
    },
  })
}

// Performance Bar Chart
function initializePerformanceChart() {
  const ctx = document.getElementById("performanceChart")
  if (!ctx) return

  performanceChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: [],
      datasets: [
        {
          label: "Profit/Loss",
          data: [],
          backgroundColor: (context) => {
            const value = context.parsed.y
            return value >= 0 ? "#28a745" : "#dc3545"
          },
          borderColor: (context) => {
            const value = context.parsed.y
            return value >= 0 ? "#1e7e34" : "#bd2130"
          },
          borderWidth: 1,
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
        tooltip: {
          callbacks: {
            label: (context) => `P&L: ${formatCurrency(context.parsed.y)}`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => formatCurrency(value),
          },
        },
      },
    },
  })
}

// Stock Price Line Chart
function createStockPriceChart(canvasId, priceData) {
  const ctx = document.getElementById(canvasId)
  if (!ctx) return null

  // Destroy existing chart if it exists
  if (stockPriceChart) {
    stockPriceChart.destroy()
  }

  const labels = priceData.map((item) => new Date(item.date).toLocaleDateString())
  const prices = priceData.map((item) => item.close)

  stockPriceChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels.reverse(),
      datasets: [
        {
          label: "Close Price",
          data: prices.reverse(),
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
        tooltip: {
          callbacks: {
            label: (context) => `Price: ${formatCurrency(context.parsed.y)}`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            callback: (value) => formatCurrency(value),
          },
        },
      },
    },
  })

  return stockPriceChart
}

// Update portfolio chart with holdings data
async function updatePortfolioChart() {
  try {
    const holdings = await api.getHoldings()

    if (!portfolioChart || holdings.length === 0) return

    const labels = holdings.map((holding) => holding.symbol)
    const data = holdings.map((holding) => Number.parseFloat(holding.total_current_value))

    portfolioChart.data.labels = labels
    portfolioChart.data.datasets[0].data = data
    portfolioChart.update()
  } catch (error) {
    console.error("Error updating portfolio chart:", error)
  }
}

// Update performance chart with holdings data
async function updatePerformanceChart() {
  try {
    const holdings = await api.getHoldings()

    if (!performanceChart || holdings.length === 0) return

    const labels = holdings.map((holding) => holding.symbol)
    const data = holdings.map((holding) => Number.parseFloat(holding.profit_loss))

    performanceChart.data.labels = labels
    performanceChart.data.datasets[0].data = data
    performanceChart.update()
  } catch (error) {
    console.error("Error updating performance chart:", error)
  }
}
