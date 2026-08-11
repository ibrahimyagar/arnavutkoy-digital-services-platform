import { chromium } from 'playwright'
import { mkdir } from 'fs/promises'
import path from 'path'

const OUT = path.resolve('docs/screenshots')
const BASE = 'http://127.0.0.1:5173'

async function shot(page, name) {
  const file = path.join(OUT, name)
  await page.waitForTimeout(700)
  await page.screenshot({ path: file, fullPage: false, type: 'png' })
  console.log('saved', name)
}

async function main() {
  await mkdir(OUT, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()

  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await shot(page, 'home-guest.png')
  await shot(page, 'home-hero.png')

  await page.goto(`${BASE}/giris`, { waitUntil: 'networkidle' })
  await shot(page, 'login.png')

  await page.goto(`${BASE}/e-belediye`, { waitUntil: 'networkidle' })
  await shot(page, 'e-belediye.png')

  await page.goto(`${BASE}/muhtarliklar`, { waitUntil: 'networkidle' })
  await shot(page, 'muhtarliklar.png')

  await page.goto(`${BASE}/ulasim-agi`, { waitUntil: 'networkidle' })
  await shot(page, 'ulasim-agi.png')

  await page.goto(`${BASE}/giris`, { waitUntil: 'networkidle' })
  await page.fill('input[type="email"], input[name="email"], #email', 'vatandas@demo.arnavutkoy.local')
  await page.fill('input[type="password"], input[name="password"], #password', 'Demo!Citizen123')
  await Promise.all([
    page.waitForURL(/\/(panel|$)/, { timeout: 15000 }).catch(() => null),
    page.click('button[type="submit"]'),
  ])
  await page.waitForTimeout(1200)
  if (!page.url().includes('/panel')) {
    await page.goto(`${BASE}/panel`, { waitUntil: 'networkidle' })
  }
  await shot(page, 'panel-vatandas.png')

  await page.goto(`${BASE}/borclar`, { waitUntil: 'networkidle' })
  await shot(page, 'borclar.png')

  await page.goto(`${BASE}/talepler`, { waitUntil: 'networkidle' })
  await shot(page, 'hizmet-masasi.png')

  await browser.close()
  console.log('done')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
