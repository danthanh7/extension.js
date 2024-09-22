browser.runtime.onInstalled.addListener(() => {
  browser.tabs.create({
    url: './pages/main.html'
  })
})
