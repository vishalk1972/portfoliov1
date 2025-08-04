// Utility Functions
const Utils = {
  // Format currency
  formatCurrency(amount) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  },

  // Format percentage
  formatPercentage(percentage) {
    return `${percentage >= 0 ? "+" : ""}${percentage.toFixed(2)}%`
  },

  // Show notification
  showNotification(message, type = "info") {
    const container = document.getElementById("notification-container")
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
            max-width: 300px;
            word-wrap: break-word;
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
    container.appendChild(notification)

    // Remove after 4 seconds
    setTimeout(() => {
      notification.style.animation = "slideOut 0.3s ease"
      setTimeout(() => {
        if (container.contains(notification)) {
          container.removeChild(notification)
        }
      }, 300)
    }, 4000)
  },

  // Show loading state
  showLoading(elementId) {
    const element = document.getElementById(elementId)
    if (element) {
      element.style.display = "block"
    }
  },

  // Hide loading state
  hideLoading(elementId) {
    const element = document.getElementById(elementId)
    if (element) {
      element.style.display = "none"
    }
  },

  // Debounce function
  debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  },
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

    .loading {
        display: none;
        text-align: center;
        padding: 2rem;
        color: #666;
        font-style: italic;
    }

    .no-results {
        text-align: center;
        padding: 2rem;
        color: #666;
        font-style: italic;
    }
`
document.head.appendChild(style)
