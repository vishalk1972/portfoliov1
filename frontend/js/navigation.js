// Navigation Management
const Navigation = {
  currentSection: "dashboard",
  Dashboard: { load: () => {} },
  Stocks: { load: () => {} },
  Portfolio: { load: () => {} },
  Watchlist: { load: () => {} },
  Wallet: { load: () => {} },
  Utils: { showNotification: (message, type) => {} },
}

Navigation.init = function () {
  this.setupEventListeners()
  this.showSection("dashboard")
}

Navigation.setupEventListeners = function () {
  const navButtons = document.querySelectorAll(".nav-btn")

  navButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      const section = e.target.dataset.section
      this.switchSection(section)
    })
  })
}

Navigation.switchSection = function (sectionName) {
  console.log(`Switching to section: ${sectionName}`)

  // Update navigation buttons
  this.updateNavButtons(sectionName)

  // Show the selected section
  this.showSection(sectionName)

  // Update current section
  this.currentSection = sectionName

  // Load section-specific data
  this.loadSectionData(sectionName)
}

Navigation.updateNavButtons = (activeSectionName) => {
  const navButtons = document.querySelectorAll(".nav-btn")

  navButtons.forEach((btn) => {
    btn.classList.remove("active")
    btn.setAttribute("aria-pressed", "false")
  })

  const activeBtn = document.querySelector(`[data-section="${activeSectionName}"]`)
  if (activeBtn) {
    activeBtn.classList.add("active")
    activeBtn.setAttribute("aria-pressed", "true")
  }
}

Navigation.showSection = (sectionName) => {
  // Hide all sections
  const sections = document.querySelectorAll(".section")
  sections.forEach((section) => {
    section.classList.remove("active")
  })

  // Show the selected section
  const activeSection = document.getElementById(sectionName)
  if (activeSection) {
    activeSection.classList.add("active")
    console.log(`Section ${sectionName} is now active`)
  } else {
    console.error(`Section ${sectionName} not found`)
  }
}

Navigation.loadSectionData = async function (sectionName) {
  try {
    switch (sectionName) {
      case "dashboard":
        await this.Dashboard.load()
        break
      case "stocks":
        await this.Stocks.load()
        break
      case "portfolio":
        await this.Portfolio.load()
        break
      case "watchlist":
        await this.Watchlist.load()
        break
      case "wallet":
        await this.Wallet.load()
        break
      default:
        console.warn(`Unknown section: ${sectionName}`)
    }
  } catch (error) {
    console.error(`Error loading ${sectionName}:`, error)
    this.Utils.showNotification(`Error loading ${sectionName}`, "error")
  }
}
