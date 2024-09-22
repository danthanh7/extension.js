import path from 'path'
import {execSync} from 'child_process'
import {extensionFixtures} from '../extension-fixtures'
// import {extensionFixturesFirefox} from '../extension-fixtures-firefox'
import {
  TestType,
  PlaywrightTestArgs,
  PlaywrightWorkerArgs
} from '@playwright/test'

const exampleDir = 'examples/content'
const pathToChromeExtension = path.join(__dirname, `dist/chrome`)
// const pathToFirefoxExtension = path.join(__dirname, `dist/firefox`)

// Use Playwright's default test arguments (PlaywrightTestArgs, PlaywrightWorkerArgs)
const testChrome: TestType<PlaywrightTestArgs, PlaywrightWorkerArgs> =
  extensionFixtures(pathToChromeExtension, true)
// const testFirefox: TestType<PlaywrightTestArgs, PlaywrightWorkerArgs> =
//   extensionFixturesFirefox(pathToFirefoxExtension, true)

interface TestBrowsersType {
  name: string
  test: TestType<PlaywrightTestArgs, PlaywrightWorkerArgs>
  extensionPath: string
}

const browsers: TestBrowsersType[] = [
  {
    name: 'chrome',
    test: testChrome,
    extensionPath: pathToChromeExtension
  },
  // {
  //   name: 'firefox',
  //   test: testFirefox,
  //   extensionPath: pathToFirefoxExtension
  // }
]

browsers.forEach(({name, test}: TestBrowsersType) => {
  test.beforeAll(async () => {
    // Build the extension before running tests
    execSync(`pnpm extension build ${exampleDir} --browser=${name}`, {
      cwd: path.join(__dirname, '..')
    })
  })

  test(`as ${name} extension - should inject an element with the class name content_script`, async ({
    page
  }) => {
    await page.goto('https://extension.js.org/')
    const div = page.locator('body > div.content_script')
    await test.expect(div).toBeVisible()
  })

  test(`as ${name} extension - should inject an h1 element with the specified content`, async ({
    page
  }) => {
    await page.goto('https://extension.js.org/')
    const h1 = page.locator('body > div.content_script > h1.content_title')
    await test.expect(h1).toHaveText('Welcome to your Content Script Extension')
  })

  test(`as ${name} extension - should ensure the logo image is loaded correctly`, async ({
    page
  }) => {
    await page.goto('https://extension.js.org/')
    const logo = page.locator('body > div.content_script > img.content_logo')
    const logoSrc = await logo.getAttribute('src')

    // Ensure the logo src is correct and the image is loaded
    test.expect(logoSrc).toContain('logo.svg')
    await test.expect(logo).toBeVisible()
  })

  test(`as ${name} extension - should check the description link is rendered correctly`, async ({
    page
  }) => {
    await page.goto('https://extension.js.org/')
    const link = page.locator(
      'body > div.content_script > p.content_description > a'
    )

    // Ensure the href attribute is correct and the link is visible
    await test.expect(link).toHaveAttribute('href', 'https://extension.js.org')
    await test.expect(link).toBeVisible()
  })

  test(`as ${name} extension - should ensure the h1 element has the default color`, async ({
    page
  }) => {
    await page.goto('https://extension.js.org/')
    const h1 = page.locator('body > div.content_script > h1.content_title')

    const color = await page.evaluate(
      (locator) => window.getComputedStyle(locator!).getPropertyValue('color'),
      await h1.elementHandle()
    )

    // Verify that the color is set correctly
    test.expect(color).toEqual('rgb(201, 201, 201)')
  })
})
