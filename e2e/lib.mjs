/** Shared setup for the browser suites. Mirrors the one in Chunkd. */
import { expect, test as base } from '@playwright/test'

export const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3000'

// Matches scripts/demo-users.ts; the suite runs against a seeded database.
export const demo = {
  shopper: { email: 'shopper@wicken.store', password: 'demo-password', name: 'Demo Shopper' },
  admin: { email: 'admin@wicken.store', password: 'demo-password', name: 'Demo Admin' },
}

/** Playwright Test's `test`, with the page every suite expects: its timeouts, and its uncaught errors failing the test. */
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

/** One check among many: a failure is recorded and the test carries on, so a run shows every failure, not the first. */
export function check(name, ok, detail = '') {
  expect.soft(ok, detail ? `${name}   (${String(detail).slice(0, 300)})` : name).toBeTruthy()
}

/** A fresh context, so a signed-in check cannot leak its cookies into the next one. */
export async function freshPage(browser, options = {}) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, ...options })
  const page = await context.newPage()
  page.setDefaultTimeout(20_000)
  return { context, page }
}

/** Waits for the layout to stop moving, which is what a fixed pause after a goto was standing in for. */
export async function laidOut(page) {
  // A skeleton on screen means a Suspense boundary is still streaming its real content in.
  await page
    .waitForFunction(() => document.querySelectorAll('[data-slot="skeleton"]').length === 0, null, { timeout: 20_000 })
    .catch(() => {})
  await page.evaluate(() => document.fonts.ready)
  // Hydration can still move things, so this waits for the width to agree with itself twice over.
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

/** Opens a page and waits for it to settle, rather than guessing how long that takes. */
export async function open(page, path) {
  // Admin pages prefetch every link they carry, so networkidle never settles on them.
  const admin = path.startsWith('/admin')
  await page.goto(`${BASE}${path}`, { waitUntil: admin ? 'domcontentloaded' : 'networkidle' })
  if (admin) await page.locator('h1').first().waitFor()
  await laidOut(page)
}

/** A Server Action is a POST to the page itself, and waiting for that beats waiting for the toast it raises. */
export async function submitted(page, run) {
  const answered = page.waitForResponse((response) => response.request().method() === 'POST', { timeout: 20_000 })
  await run()
  await answered
}

/** Waits for a message to appear anywhere on the page: a toast, an inline error, a confirmation. */
export async function waitForText(page, pattern, timeout = 15_000) {
  await page.getByText(pattern).first().waitFor({ timeout })
}

/** The stamp keeps a rerun from colliding with the account the last one made. */
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
  // Retried because the button is server-rendered and does nothing until the page has hydrated.
  await retry(async () => {
    await page.locator('button[aria-label="Account menu"]').click()
    await menu.waitFor({ timeout: 2_000 })
  })
  return menu.innerText()
}

/** Runs something until it stops throwing, which is how you wait for hydration without networkidle. */
async function retry(run, attempts = 10) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await run()
    } catch (error) {
      if (attempt >= attempts) throw error
    }
  }
}

/** Visible text with the scripts stripped, for asserting on what a person would actually read. */
export async function visibleText(page) {
  return page.locator('body').innerText()
}
