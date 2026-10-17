// How the site behaves at a phone width, and the motion that arrives with it. Needs a seeded database.
import { BASE, check, freshPage, open, signInAsDemo, test } from './lib.mjs'

/** The stagger is the one thing here that really takes time; wait for it to finish rather than guess. */
async function settledTiles(page) {
  await page
    .waitForFunction(
      () =>
        [...document.querySelectorAll('[data-stagger]')]
          .filter((n) => {
            const box = n.getBoundingClientRect()
            return box.top >= 0 && box.bottom <= window.innerHeight
          })
          .every((n) => Number(getComputedStyle(n).opacity) === 1),
      null,
      { timeout: 20_000 },
    )
    .catch(() => {})
}

test('Nothing scrolls sideways on a phone', async ({ browser }) => {
  // 320px is the narrowest phone still in use; a document wider than its viewport slides under the thumb.
  const context = await browser.newContext({ viewport: { width: 320, height: 900 } })
  const narrow = await context.newPage()
  narrow.setDefaultTimeout(20_000)
  const fits = async (label, path) => {
    await open(narrow, path)
    const width = await narrow.evaluate(() => document.documentElement.scrollWidth)
    check(`${label} fits a 320px screen`, width <= 321, `${width}px wide`)
  }

  for (const [label, path] of [
    ['the landing page', '/'],
    ['the shop', '/shop'],
    ['a filtered shop', '/shop?material=oak&price=over-200'],
    ['a product', '/products/spouted-pendant'],
    ['the help page', '/help'],
    ['the cart', '/cart'],
  ]) {
    await fits(label, path)
  }

  await signInAsDemo(narrow, 'shopper')
  await fits('your orders', '/account/orders')
  await fits('settings', '/account/settings')
  await context.close()

  const adminContext = await browser.newContext({ viewport: { width: 320, height: 900 } })
  const tiny = await adminContext.newPage()
  tiny.setDefaultTimeout(20_000)
  await signInAsDemo(tiny, 'admin')
  for (const [label, path] of [
    ['the dashboard', '/admin'],
    ['the orders list', '/admin/orders'],
    ['the products list', '/admin/products'],
  ]) {
    await open(tiny, path)
    const width = await tiny.evaluate(() => document.documentElement.scrollWidth)
    check(`${label} fits a 320px screen`, width <= 321, `${width}px wide`)
  }
  await adminContext.close()
})

test('Products arrive one after another', async ({ browser }) => {
  const { context, page: shop } = await freshPage(browser)
  // Recorded as it happens: one sample cannot tell a tile that has finished from one that never started.
  await shop.addInitScript(() => {
    window.__began = new Map()
    const from = performance.now()
    const tick = () => {
      document.querySelectorAll('[data-stagger]').forEach((node, index) => {
        if (!window.__began.has(index) && Number(getComputedStyle(node).opacity) > 0.02)
          window.__began.set(index, Math.round(performance.now() - from))
      })
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
  await shop.goto(`${BASE}/shop`, { waitUntil: 'domcontentloaded' })
  await shop.waitForFunction(() => (window.__began?.size ?? 0) >= 8, null, { timeout: 20_000 }).catch(() => {})

  const began = await shop.evaluate(() => [...window.__began.entries()].slice(0, 8).map(([, at]) => at))
  // The step is 60ms, so 40ms on average leaves a slower CI runner room and still proves the spacing.
  check(
    'they do not all appear at once',
    began.length >= 4 && began.at(-1) - began[0] >= (began.length - 1) * 40,
    began.join(' '),
  )
  // The fifth tile starts behind the fourth, not alongside the first as a column-counted delay would.
  check(
    'and each one waits for the one before it',
    began.every((at, index) => index === 0 || at >= began[index - 1]),
    began.join(' '),
  )

  await settledTiles(shop)
  // Fully on screen: a tile hanging off the bottom edge is below the threshold that starts it.
  const onScreen = await shop.evaluate(() =>
    [...document.querySelectorAll('[data-stagger]')]
      .filter((n) => {
        const box = n.getBoundingClientRect()
        return box.top >= 0 && box.bottom <= window.innerHeight
      })
      .map((n) => Number(getComputedStyle(n).opacity)),
  )
  check(
    'the ones on screen all finish',
    onScreen.length > 0 && onScreen.every((o) => o === 1),
    `${onScreen.length} tiles`,
  )

  // Scrolled the way a person does: jumping straight to the end never intersects the middle.
  for (let step = 0; step < 24; step++) {
    await shop.evaluate(() => window.scrollBy({ top: window.innerHeight * 0.9, behavior: 'instant' }))
    await shop.waitForTimeout(160)
  }
  await settledTiles(shop)
  const all = await shop.evaluate(() =>
    [...document.querySelectorAll('[data-stagger]')].map((n) => Number(getComputedStyle(n).opacity)),
  )
  check('and scrolling reveals the rest', all.length > 40 && all.every((o) => o === 1), `${all.length} tiles`)
  await context.close()

  // The animation is a flourish: the markup has to be complete without it.
  const html = await (await fetch(`${BASE}/shop`)).text()
  const articles = (html.match(/<article/g) ?? []).length
  check('the tiles are server-rendered, not animated into being', articles > 40, `${articles} in the html`)
  check('and JavaScript off shows them anyway', html.includes('opacity:1!important'))

  const still = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
  const quiet = await still.newPage()
  await open(quiet, '/shop')
  check('reduced motion skips the animation entirely', (await quiet.locator('[data-stagger]').count()) === 0)
  check(
    'and shows the products at once',
    (await quiet.evaluate(() => Number(getComputedStyle(document.querySelector('article')).opacity))) === 1,
  )
  await still.close()

  // A category is a new set of products, not the old ones relabeled, so the reveal plays again.
  const { context: swapped, page: swap } = await freshPage(browser)
  await swap.goto(`${BASE}/shop`, { waitUntil: 'domcontentloaded' })
  await settledTiles(swap)
  const topRow = await swap.evaluate(() =>
    [...document.querySelectorAll('[data-stagger]')].slice(0, 4).map((n) => Number(getComputedStyle(n).opacity)),
  )
  check('the first row is settled to begin with', topRow.length > 0 && topRow.every((o) => o === 1), topRow.join(' '))

  await swap.getByRole('main').getByRole('link', { name: 'Vases' }).click()
  const replayed = await swap
    .waitForFunction(
      () =>
        [...document.querySelectorAll('[data-stagger]')]
          .slice(0, 4)
          .some((n) => Number(getComputedStyle(n).opacity) < 1),
      null,
      { timeout: 6000 },
    )
    .then(() => true)
    .catch(() => false)
  check('and changing it plays the reveal again', replayed)
  await swapped.close()
})

test('A phone at its narrowest', async ({ browser }) => {
  // 320px, with a cart that has something in it: an empty cart hides every layout problem.
  const context = await browser.newContext({ viewport: { width: 320, height: 720 } })
  const tiny = await context.newPage()
  tiny.setDefaultTimeout(20_000)
  await signInAsDemo(tiny, 'shopper')

  for (const slug of ['ash-dining-table', 'harvest-vase']) {
    await open(tiny, `/products/${slug}`)
    await tiny.getByRole('button', { name: 'Add to cart' }).click()
    await tiny.locator('[data-slot="sheet-content"]').waitFor()
    await tiny.keyboard.press('Escape')
  }

  const fits = async (label, path) => {
    await open(tiny, path)
    const width = await tiny.evaluate(() => document.documentElement.scrollWidth)
    check(`${label} fits`, width <= 321, `${width}px`)
    // Anything inside a sideways scroller is meant to be off screen, so it does not count.
    const past = await tiny.evaluate(
      () =>
        [...document.querySelectorAll('a,button,input,select')].filter((node) => {
          const box = node.getBoundingClientRect()
          if (!(box.width > 0 && box.right > 321)) return false
          for (let parent = node.parentElement; parent; parent = parent.parentElement) {
            const overflow = getComputedStyle(parent).overflowX
            if (overflow === 'auto' || overflow === 'scroll') return false
          }
          return true
        }).length,
    )
    check(`and nothing on ${label} is cut off`, past === 0, `${past} controls past the edge`)
  }

  await fits('a full cart', '/cart')
  await fits('checkout', '/checkout')
  await fits('a product', '/products/spouted-pendant')

  // Three controls that have to stack rather than leave the heart stranded beside a wrapped form.
  const heart = await tiny.locator('[data-favorite="product"]').boundingBox()
  const buy = await tiny.getByRole('button', { name: 'Add to cart' }).boundingBox()
  check(
    'the heart keeps the line the count is on',
    heart.y + heart.height <= buy.y + 1,
    `${Math.round(heart.y)} then ${Math.round(buy.y)}`,
  )
  check('and Add to cart has the next line to itself', buy.width > 240, `${Math.round(buy.width)}px wide`)

  // One column, because two at this width is 140px of photograph.
  await open(tiny, '/shop')
  // The grid's own column count: a tile waiting to be scrolled to is scaled down, so measured edges lie.
  const columns = await tiny.evaluate(() => {
    let node = document.querySelector('article')
    while (node && getComputedStyle(node).display !== 'grid') node = node.parentElement
    return node ? getComputedStyle(node).gridTemplateColumns.split(' ').length : 0
  })
  check('the shop drops to one column', columns === 1, `${columns} columns`)

  // At this width the rail would stack three lists above the products and fill most of the screen.
  check('the filter rail is out of the way', await tiny.locator('[data-inline-filters="rail"]').isHidden())
  await tiny.getByRole('button', { name: /^Filters/ }).click()
  const sheet = tiny.locator('[data-slot="sheet-content"]')
  await sheet.waitFor()
  check('and one button brings them all up', await sheet.isVisible())
  const inside = await sheet.innerText()
  check('with the categories folded in beside them', /Category/.test(inside) && /Price/.test(inside))
  check('and a way back to the grid', /Show \d+ piece/.test(inside))
  await context.close()

  const wide = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const roomy = await wide.newPage()
  await open(roomy, '/shop')
  check('where there is room the rail is simply there', await roomy.locator('[data-inline-filters="rail"]').isVisible())
  check('and nothing is hidden behind a button', await roomy.getByRole('button', { name: /^Filters/ }).isHidden())
  await wide.close()
})

test('The menu knows when its button has gone', async ({ browser }) => {
  // An iPad turning to landscape crosses lg, and used to be left with the sheet open over the desktop layout.
  const context = await browser.newContext({ viewport: { width: 800, height: 900 } })
  const tablet = await context.newPage()
  await tablet.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await tablet.getByRole('button', { name: 'Open menu' }).click()
  const sheet = tablet.locator('[data-slot="sheet-content"]')
  await sheet.waitFor()
  check('the menu opens on a tablet', await sheet.isVisible())

  await tablet.setViewportSize({ width: 1200, height: 900 })
  await sheet.waitFor({ state: 'hidden' }).catch(() => {})
  check('and closes itself when the width leaves it no button', await sheet.isHidden())

  await tablet.setViewportSize({ width: 800, height: 900 })
  await tablet.waitForTimeout(600)
  check('without reopening when the width comes back', await sheet.isHidden())
  await context.close()
})
