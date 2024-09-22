const extensionInfo = browser.runtime.getManifest()
const text = `${extensionInfo.name} v${extensionInfo.version} injected this script`
alert(text)
