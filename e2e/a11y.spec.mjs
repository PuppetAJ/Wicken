// axe-core at WCAG 2.1 A and AA, both themes. Needs the app running.
import { createRequire } from 'node:module'
import { BASE, check, signInAsDemo, test } from './lib.mjs'

const AXE_PATH = createRequire(import.meta.url).resolve('axe-core/axe.min.js')
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

const signedOut = [
  ['landing', '/'],
  ['shop', '/shop'],
  ['shop, filtered', '/shop?category=vases&sort=price-asc'],
  ['shop, faceted', '/shop?material=oak&color=natural'],
  ['shop, nothing found', '/shop?q=zzzznothing'],
  ['product', '/products/ash-dining-table'],
  ['product with reviews', '/products/oak-wall-shelf'],
  ['cart, empty', '/cart'],
  ['login', '/login'],
  ['register', '/register'],
  ['about', '/about'],
  ['faq', '/faq'],
  ['not found', '/definitely-not-a-page'],
]

// Signed-in chrome is a different header, so it gets its own pass.
const signedIn = [
  ['landing, signed in', '/'],
  ['checkout', '/checkout'],
  ['your orders', '/account/orders'],
  ['favorites', '/account/favorites'],
  ['settings', '/account/settings'],
]

const admin = [
  ['admin overview', '/admin'],
  ['admin orders', '/admin/orders'],
  ['admin products', '/admin/products'],
  ['admin customers', '/admin/customers'],
  ['admin reviews', '/admin/reviews'],
  ['admin product edit', '/admin/products/1'],
]

async function audit(page, label, path) {
  if (path.startsWith('/admin')) {
    await page.goto(BASE + path, { waitUntil: 'domcontentloaded' })
    await page.locator('h1').first().waitFor()
    await page.waitForTimeout(2000)
  } else {
    await page.goto(BASE + path, { waitUntil: 'networkidle' })
  }
  // Contrast is measured on the resting state; caught mid-fade every color on a tile reads as failing.
  await page
    .waitForFunction(
      // axe reads a fully transparent tile as invisible, so nothing may be caught part way.
      () =>
        [...document.querySelectorAll('[data-stagger]')].every((n) => {
          const shown = Number(getComputedStyle(n).opacity)
          return shown === 1 || shown === 0
        }),
      null,
      { timeout: 10_000 },
    )
    .catch(() => {})

  await page.addScriptTag({ path: AXE_PATH })
  const violations = await page.evaluate(async (tags) => {
    const results = await window.axe.run(document, { runOnly: { type: 'tag', values: tags } })
    return results.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.map((n) => n.html.slice(0, 140)),
    }))
  }, WCAG)

  const detail = violations.map((v) => `${v.id} [${v.impact}] ${v.help}\n${v.nodes.slice(0, 3).join('\n')}`).join('\n')
  check(`${label} (${path}) has no violations`, violations.length === 0, detail)
}

for (const colorScheme of ['light', 'dark']) {
  test.describe(`${colorScheme} theme`, () => {
    test.use({ colorScheme })

    test('signed out', async ({ page }) => {
      for (const [label, path] of signedOut) await audit(page, label, path)
    })

    test('signed in', async ({ page }) => {
      await signInAsDemo(page, 'shopper')
      for (const [label, path] of signedIn) await audit(page, label, path)
    })

    test('the admin area', async ({ page }) => {
      await signInAsDemo(page, 'admin')
      for (const [label, path] of admin) await audit(page, label, path)
    })
  })
}
