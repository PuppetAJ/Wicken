// The cart, the guest cart being claimed, and checkout. Needs a seeded database.
import { BASE, check, freshPage, open, signInAsDemo, test, visibleText } from './lib.mjs'

test('Cart', async ({ browser }) => {
  const { context, page: shop } = await freshPage(browser)
  const badge = () => shop.locator('button[aria-label="Open cart"] span').first()
  // The badge is a server component that re-renders after the action, so it lands after the sheet opens.
  const badgeReaches = (count) =>
    shop
      .waitForFunction(
        (want) => document.querySelector('button[aria-label="Open cart"] span')?.textContent?.trim() === want,
        String(count),
        { timeout: 20_000 },
      )
      .catch(() => {})

  await shop.goto(`${BASE}/products/ash-dining-table`, { waitUntil: 'networkidle' })
  check('a fresh visitor has no cart badge', (await badge().count()) === 0)

  await shop.getByRole('button', { name: 'Add to cart' }).click()
  await shop.locator('[data-slot="sheet-content"]').waitFor()
  check('adding opens the cart sheet', await shop.locator('[role="dialog"]').isVisible())
  await badgeReaches(1)
  check('and the badge appears', (await badge().innerText()) === '1')

  const sheet = shop.locator('[role="dialog"]')
  await sheet
    .getByRole('button', { name: /^Add one / })
    .first()
    .click()
  await badgeReaches(2)
  check('the stepper changes the quantity', (await badge().innerText()) === '2')
  check('and the subtotal follows it', /2,560/.test(await sheet.innerText()), await sheet.innerText())

  await shop.keyboard.press('Escape')
  await shop.goto(`${BASE}/products/harvest-vase`, { waitUntil: 'networkidle' })
  await shop.getByRole('button', { name: 'Add to cart' }).click()
  await shop.locator('[data-slot="sheet-content"]').waitFor()
  await badgeReaches(3)
  check('a second product is a second line', (await badge().innerText()) === '3')

  await shop.keyboard.press('Escape')
  await shop.goto(`${BASE}/cart`, { waitUntil: 'networkidle' })
  await shop.locator('text=/Subtotal|Nothing in here yet/').first().waitFor({ timeout: 15000 })
  check('the cart survives a reload', /Ash Dining Table/.test(await visibleText(shop)))

  // Two of them, so stepping down once is an ordinary decrement and the second empties it.
  const lastOne = shop.locator('button[aria-label="Remove Ash Dining Table from the cart"]')
  check('above one the minus is still a minus', (await lastOne.count()) === 0)
  await shop.locator('button[aria-label="Remove one Ash Dining Table"]').click()
  await shop.waitForTimeout(1800)
  check('at one left it becomes a remove', (await lastOne.count()) === 1)
  check('and the badge follows it down', (await badge().innerText()) === '2')

  await lastOne.click()
  await shop.waitForTimeout(1800)
  check('stepping past one drops the line', !/Ash Dining Table/.test(await visibleText(shop)))
  check('and the badge counts down', (await badge().innerText()) === '1')

  await shop.getByRole('button', { name: 'Remove', exact: true }).first().click()
  await shop.waitForTimeout(1800)
  check('emptying it shows the empty state', /Nothing in here yet/.test(await visibleText(shop)))
  check('and the badge goes', (await badge().count()) === 0)
  await context.close()
})

test('The sheet does not reopen by itself', async ({ browser }) => {
  const { context, page: shop } = await freshPage(browser)
  const sheet = () =>
    shop
      .locator('[role="dialog"]')
      .isVisible()
      .catch(() => false)

  // Link clicks, not goto: a hard load clears the router cache and hides this entirely.
  await shop.goto(`${BASE}/shop`, { waitUntil: 'networkidle' })
  await shop.locator('a[href="/products/oak-wall-shelf"]').first().click()
  await shop.waitForTimeout(1500)
  await shop.getByRole('button', { name: 'Add to cart' }).click()
  await shop.locator('[data-slot="sheet-content"]').waitFor()
  check('adding opens the sheet', await sheet())

  await shop.keyboard.press('Escape')
  await shop.waitForTimeout(700)
  check('escape closes it', !(await sheet()))

  await shop.locator('a[href="/shop"]').first().click()
  await shop.waitForTimeout(1500)
  await shop.locator('a[href="/products/oak-wall-shelf"]').first().click()
  await shop.waitForTimeout(2000)
  // The action result rides in the client router cache, so coming back replays it.
  check('coming back to the product does not reopen it', !(await sheet()))

  await shop.getByRole('button', { name: 'Add to cart' }).click()
  await shop.locator('[data-slot="sheet-content"]').waitFor()
  check('and a genuine add still opens it', await sheet())
  await context.close()
})

test('Carrying a guest cart into an account', async ({ browser }) => {
  const { context, page: guest } = await freshPage(browser)
  const cartText = async () => {
    await guest.goto(`${BASE}/cart`, { waitUntil: 'networkidle' })
    // The cart streams behind Suspense, so wait for it rather than for the network.
    await guest.locator('text=/Subtotal|Nothing in here yet/').first().waitFor({ timeout: 15000 })
    return visibleText(guest)
  }
  const emptyTheCart = async () => {
    await guest.goto(`${BASE}/cart`, { waitUntil: 'networkidle' })
    await guest.locator('text=/Subtotal|Nothing in here yet/').first().waitFor({ timeout: 15000 })
    for (let line = 0; line < 20; line++) {
      const remove = guest.getByRole('button', { name: 'Remove', exact: true }).first()
      if ((await remove.count()) === 0) break
      await remove.click()
      await guest.waitForTimeout(900)
    }
  }
  const add = async (slug) => {
    await guest.goto(`${BASE}/products/${slug}`, { waitUntil: 'networkidle' })
    await guest.getByRole('button', { name: 'Add to cart' }).click()
    await guest.locator('[data-slot="sheet-content"]').waitFor()
    await guest.keyboard.press('Escape')
  }
  const signOut = async () => {
    await guest.goto(`${BASE}/`, { waitUntil: 'networkidle' })
    await guest.locator('button[aria-label="Account menu"]').click()
    await guest.getByRole('button', { name: 'Log out' }).click()
    await guest.waitForTimeout(2000)
  }

  // The demo account persists between runs, so this starts from a known cart and empties it at the end.
  await signInAsDemo(guest, 'shopper')
  await emptyTheCart()
  await signOut()

  await add('ash-dining-table')
  await signInAsDemo(guest, 'shopper')
  check('a guest cart follows them into the account', /Ash Dining Table/.test(await cartText()))

  await signOut()
  check('signing out leaves the account cart behind', /Nothing in here yet/.test(await cartText()))

  await add('ash-dining-table')
  await signInAsDemo(guest, 'shopper')
  const merged = await cartText()
  // The account already held one, so the quantities are summed rather than replaced.
  check('the two carts are added together, not replaced', /2,560/.test(merged), merged.slice(0, 200))

  await emptyTheCart()
  check('the demo account is left as it was found', /Nothing in here yet/.test(await cartText()))
  await context.close()
})

test('A claimed cart cannot be reached by its old cookie', async ({ browser }) => {
  const { context: victimContext, page: victim } = await freshPage(browser)
  await victim.goto(`${BASE}/products/ash-dining-table`, { waitUntil: 'networkidle' })
  await victim.getByRole('button', { name: 'Add to cart' }).click()
  await victim.locator('[data-slot="sheet-content"]').waitFor()

  const cookie = (await victimContext.cookies()).find((c) => c.name === 'wicken_cart')
  check('the guest cart cookie is httpOnly', Boolean(cookie?.httpOnly))

  await signInAsDemo(victim, 'shopper')

  // Whoever still holds that id must get nothing, because the cart now has an owner.
  const { context: holderContext, page: holder } = await freshPage(browser)
  await holderContext.addCookies([{ name: 'wicken_cart', value: cookie.value, url: BASE }])
  await holder.goto(`${BASE}/cart`, { waitUntil: 'networkidle' })
  const seen = await visibleText(holder)
  check('the old id reads nothing', /Nothing in here yet/.test(seen), seen.slice(0, 140))

  await holder.goto(`${BASE}/products/harvest-vase`, { waitUntil: 'networkidle' })
  await holder.getByRole('button', { name: 'Add to cart' }).click()
  await holder.locator('[data-slot="sheet-content"]').waitFor()
  await victim.goto(`${BASE}/cart`, { waitUntil: 'networkidle' })
  const victimCart = await visibleText(victim)
  check(
    'and writing with it does not reach the account cart',
    !/Harvest Vase/.test(victimCart),
    victimCart.slice(0, 160),
  )
  await holderContext.close()

  // Leave the demo account as it was found.
  for (let line = 0; line < 20; line++) {
    const remove = victim.getByRole('button', { name: 'Remove', exact: true }).first()
    if ((await remove.count()) === 0) break
    await remove.click()
    await victim.waitForTimeout(900)
  }
  await victimContext.close()
})

test('Checkout', async ({ browser }) => {
  const { context, page: buyer } = await freshPage(browser)

  await buyer.goto(`${BASE}/checkout`, { waitUntil: 'networkidle' })
  check('checkout needs a login', buyer.url().includes('/login'), buyer.url())

  await signInAsDemo(buyer, 'shopper')

  // A dining table and a mug in one order: the order ships together, so the table sets the date.
  for (const slug of ['ash-dining-table', 'ridge-breakfast-mug']) {
    await open(buyer, `/products/${slug}`)
    await buyer.getByRole('button', { name: 'Add to cart' }).click()
    await buyer.locator('[data-slot="sheet-content"]').waitFor()
    await buyer.keyboard.press('Escape')
  }
  await open(buyer, '/checkout')
  const promised = await visibleText(buyer)
  check(
    'the slowest thing in the order sets the date',
    /four to six weeks/.test(promised),
    promised.match(/It arrives\n[^\n]*/)?.[0],
  )
  check('and the arrival window agrees', !/business days/.test(promised.match(/Arrives[^\n]*/)?.[0] ?? ''))

  // The demo account persists between runs, so start from a known cart.
  const emptyTheCart = async () => {
    await buyer.goto(`${BASE}/cart`, { waitUntil: 'networkidle' })
    await buyer.locator('text=/Subtotal|Nothing in here yet/').first().waitFor({ timeout: 15000 })
    for (let line = 0; line < 20; line++) {
      const remove = buyer.getByRole('button', { name: 'Remove', exact: true }).first()
      if ((await remove.count()) === 0) break
      await remove.click()
      await buyer.waitForTimeout(900)
    }
  }
  await emptyTheCart()

  await buyer.goto(`${BASE}/checkout`, { waitUntil: 'networkidle' })
  check('an empty cart has nothing to pay for', /Nothing to pay for/.test(await visibleText(buyer)))

  await buyer.goto(`${BASE}/products/ash-dining-table`, { waitUntil: 'networkidle' })
  await buyer.getByRole('button', { name: 'Add to cart' }).click()
  await buyer.locator('[data-slot="sheet-content"]').waitFor()
  await buyer.keyboard.press('Escape')
  await buyer.goto(`${BASE}/checkout`, { waitUntil: 'networkidle' })
  const summary = await visibleText(buyer)
  check('the cart is summarized before paying', /Ash Dining Table/.test(summary))

  // CI has no Stripe key, so only the order creation is checked there; the handover needs a real key.
  const payable = !/not configured/.test(summary)
  if (payable) {
    check('the test card is offered, so nobody uses a real one', /4242 4242 4242 4242/.test(summary))
    // Stripe's own page is somebody else's to break, so the suite stops at the handover.
    await buyer.getByRole('button', { name: /^Pay / }).click()
    await buyer.waitForURL(/checkout\.stripe\.com/, { timeout: 30000 }).catch(() => {})
    check('paying hands over to Stripe', buyer.url().includes('checkout.stripe.com'), buyer.url())
  } else {
    check('checkout says so plainly when Stripe is not configured', /not configured/.test(summary))
  }

  await buyer.goto(`${BASE}/account/orders`, { waitUntil: 'networkidle' })
  const orders = await visibleText(buyer)
  let orderUrl = null
  if (payable) {
    check('the order is recorded as awaiting payment', /Awaiting payment/.test(orders), orders.slice(0, 120))
    await buyer.locator('a[href^="/account/orders/"]').first().click()
    await buyer.waitForTimeout(1500)
    orderUrl = buyer.url()
    check('and it opens', /Ash Dining Table/.test(await visibleText(buyer)))
    // Nothing marked it paid, so the page must not pretend otherwise.
    check('an unpaid order is not called confirmed', !/confirmed/i.test(await visibleText(buyer)))
    check(
      'an unpaid order offers to finish paying',
      (await buyer.getByRole('button', { name: 'Complete payment' }).count()) === 1,
    )
    // The order is the dead end this exists to fix, so press it rather than only find it.
    await buyer.getByRole('button', { name: 'Complete payment' }).click()
    await buyer.waitForURL(/checkout\.stripe\.com/, { timeout: 30000 }).catch(() => {})
    check('and pressing it reopens Stripe', buyer.url().includes('checkout.stripe.com'), buyer.url())
    await buyer.goto(orderUrl, { waitUntil: 'networkidle' })
    await buyer.waitForTimeout(800)
    check('the order is still awaiting payment', /Awaiting payment/.test(await visibleText(buyer)))

    // The detail page sits in the same column as the list, so their headings share an edge.
    const detailEdge = (await buyer.locator('h1').first().boundingBox()).x
    await open(buyer, `/account/orders`)
    const listEdge = (await buyer.locator('h1').first().boundingBox()).x
    check(
      'one order lines up with the list it came from',
      Math.abs(detailEdge - listEdge) < 2,
      `${detailEdge} vs ${listEdge}`,
    )
    await buyer.goto(orderUrl, { waitUntil: 'networkidle' })
    await buyer.waitForTimeout(800)
  }

  await emptyTheCart()
  check('the demo cart is left as it was found', /Nothing in here yet/.test(await visibleText(buyer)))
  await context.close()

  if (orderUrl) {
    const { context: nosy, page: other } = await freshPage(browser)
    await signInAsDemo(other, 'admin')
    await other.goto(orderUrl, { waitUntil: 'networkidle' })
    check("another account cannot open somebody else's order", !/Ash Dining Table/.test(await visibleText(other)))
    await nosy.close()
  }
})
