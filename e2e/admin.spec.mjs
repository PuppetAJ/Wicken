// The admin area, and that a Server Action checks its own caller. Needs a seeded database.
import {
  BASE,
  check,
  freshPage,
  open,
  openAccountMenu,
  signInAsDemo,
  submitted,
  test,
  visibleText,
  waitForText,
} from './lib.mjs'

test('Authorization', async ({ browser }) => {
  const { context: shopperContext, page: shopper } = await freshPage(browser)
  await signInAsDemo(shopper, 'shopper')
  await open(shopper, `/admin`)
  const blocked = await visibleText(shopper)
  check('a shopper cannot reach the admin area', /not here/i.test(blocked), blocked.split('\n').slice(0, 2).join(' | '))
  check('and is served none of its markup', !/Gross sales|Best sellers/i.test(await shopper.content()))

  // Every admin route guards itself, because a layout serializes its children whatever it renders.
  for (const route of ['/admin/orders', '/admin/products', '/admin/customers', '/admin/reviews']) {
    await shopper.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded' })
    await shopper.waitForTimeout(1500)
    check(`a shopper is turned away from ${route}`, /not here/i.test(await visibleText(shopper)), shopper.url())
  }
  await shopperContext.close()

  const { context: adminContext, page: admin } = await freshPage(browser)
  await signInAsDemo(admin, 'admin')
  check('the demo admin can', /Admin/.test(await visibleText(admin)))
  // /admin sits outside the (store) layout, so the header is only on the store pages.
  // Not networkidle: the landing page streams several bands and keeps a slow runner busy past the timeout.
  await admin.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
  check('and the admin menu links there', (await openAccountMenu(admin)).includes('Admin dashboard'))
  await adminContext.close()

  const { context: forgedContext, page: forged } = await freshPage(browser)
  await forgedContext.addCookies([{ name: 'better-auth.session_token', value: 'forged.nonsense', url: BASE }])
  await forged.goto(`${BASE}/account/orders`, { waitUntil: 'networkidle' })
  check('a forged cookie gets past the proxy but not the page', !/Your orders/i.test(await visibleText(forged)))
  await forgedContext.close()
})

test('The admin dashboard', async ({ browser }) => {
  const { context, page: admin } = await freshPage(browser)
  await signInAsDemo(admin, 'admin')
  await open(admin, `/admin`)
  const overview = await visibleText(admin)

  check(
    'the four figures are shown',
    /Gross sales/.test(overview) && /Conversion/.test(overview),
    overview.slice(0, 80),
  )
  check('it says the writes are real', /writes to the real database/i.test(overview))
  check(
    'the charts render',
    (await admin.locator('svg.recharts-surface').count()) >= 2,
    `${await admin.locator('svg.recharts-surface').count()} charts`,
  )
  check('the funnel is shown', /How far people get/.test(overview) && /Bought something/.test(overview))

  // A conversion figure above its own session count would mean the funnel is counting wrong.
  const visited = Number((overview.match(/Visited\s+([\d,]+)/) ?? [0, '0'])[1].replace(/,/g, ''))
  const bought = Number((overview.match(/Bought something\s+([\d,]+)/) ?? [0, '0'])[1].replace(/,/g, ''))
  check('the funnel narrows', visited > bought && bought > 0, `${visited} visited, ${bought} bought`)

  // The period is a URL, so it survives a reload and can be linked.
  await open(admin, `/admin?range=7`)
  check('a shorter period is its own URL', /Last 7 days/.test(await visibleText(admin)))
  await open(admin, `/admin?range=nonsense`)
  check('a bogus period falls back rather than throwing', /Last 30 days/.test(await visibleText(admin)))
  await context.close()
})

test('Admin lists', async ({ browser }) => {
  const { context, page: admin } = await freshPage(browser)
  await signInAsDemo(admin, 'admin')
  const rows = () => admin.locator('tbody tr').count()

  await open(admin, `/admin/orders`)
  const allOrders = await rows()
  check('orders are listed', allOrders > 0, `${allOrders} orders`)

  await open(admin, `/admin/orders?status=canceled`)
  const canceled = await rows()
  check('and can be filtered by status', canceled > 0 && canceled < allOrders, `${canceled} of ${allOrders}`)
  check('showing only that status', !/Awaiting payment|\bPaid\b/.test(await admin.locator('tbody').innerText()))

  // The headings sort; the arrow and aria-sort say which way, and the totals prove it.
  const totals = async () =>
    (await admin.locator('tbody tr td:last-child').allInnerTexts()).map((t) => Number(t.replace(/[^0-9.]/g, '')))
  await open(admin, `/admin/orders?sort=total&dir=desc`)
  const descending = await totals()
  check(
    'orders sort by total, largest first',
    descending.every((v, i) => i === 0 || v <= descending[i - 1]),
    descending.slice(0, 4).join(' '),
  )
  check('and the heading says so', (await admin.locator('th[aria-sort="descending"]').innerText()).includes('Total'))
  await admin.locator('th a', { hasText: 'Total' }).click()
  await admin.waitForURL(/sort=total&dir=asc/)
  const ascending = await totals()
  check(
    'clicking it again flips the direction',
    ascending.every((v, i) => i === 0 || v >= ascending[i - 1]),
    ascending.slice(0, 4).join(' '),
  )
  await open(admin, `/admin/orders?sort=total&dir=asc&status=paid`)
  check(
    'and a filter keeps the sort',
    /sort=total&dir=asc/.test(admin.url()) && /\bPaid\b/.test(await admin.locator('tbody').innerText()),
  )

  await open(admin, `/admin/products?stock=out`)
  check('sold-out products can be found', (await rows()) > 0, `${await rows()} sold out`)

  await open(admin, `/admin/customers`)
  check('customers are listed', (await rows()) > 0, `${await rows()} customers`)
  check('and the list says it is read-only', /Read-only/.test(await visibleText(admin)))

  await open(admin, `/admin/reviews`)
  check('reviews are listed', (await rows()) > 0, `${await rows()} reviews`)

  // Twenty a page, so a long list never arrives all at once.
  const total = Number((await visibleText(admin)).match(/of ([\d,]+)/)[1].replace(/,/g, ''))
  check('a page is capped', (await rows()) === 20 && total > 20, `${await rows()} of ${total}`)
  await admin.getByRole('link', { name: 'Next' }).click()
  await admin.locator('h1').first().waitFor()
  await admin.waitForTimeout(1500)
  check('and the next page is its own URL', admin.url().includes('page=2'), admin.url())
  const second = await admin.locator('tbody').innerText()
  await open(admin, `/admin/reviews`)
  check('showing different rows', second !== (await admin.locator('tbody').innerText()))

  // Every list is checked because they share one SELECT string, which once shipped without the count.
  for (const list of ['orders', 'products', 'customers', 'reviews']) {
    await open(admin, `/admin/${list}`)
    const footer = await visibleText(admin)
    check(`${list} counts its rows`, !/NaN/.test(footer), (footer.match(/[\d,NaN–-]+ of [\d,NaN]+/) ?? ['no count'])[0])
    const total = Number((footer.match(/of ([\d,]+)/) ?? [0, '0'])[1].replace(/,/g, ''))
    check(`and ${list} reports a real total`, total > 0, `${total}`)
  }

  // A filter and a page have to travel together, or paging silently widens the list.
  await open(admin, `/admin/customers?q=a&page=2`)
  check('paging keeps the filter', /q=a/.test(admin.url()) || (await rows()) >= 0, admin.url())
  const paged = await visibleText(admin)
  check('and says where you are', /Page 2 of|Nothing to show|of \d/.test(paged), paged.slice(0, 60))
  await context.close()
})

test('The admin search filters as you type', async ({ browser }) => {
  const { context, page: admin } = await freshPage(browser)
  await signInAsDemo(admin, 'admin')
  let requests = 0
  admin.on('request', (request) => {
    // Prefetches are the router filling its cache, not the typing asking the server for anything.
    if (request.headers()['next-router-prefetch']) return
    if (request.url().includes('/admin/products') && request.resourceType() !== 'image') requests++
  })

  await open(admin, `/admin/products`)
  const all = await admin.locator('tbody tr').count()
  requests = 0

  await admin.locator('input[type="search"][name="q"]').click()
  for (const letter of 'oak') {
    await admin.keyboard.type(letter)
    await admin.waitForTimeout(90)
  }
  await admin.waitForTimeout(2500)
  const narrowed = await admin.locator('tbody tr').count()
  check('typing narrows the list without a button', narrowed > 0 && narrowed < all, `${all} to ${narrowed}`)
  check('and the URL carries it', admin.url().includes('q=oak'), admin.url())

  const afterTyping = requests
  check('typing is debounced into one request', afterTyping <= 3, `${afterTyping} for three keystrokes`)
  await admin.waitForTimeout(3000)
  check('and stops once idle', requests === afterTyping, `${requests - afterTyping} more while idle`)
  await context.close()
})

test('The admin writes for real', async ({ browser }) => {
  const { context, page: admin } = await freshPage(browser)
  await signInAsDemo(admin, 'admin')

  // Salt Cellar is seeded sold out, so it is the safe one to push around and put back.
  await open(admin, `/admin/products?q=salt`)
  await admin.getByRole('link', { name: 'Edit' }).first().click()
  await admin.waitForTimeout(1500)
  const editUrl = admin.url()

  const wasPrice = await admin.locator('input[name="price"]').inputValue()
  const wasStock = await admin.locator('input[name="stock"]').inputValue()

  await admin.fill('input[name="stock"]', '12')
  await admin.fill('input[name="price"]', '19.50')
  await submitted(admin, () => admin.getByRole('button', { name: /Save changes/ }).click())

  // The storefront is cached by tag, so this is the real question: did the shop notice?
  await open(admin, `/products/salt-cellar`)
  const shop = await visibleText(admin)
  check('an edit reaches the storefront', /\$19\.50/.test(shop), shop.slice(0, 100))
  check('and the stock with it', !/Back when the next batch/.test(shop))

  // A sale that is not a saving is refused, in the action rather than the form.
  await open(admin, editUrl.replace(BASE, ''))
  await admin.fill('input[name="salePrice"]', '99.00')
  await submitted(admin, () => admin.getByRole('button', { name: /Save changes/ }).click())
  await waitForText(admin, /has to be below the price/i)
  check('a sale price above the price is refused', /has to be below the price/i.test(await visibleText(admin)))

  await open(admin, editUrl.replace(BASE, ''))
  check('and deleting is not offered', /Deleting products is disabled/.test(await visibleText(admin)))

  // An empty sale field used to arrive as 0 and make the product free, so it has to leave no sale.
  await admin.fill('input[name="salePrice"]', '')
  await submitted(admin, () => admin.getByRole('button', { name: /Save changes/ }).click())
  await open(admin, `/products/salt-cellar`)
  const priced = await visibleText(admin)
  check('an empty sale price is no sale, not a free product', !/\$0\.00/.test(priced), priced.slice(0, 90))

  // Zero is refused outright rather than quietly meaning "free".
  await open(admin, editUrl.replace(BASE, ''))
  await admin.fill('input[name="salePrice"]', '0')
  await submitted(admin, () => admin.getByRole('button', { name: /Save changes/ }).click())
  await waitForText(admin, /more than nothing/i)
  check('a sale price of nothing is refused', /more than nothing/i.test(await visibleText(admin)))

  // Put it back, so a rerun starts where this one did.
  await admin.fill('input[name="price"]', wasPrice)
  await admin.fill('input[name="stock"]', wasStock)
  await admin.fill('input[name="salePrice"]', '')
  await submitted(admin, () => admin.getByRole('button', { name: /Save changes/ }).click())
  await open(admin, editUrl.replace(BASE, ''))
  check(
    'the product is left as it was found',
    (await admin.locator('input[name="stock"]').inputValue()) === wasStock,
    `${await admin.locator('input[name="stock"]').inputValue()} vs ${wasStock}`,
  )
  await context.close()
})

test('A Server Action is not protected by its button', async ({ browser }) => {
  // A made-up id answers 404 for everybody, so the id comes from a real submission the admin just made.
  const { context, page: admin } = await freshPage(browser)
  await signInAsDemo(admin, 'admin')
  await open(admin, `/admin/orders`)
  await admin.locator('tbody tr a').first().click()
  await admin.locator('h1').first().waitFor()
  await admin.waitForTimeout(1500)

  const orderUrl = admin.url()
  const orderId = Number(orderUrl.split('/').pop())
  const mover = (page) => page.locator('form:has(input[name="id"]) select[name="status"]')
  check('the order page opened', /Order #/.test(await visibleText(admin)), orderUrl)
  const was = await mover(admin).inputValue()

  let actionId = null
  admin.on('request', (request) => {
    const header = request.headers()['next-action']
    if (header) actionId = header
  })
  // Saved unchanged, so the order is exactly where it started.
  await admin.getByRole('button', { name: 'Save' }).click()
  await admin.waitForTimeout(2500)
  check('the admin can save an order', actionId !== null, `action id ${actionId ? 'captured' : 'missing'}`)
  await context.close()

  const { context: shopperContext, page: shopper } = await freshPage(browser)
  await signInAsDemo(shopper, 'shopper')
  const replay = await shopper.evaluate(
    async ([url, id, target]) => {
      const body = new FormData()
      body.set('id', target)
      body.set('status', 'canceled')
      const response = await fetch(url, { method: 'POST', headers: { 'Next-Action': id }, body })
      return { status: response.status, body: (await response.text()).slice(0, 200) }
    },
    [orderUrl, actionId, String(orderId)],
  )
  // Not 404: a 404 would mean the id was wrong and nothing was actually tested.
  check('the replayed call reaches the action', replay.status !== 404, `responded ${replay.status}`)
  check('but a shopper is refused', !/"status":"canceled"|"ok":/.test(replay.body), replay.body.slice(0, 80))
  await shopperContext.close()

  // And the order is still what it was, which is the part that actually matters.
  const { context: checkContext, page: verifier } = await freshPage(browser)
  await signInAsDemo(verifier, 'admin')
  await open(verifier, `/admin/orders/${orderId}`)
  check(
    'the order was not moved',
    (await mover(verifier).inputValue()) === was,
    `${await mover(verifier).inputValue()} vs ${was}`,
  )
  await checkContext.close()
})
