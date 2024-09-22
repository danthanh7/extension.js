import path from 'path'
import {execSync} from 'child_process'
import {extensionFixtures} from '../extension-fixtures'
import {extensionFixturesFirefox} from '../extension-fixtures-firefox'
import {
  TestType,
  PlaywrightTestArgs,
  PlaywrightWorkerArgs
} from '@playwright/test'

const exampleDir = 'examples/content'
const pathToChromeExtension = path.join(__dirname, `dist/chrome`)
const pathToFirefoxExtension = path.join(__dirname, `dist/firefox`)

// Use Playwright's default test arguments (PlaywrightTestArgs, PlaywrightWorkerArgs)
const testChrome: TestType<PlaywrightTestArgs, PlaywrightWorkerArgs> =
  extensionFixtures(pathToChromeExtension, true)
const testFirefox: TestType<PlaywrightTestArgs, PlaywrightWorkerArgs> =
  extensionFixturesFirefox(pathToFirefoxExtension, true)

interface TestBrowsersType {
  name: string
  test: TestType<PlaywrightTestArgs, PlaywrightWorkerArgs>
  extensionPath: string
}

const browsers: TestBrowsersType[] = [
  {
    name: 'chromium',
    test: testChrome,
    extensionPath: pathToChromeExtension
  },
  {
    name: 'firefox',
    test: testFirefox,
    extensionPath: pathToFirefoxExtension
  }
]

browsers.forEach(({name, test}: TestBrowsersType) => {
  test.beforeAll(async () => {
    // Build the extension before running tests
    execSync(`pnpm extension build ${exampleDir} --polyfill`, {
      cwd: path.join(__dirname, '..')
    })
  })

  test(`as ${name} extension - should exist an element with the class name content_script`, async ({
    page
  }) => {
    await page.goto('https://extension.js.org/')
    const div = page.locator('body > div.content_script')
    await test.expect(div).toBeVisible()
  })

  test(`as ${name} extension - should exist an h1 element with specified content`, async ({
    page
  }) => {
    await page.goto('https://extension.js.org/')
    const h1 = page.locator('body > div.content_script > h1')
    await test.expect(h1).toHaveText('Change the background-color ⬇')
  })

  test(`as ${name} extension - should exist a default color value`, async ({
    page
  }) => {
    await page.goto('https://extension.js.org/')
    const h1 = page.locator('body > div.content_script > h1')
    const color = await page.evaluate(
      (locator) => {
        return window.getComputedStyle(locator!).getPropertyValue('color')
      },
      await h1.elementHandle()
    )
    await test.expect(color).toEqual('rgb(51, 51, 51)')
  })
})
