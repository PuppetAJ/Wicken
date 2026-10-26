// Throttling runs last because it spends the sign-in budget. Needs a seeded database.
import {
  BASE,
  check,
  demo,
  freshPage,
  newShopper,
  open,
  openAccountMenu,
  signInAsDemo,
  signInWithForm,
  submitted,
  test,
  visibleText,
  waitForText,
} from './lib.mjs'

test('Registering', async ({ browser }) => {
  const { context, page: fresh } = await freshPage(browser)
  const shopper = newShopper()
  await fresh.goto(`${BASE}/register`, { waitUntil: 'networkidle' })
  await fresh.fill('input[name="name"]', shopper.name)
  await fresh.fill('input[name="email"]', shopper.email)
  await fresh.fill('input[name="password"]', shopper.password)
  await fresh.getByRole('button', { name: 'Create account' }).click()
  await fresh.waitForURL(`${BASE}/`)
  check('registering signs the new account in', (await openAccountMenu(fresh)).includes(shopper.email))
  await context.close()
})

test('Signing in and out', async ({ browser }) => {
  const { context, page: fresh } = await freshPage(browser)
  await signInAsDemo(fresh, 'shopper')
  const menu = await openAccountMenu(fresh)
  check('the demo shopper signs in', menu.includes(demo.shopper.name))
  check('the shopper menu offers no admin link', !menu.includes('Admin'))

  await fresh.getByRole('button', { name: 'Log out' }).click()
  await fresh.getByRole('banner').getByRole('link', { name: 'Log in' }).waitFor()
  check(
    'signing out restores the signed-out header',
    await fresh.getByRole('link', { name: 'Sign up' }).first().isVisible(),
  )
  await context.close()
})

test('Where login sends you afterwards', async ({ browser }) => {
  const { context, page: fresh } = await freshPage(browser)
  await fresh.goto(`${BASE}/account/orders`, { waitUntil: 'networkidle' })
  check('the proxy redirects a signed-out visitor', fresh.url().includes('next=%2Faccount%2Forders'), fresh.url())

  await fresh.fill('input[name="email"]', demo.shopper.email)
  await fresh.fill('input[name="password"]', demo.shopper.password)
  await fresh.getByRole('button', { name: 'Log in' }).click()
  await fresh.waitForURL(`${BASE}/account/orders`)
  check('and login returns them to where they were aiming', fresh.url().endsWith('/account/orders'))
  await context.close()

  for (const [label, target] of [
    ['an absolute URL', 'https://example.com/evil'],
    ['a protocol-relative URL', '//example.com/evil'],
  ]) {
    const { context: c, page: p } = await freshPage(browser)
    await signInWithForm(p, demo.shopper, target)
    await p.waitForURL((url) => !url.pathname.startsWith('/login')).catch(() => {})
    check(`${label} is refused as a redirect target`, new URL(p.url()).pathname === '/', p.url())
    await c.close()
  }
})

test('Finding your way back', async ({ browser }) => {
  const { context, page: nav } = await freshPage(browser)
  const filtered = `${BASE}/shop?category=furniture&sort=price-asc`

  await nav.goto(filtered, { waitUntil: 'networkidle' })
  const href = await nav.locator('a[href^="/products/"]').first().getAttribute('href')
  check(
    'a product link carries the filters',
    href.includes('category=furniture') && href.includes('sort=price-asc'),
    href,
  )

  await nav.locator('a[href^="/products/"]').first().click()
  await nav.locator('nav[aria-label="Breadcrumb"]').waitFor()
  const crumbs = await nav.locator('nav[aria-label="Breadcrumb"]').innerText()
  check('the product page offers a way back', /Back to results/.test(crumbs), crumbs.replace(/\n/g, ' '))

  await nav.locator('nav[aria-label="Breadcrumb"] a').first().click()
  await nav.waitForURL(/\/shop/)
  check(
    'and it lands on the same results',
    nav.url().includes('category=furniture') && nav.url().includes('sort=price-asc'),
    nav.url(),
  )

  // Landing on a product directly has no filters to go back to.
  await nav.goto(`${BASE}/products/ash-dining-table`, { waitUntil: 'networkidle' })
  check('arriving cold says Shop instead', /Shop/.test(await nav.locator('nav[aria-label="Breadcrumb"]').innerText()))

  await nav.goto(filtered, { waitUntil: 'networkidle' })
  const loginHref = await nav.getByRole('banner').getByRole('link', { name: 'Log in' }).getAttribute('href')
  check('the header login link remembers where you are', loginHref.includes('next='), loginHref)

  await nav.getByRole('banner').getByRole('link', { name: 'Log in' }).click()
  await nav.getByRole('button', { name: 'Demo shopper' }).waitFor()
  await nav.getByRole('button', { name: 'Demo shopper' }).click()
  await nav.waitForURL((url) => !url.pathname.startsWith('/login'))
  check('and signing in returns you there', nav.url().includes('category=furniture'), nav.url())
  await context.close()
})

test('Quick actions on the grid', async ({ browser }) => {
  const { context, page: shop } = await freshPage(browser)
  const badge = () => shop.locator('[data-cart-badge]')

  await shop.goto(`${BASE}/shop?category=furniture`, { waitUntil: 'networkidle' })
  const card = shop.locator('article').first()
  const name = await card.locator('h3').innerText()

  // A touch device never fires hover, so the buttons must be clickable without it.
  const add = card.locator('button[aria-label^="Add"]')
  check('every tile carries a quick add', (await add.count()) === 1)
  check(
    'and a favorite toggle',
    (await card.locator('button[aria-label^="Save"], button[aria-label^="Remove"]').count()) === 1,
  )

  await add.click()
  await waitForText(shop, /added to your cart/i)
  check('quick add puts it in the cart', (await badge().innerText()) === '1', name)

  // Signed out, favouriting should invite a login rather than fail silently.
  await card.locator('button[aria-label^="Save"]').click()
  await waitForText(shop, /Log in to save/i)
  check('favouriting signed out asks for a login', /Log in to save/.test(await visibleText(shop)))
  await context.close()
})

test('Favorites, signed in', async ({ browser }) => {
  const { context, page: shop } = await freshPage(browser)
  await signInAsDemo(shop, 'shopper')
  await shop.goto(`${BASE}/shop?category=vases`, { waitUntil: 'networkidle' })

  const card = shop.locator('article').first()
  const save = card.locator('button[aria-label^="Save"]')
  await save.click()
  await shop.waitForTimeout(1500)
  check('favouriting marks it saved', (await card.locator('button[aria-pressed="true"]').count()) === 1)

  await shop.reload({ waitUntil: 'networkidle' })
  const after = shop.locator('article').first()
  check('and it survives a reload', (await after.locator('button[aria-pressed="true"]').count()) === 1)

  // Leave the demo account as it was found.
  await after.locator('button[aria-label^="Remove"]').click()
  await shop.waitForTimeout(1500)
  check('unfavouriting undoes it', (await after.locator('button[aria-pressed="false"]').count()) === 1)
  await context.close()
})

test('Favoriting from the product page', async ({ browser }) => {
  const { context, page: reader } = await freshPage(browser)
  await signInAsDemo(reader, 'shopper')
  await open(reader, `/products/oak-wall-shelf`)

  const save = reader.locator('button[data-favorite="product"]')
  check('the product page carries its own save control', (await save.count()) === 1)
  const before = await save.getAttribute('aria-pressed')
  await save.click()
  await reader.waitForTimeout(1800)
  check('and it toggles', (await save.getAttribute('aria-pressed')) !== before)

  // Leave the demo account as it was found.
  await save.click()
  await reader.waitForTimeout(1500)
  check('toggling back leaves it as found', (await save.getAttribute('aria-pressed')) === before)
  await context.close()
})

test('The account area', async ({ browser }) => {
  const { context, page: account } = await freshPage(browser)
  await signInAsDemo(account, 'shopper')

  await open(account, `/account/favorites`)
  check('favorites has its own page', /Favorites/.test(await visibleText(account)))
  const sidebar = await account.locator('nav[aria-label="Account"]').innerText()
  check(
    'the sidebar reaches orders, favorites and settings',
    /Orders/.test(sidebar) && /Favorites/.test(sidebar) && /Settings/.test(sidebar),
    sidebar.replace(/\n/g, ' | '),
  )

  // Save something, then confirm it is listed there.
  await account.goto(`${BASE}/shop?category=lighting`, { waitUntil: 'networkidle' })
  const card = account.locator('article').first()
  const name = await card.locator('h3').innerText()
  await card.locator('button[aria-label^="Save"]').click()
  await card.locator('button[aria-label^="Remove"]').first().waitFor()

  await open(account, `/account/favorites`)
  check('a saved product is listed there', (await visibleText(account)).includes(name), name)

  // Leave the demo account as it was found.
  await account.locator('button[aria-label^="Remove"]').first().click()
  await account.waitForTimeout(1500)
  await context.close()
})

test('The newsletter keeps what it is given', async ({ browser }) => {
  const { context, page: visitor } = await freshPage(browser)
  await visitor.goto(`${BASE}/about`, { waitUntil: 'networkidle' })
  const footer = visitor.getByRole('contentinfo')
  const email = `reader${Date.now()}@wicken.test`
  await footer.getByLabel('Email').fill(email)
  await submitted(visitor, () => footer.getByRole('button', { name: 'Subscribe' }).click())
  await waitForText(visitor, /write when the next batch/i)
  check('signing up says thanks', /write when the next batch/i.test(await footer.innerText()))

  await visitor.goto(`${BASE}/help`, { waitUntil: 'networkidle' })
  const again = visitor.getByRole('contentinfo')
  await again.getByLabel('Email').fill(email.toUpperCase())
  await again.getByRole('button', { name: 'Subscribe' }).click()
  await waitForText(visitor, /already on the list/i)
  check('and the same address, however it is typed, is one row', /already on the list/i.test(await again.innerText()))
  await context.close()

  const { context: theirs, page: admin } = await freshPage(browser)
  await signInAsDemo(admin, 'admin')
  await open(admin, `/admin/customers`)
  const counted = (await visibleText(admin)).match(/(\d+) on the newsletter list/)
  check(
    'and the admin can see how many signed up',
    Boolean(counted) && Number(counted[1]) >= 7,
    counted?.[0] ?? 'no count',
  )
  await theirs.close()
})

test('Writing a review', async ({ browser }) => {
  const { context, page: author } = await freshPage(browser)
  await signInAsDemo(author, 'shopper')
  await author.goto(`${BASE}/products/harvest-vase`, { waitUntil: 'networkidle' })
  await author.locator('#reviews').scrollIntoViewIfNeeded()
  await author.waitForTimeout(1200)

  const words = `Sturdier than it looks, run ${Date.now()}`
  await author.getByRole('button', { name: '4 stars' }).click()
  await author.fill('textarea[name="body"]', words)
  await author.getByRole('button', { name: /Post review|Update your review/ }).click()
  await author.waitForTimeout(2500)

  await author.reload({ waitUntil: 'networkidle' })
  await author.locator('#reviews').scrollIntoViewIfNeeded()
  await author.waitForTimeout(1200)
  check('the review appears', (await author.locator('#reviews').innerText()).includes(words))
  check('and the form offers to update it', /Update your review/.test(await author.locator('#reviews').innerText()))

  // A second submission edits rather than duplicating, because of the primary key.
  const revised = `Edited, run ${Date.now()}`
  await author.fill('textarea[name="body"]', revised)
  await author.getByRole('button', { name: 'Update your review' }).click()
  await author.waitForTimeout(2500)
  await author.reload({ waitUntil: 'networkidle' })
  await author.locator('#reviews').scrollIntoViewIfNeeded()
  await author.waitForTimeout(1200)
  const after = await author.locator('#reviews').innerText()
  check('editing replaces rather than duplicates', after.includes(revised) && !after.includes(words))
  await context.close()
})

test('Helpful votes on reviews', async ({ browser }) => {
  const { context, page: reader } = await freshPage(browser)
  await signInAsDemo(reader, 'shopper')

  const open = async (query = '') => {
    await reader.goto(`${BASE}/products/harvest-vase${query}`, { waitUntil: 'networkidle' })
    await reader.locator('#reviews').scrollIntoViewIfNeeded()
    await reader.waitForTimeout(1200)
  }

  await open()
  const thumbs = reader.locator('#reviews button[aria-label^="Helpful,"]')
  check('each review offers a thumb', (await thumbs.count()) > 0, `${await thumbs.count()} votable reviews`)

  const row = await reader.locator('#reviews li').first().innerText()
  check('the thumbs come before the question', /\d[\s\S]*Was this helpful\?/.test(row), row.split('\n').at(-1))

  const before = Number(await thumbs.first().innerText())
  await thumbs.first().click()
  await reader.waitForTimeout(1800)
  const after = Number(await thumbs.first().innerText())
  check('a thumb up counts', after === before + 1, `${before} to ${after}`)
  check('and the button reads as pressed', (await thumbs.first().getAttribute('aria-pressed')) === 'true')

  await open()
  check('the vote survives a reload', Number(await thumbs.first().innerText()) === after)

  // The same thumb again clears it, rather than counting twice.
  await thumbs.first().click()
  await reader.waitForTimeout(1800)
  check('pressing it again takes it back', Number(await thumbs.first().innerText()) === before)

  // A review of your own is not something to vote on, and the table refuses it too.
  await open('?reviews=recent')
  const panel = await reader.locator('#reviews').innerText()
  check('your own review is not votable', /Your review ·/.test(panel), panel.split('\n').slice(0, 3).join(' | '))
  await context.close()
})

test('Throttling', async ({ browser }) => {
  const { context, page: fresh } = await freshPage(browser)
  let message = ''
  let trippedAt = 0
  for (let attempt = 1; attempt <= 10 && !trippedAt; attempt++) {
    await signInWithForm(fresh, { email: demo.shopper.email, password: 'definitely-wrong-x' })
    await fresh
      .locator('p[role="alert"]')
      .waitFor()
      .catch(() => {})
    message = await fresh
      .locator('p[role="alert"]')
      .innerText()
      .catch(() => '')
    if (/Too many/i.test(message)) trippedAt = attempt
  }
  check('repeated wrong passwords are throttled', trippedAt > 0, `ten attempts all answered: ${message}`)
  check('a wrong password does not say whether the account exists', !/no account|unknown|not found/i.test(message))
  await context.close()
})
