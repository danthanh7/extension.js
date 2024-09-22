import {test as base, firefox, type BrowserContext} from '@playwright/test'
import {loadFirefoxAddon} from './messaging-client'

export const extensionFixturesFirefox = (
  pathToExtension: string,
  headless: boolean
) => {
  return base.extend<{
    context: BrowserContext
    extensionId: string
  }>({
    context: async ({}, use) => {
      // Connect with the Extension.js remote desktop client
      const RDP_PORT = 9222

      // Override or add custom preferences here if needed
      const masterPreferences = {}

      // Create a temporary profile path for Firefox
      const firefoxProfilePath = ''

      const context = await firefox.launchPersistentContext(
        firefoxProfilePath,
        {
          headless: headless,
          args: [`-start-debugger-server=${String(RDP_PORT)}`].filter(
            (arg) => !!arg
          ),
          firefoxUserPrefs: {
            ...masterPreferences,
            'devtools.debugger.remote-enabled': true,
            'devtools.debugger.prompt-connection': false
          }
        }
      )

      
      // Use the context in the test
      await use(context)
      
      // Await the addon loading to ensure it's complete before proceeding
      await loadFirefoxAddon(RDP_PORT, '127.0.0.1', pathToExtension)

      // Close the context after the test
      // await context.close()
    },
    extensionId: async ({context}, use) => {
      // For manifest v2:
      let [background] = context.backgroundPages()
      if (!background) background = await context.waitForEvent('backgroundpage')

      const extensionId = background.url().split('/')[2]
      await use(extensionId)
    }
  })
}
