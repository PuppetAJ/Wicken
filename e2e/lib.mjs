import { expect, test as base } from '@playwright/test'

export const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000'

export const demo = {
  shopper: { email: 'shopper@wicken.store', password: 'demo-password', name: 'Demo Shopper' },
  admin: { email: 'admin@wicken.store', password: 'demo-password', name: 'Demo Admin' },
}

export const test = base.extend({
  page: async ({ page }, use) => {
    page.setDefaultTimeout(20_000)
    page.setDefaultNavigationTimeout(30_000)
    const pageErrors = []
    page.on('pageerror', (error) => pageErrors.push(error.message))
    await use(page)
    expect(pageErrors, 'no uncaught errors on the page').toEqual([])
  },
})

export { expect }

export function check(name, ok, detail = '') {
  expect.soft(ok, detail ? `${name}   (${String(detail).slice(0, 300)})` : name).toBeTruthy()
}

export async function freshPage(browser, options = {}) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, ...options })
  const page = await context.newPage()
  page.setDefaultTimeout(20_000)
  return { context, page }
}

export async function laidOut(page) {
  await page
    .waitForFunction(() => document.querySelectorAll('[data-slot="skeleton"]').length === 0, null, { timeout: 20_000 })
    .catch(() => {})
  await page.evaluate(() => document.fonts.ready)
  await page.waitForFunction(
    () =>
      new Promise((resolve) => {
        const width = () => document.documentElement.scrollWidth
        const first = width()
        requestAnimationFrame(() =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve(width() === first))),
        )
      }),
    null,
    { timeout: 15_000 },
  )
}

export async function open(page, path) {
  const neverIdles = path.startsWith('/admin')
  await page.goto(`${BASE}${path}`, { waitUntil: neverIdles ? 'domcontentloaded' : 'networkidle' })
  if (neverIdles) await page.locator('h1').first().waitFor()
  await laidOut(page)
}

export async function submitted(page, run) {
  const answered = page.waitForResponse((response) => response.request().method() === 'POST', { timeout: 20_000 })
  await run()
  await answered
}

export async function waitForText(page, pattern, timeout = 15_000) {
  await page.getByText(pattern).first().waitFor({ timeout })
}

export function newShopper() {
  const stamp = Date.now()
  return { name: 'E2E Shopper', email: `e2e${stamp}@wicken.test`, password: 'a-long-enough-password' }
}

export async function signInWithForm(page, { email, password }, next) {
  await page.goto(`${BASE}/login${next ? `?next=${encodeURIComponent(next)}` : ''}`, { waitUntil: 'networkidle' })
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
  await page.getByRole('button', { name: 'Log in' }).click()
}

export async function signInAsDemo(page, role = 'shopper') {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: role === 'admin' ? 'Demo admin' : 'Demo shopper' }).click()
  await page.waitForURL(role === 'admin' ? `${BASE}/admin` : `${BASE}/`)
}

export async function openAccountMenu(page) {
  const menu = page.locator('[role="menu"]')
  await retryUntilHydrated(async () => {
    await page.locator('button[aria-label="Account menu"]').click()
    await menu.waitFor({ timeout: 2_000 })
  })
  return menu.innerText()
}

async function retryUntilHydrated(run, attempts = 10) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await run()
    } catch (error) {
      if (attempt >= attempts) throw error
    }
  }
}

export async function visibleText(page) {
  return page.locator('body').innerText()
}
