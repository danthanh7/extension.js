browser.action.onClicked.addListener(openDemoTab)

function openDemoTab() {
  browser.tabs.create({url: './pages/index.html'})
}

browser.webNavigation.onDOMContentLoaded.addListener(async ({tabId, url}) => {
  if (url !== 'https://extension.js.org/#inject-programmatic') return
  const {options} = await browser.storage.local.get('options')
  browser.scripting.executeScript({
    target: {tabId},
    files: ['./scripts/content-script.js'],
    ...options
  })
})

browser.runtime.onMessage.addListener(async ({name, options}) => {
  if (name === 'inject-programmatic') {
    await browser.storage.local.set({options})
    await browser.tabs.create({
      url: 'https://extension.js.org/#inject-programmatic'
    })
  }
})
