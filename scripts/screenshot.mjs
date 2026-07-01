// Captures full-page screenshots of every site route for before/after documentation.
// Usage: node scripts/screenshot.mjs <label>   (label e.g. "before" | "after")
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const label = process.argv[2] || 'before'
const base = process.env.BASE_URL || 'http://localhost:5173'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.resolve(__dirname, '..', 'docs', 'screenshots', label)
mkdirSync(outDir, { recursive: true })

// Route list is discovered from argv beyond label, else defaults to current nav.
const routes = process.env.ROUTES
  ? process.env.ROUTES.split(',')
  : [
      ['/', 'home'],
      ['/member-institutions-and-pis', 'nodes-researchers'],
      ['/fellows', 'fellows'],
      ['/project', 'project'],
      ['/events', 'events'],
      ['/publications', 'publications'],
      ['/outreach', 'outreach'],
      ['/news', 'news'],
    ].map(([p, n]) => `${p}|${n}`).join(',').split(',')

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
for (const entry of routes) {
  const [route, name] = entry.split('|')
  const url = base + route
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 })
    await page.waitForTimeout(1200) // let data-driven pages settle
    const file = path.join(outDir, `${name || route.replace(/\W+/g, '_') || 'root'}.png`)
    await page.screenshot({ path: file, fullPage: true })
    console.log('captured', route, '->', file)
  } catch (e) {
    console.warn('FAILED', route, e.message)
  }
}
await browser.close()
