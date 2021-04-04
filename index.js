require('dotenv').config()
const fs = require('fs')
const puppeteer = require('puppeteer-core')
const { basename } = require('path')

/**
 * Variables from env
 */
const VIEWPORT_HEIGHT = parseInt(process.env.VIEWPORT_HEIGHT) || 1080
const VIEWPORT_WIDTH = parseInt(process.env.VIEWPORT_WIDTH) || 1920
const BROWSER_PATH = process.env.BROWSER_PATH.trim()

/**
 * Base url, may change if you want to test live system
 */
const sleepTime = 3000
const viewPort = {
  height: VIEWPORT_HEIGHT,
  width: VIEWPORT_WIDTH
}

/**
 * A utility to emulate sleep in program
 * @param {*} ms - Sleep time in ms
 */
function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Takes screenshot of the given URL
 * @param {String} url This URL will be screenshotted
 */
const takeScreenshot = async (url) => {
  /**
   * Set browser options and launch it
   */
  const browser = await puppeteer.launch({
    headless: true, // Opens a chrome in UI
    executablePath: BROWSER_PATH, // Chrome location in your system,
    args: [`--window-size=${viewPort.width},${viewPort.height}`]
  })
  const page = await browser.newPage() // New Tab
  page.setViewport(viewPort)

  /**
   * Goto to homepage and wait until all network requests are complete
   */
  await page.goto(url, {
    waitUntil: 'networkidle2'
  })
  await sleep(sleepTime)

  /**
   * Take a screenshot
   */
  const filenameOfScreenshot = `./screenshots/${basename(url)}.png`
  console.log(`Trying to save: ${filenameOfScreenshot}`)
  await page.screenshot({
    path: filenameOfScreenshot
  })

  /**
   * Close browser
   */
  await browser.close()
}

/**
 * Takes a screenshot of all given domains
 * @param domains Array of strings to be screenshotted
 */
const screenshotAllDomains = async (domains) => {
  for (let i = 0; i < domains.length; i++) {
    try {
      console.log(`Processing: ${domains[i]}`)
      await takeScreenshot(domains[i])
    } catch (e) {
      console.log(`Failed: ${domains[i]}`)
    }
  }
  process.exit(0)
}

try {
  const fileName = process.argv[2].trim()
  const file = fs.readFileSync(fileName, 'UTF-8')
  const domains = []
  const lines = file.split(/\r?\n/)

  lines.forEach((domain) => {
    if (domain.startsWith('http')) {
      domains.push(domain.trim())
    } else {
      domains.push(`http://${domain.trim()}`)
    }
  })
  screenshotAllDomains(domains)
} catch (e) {
  console.error('Unable to read/parse file')
}
