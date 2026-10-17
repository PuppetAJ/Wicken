// The shop, the pages that sell, and everything a visitor sees signed out. Needs a seeded database.
import { BASE, check, freshPage, open, signInAsDemo, test, visibleText, waitForText } from './lib.mjs'

test('Catalog', async ({ page }) => {
  await page.goto(`${BASE}/shop`, { waitUntil: 'networkidle' })
  const all = await page.locator('a[href^="/products/"]').count()
  check('the shop lists the seeded catalog', all >= 30, `${all} tiles`)

  await page.goto(`${BASE}/shop?category=vases`, { waitUntil: 'networkidle' })
  const vases = await page.locator('a[href^="/products/"]').count()
  check('a category narrows the grid', vases > 0 && vases < all, `${vases} of ${all}`)

  await page.goto(`${BASE}/shop?q=teapot`, { waitUntil: 'networkidle' })
  const found = await page.locator('a[href^="/products/"]').count()
  check('search narrows the grid', found > 0 && found < all, `${found} for "teapot"`)

  await page.goto(`${BASE}/shop?q=zzzznothing`, { waitUntil: 'networkidle' })
  const none = await page.locator('a[href^="/products/"]').count()
  check('a search that matches nothing returns nothing', none === 0, `${none} tiles — a 200 is not a passing test`)

  await page.goto(`${BASE}/shop?category=bogus&sort=bogus`, { waitUntil: 'networkidle' })
  const bogus = await page.locator('a[href^="/products/"]').count()
  check('nonsense search params fall back rather than throwing', bogus >= 30, `${bogus} tiles`)
})

test('The landing page sells something', async ({ browser }) => {
  const { context, page: home } = await freshPage(browser)
  await home.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  const text = await visibleText(home)

  const ways = await home.getByRole('main').locator('a[href^="/shop?category="]').count()
  check('every category is a way in', ways === 6, `${ways} categories`)

  const featured = await home.locator('main article').count()
  check('and four pieces are offered by name', featured === 4, `${featured} tiles`)
  check('with a way through to the rest', /See the whole collection/.test(text))
  check('somebody is shown making something', (await home.locator('img[src*="editorial-throwing"]').count()) > 0)

  // The band quotes the reviews table, so the quote has to be findable on the product it came from.
  const quote = (await home.locator('blockquote').first().innerText()).replaceAll(/[\u201c\u201d"]/g, '').trim()
  const onward = await home.locator('figcaption a').first().getAttribute('href')
  check('the quotes name the piece they are about', Boolean(onward?.startsWith('/products/')), String(onward))
  const product = await (await fetch(`${BASE}${onward}`)).text()
  check('and are real reviews, still there on the product', product.includes(quote.slice(0, 40)), quote.slice(0, 40))

  const asks = await home.getByRole('button', { name: 'Subscribe' }).count()
  check('the page asks for an email once, not twice', asks === 1, `${asks} signup forms`)
  await home.setViewportSize({ width: 320, height: 900 })
  await home.waitForTimeout(200)
  const flush = await home.locator('footer').evaluate((f) => getComputedStyle(f).paddingTop)
  check('and on a phone the closing card meets the footer', flush === '0px', flush)
  await context.close()
})

test('About earns its page', async ({ page }) => {
  await page.goto(`${BASE}/about`, { waitUntil: 'networkidle' })
  const photographs = await page.locator('main img').count()
  check('the editorial photographs are finally used', photographs >= 4, `${photographs} photographs`)

  const text = await visibleText(page)
  check('the making is explained rather than asserted', /Handling clay while the light is good/.test(text))
  check('and the landing page promise is kept', /Maren/.test(text))
})

test('The help page', async ({ browser }) => {
  const { context, page: help } = await freshPage(browser)
  await help.goto(`${BASE}/faq`, { waitUntil: 'networkidle' })
  check('the old FAQ route redirects rather than 404s', help.url().endsWith('/help'), help.url())

  const text = await visibleText(help)
  check(
    'it covers all three of the footer labels',
    /Shipping/.test(text) && /Returns/.test(text) && /Care and repair/.test(text),
  )
  const questions = await help.locator('[data-slot="accordion-trigger"]').count()
  check('with a page of questions rather than a stub', questions >= 12, `${questions} questions`)

  for (const id of ['shipping', 'returns', 'care', 'contact']) {
    check(`the footer's #${id} link lands somewhere`, (await help.locator(`#${id}`).count()) === 1)
  }

  // A discarded message would be worse than printing an address, so it has to survive as far as the admin.
  const said = `A question from the browser suite at ${Date.now()}`
  await help.fill('#name', 'Suite Sender')
  await help.fill('#email', 'sender@wicken.test')
  await help.fill('#body', said)
  await help.getByRole('button', { name: 'Send', exact: true }).click()
  await waitForText(help, /Thank you for reaching out/i)
  check('the form says it arrived', /Thank you for reaching out/i.test(await visibleText(help)))
  await context.close()

  const { context: theirs, page: admin } = await freshPage(browser)
  await signInAsDemo(admin, 'admin')
  await open(admin, `/admin/messages`)
  check('and it is waiting in the admin', (await visibleText(admin)).includes(said))
  await theirs.close()
})

test('Product page', async ({ page }) => {
  await page.goto(`${BASE}/products/ash-dining-table`, { waitUntil: 'networkidle' })
  const text = await visibleText(page)
  check('the product page shows its price', /\$\d/.test(text))
  check('and says who made it', /Made in our studio in Hudson/.test(text), text.match(/Made [^\n]*/)?.[0])
  check(
    'and that furniture is cut to order',
    /Made to order, 4–6 weeks/.test(text),
    text.match(/Made to order[^\n]*/)?.[0],
  )
  check('dimensions are visible without opening anything', /Dimensions/i.test(text))
  check('related products are offered', (await page.locator('a[href^="/products/"]').count()) > 0)

  // Availability belongs with the price and the rating, not stranded under the button.
  const stockAt = text.search(/In stock, ships|Made to order|Only \d+ left|next batch comes out/)
  check('availability is stated', stockAt > -1, text.slice(Math.max(0, stockAt - 20), stockAt + 40))
  check('and sits above the description', stockAt < text.indexOf('Add to cart'))
  const ratingAt = text.search(/\d\.\d · \d+ review/)
  if (ratingAt > -1) check('below the rating that precedes it', ratingAt < stockAt, `${ratingAt} then ${stockAt}`)

  const beforeAccordion = await page.locator('button[aria-label^="View"]').boundingBox()
  await page.getByRole('button', { name: /Product information/i }).click()
  await page.waitForTimeout(500)

  const specs = await page.locator('[data-slot="accordion-content"]').first().innerText()
  check(
    'product information keeps measurements and care',
    /Measurements/.test(specs) && /Materials and care/.test(specs),
  )
  check(
    'and none of the sections that were cut',
    !/Made in|In the studio|Electrical|Assembly|Model number|Packaging/.test(specs),
    specs.split('\n').slice(0, 4).join(' | '),
  )
  // A single piece has nothing to say under Item details, so the heading does not appear.
  check('a heading with nothing under it is dropped', !/Item details/.test(specs))
  const afterAccordion = await page.locator('button[aria-label^="View"]').boundingBox()
  check(
    'opening the accordion does not stretch the photograph',
    Math.abs(beforeAccordion.height - afterAccordion.height) < 2,
    `${Math.round(beforeAccordion.height)} then ${Math.round(afterAccordion.height)}`,
  )
})

test('Image magnifier', async ({ page }) => {
  await page.goto(`${BASE}/products/ash-dining-table`, { waitUntil: 'networkidle' })
  const trigger = page.locator('button[aria-label^="View"]').first()
  const image = trigger.locator('img')
  const box = await trigger.boundingBox()

  check('the photograph rests unscaled', (await image.evaluate((e) => getComputedStyle(e).transform)) === 'none')

  await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.25)
  await page.waitForTimeout(400)
  const scaled = await image.evaluate((e) => getComputedStyle(e).transform)
  const originTopLeft = await image.evaluate((e) => getComputedStyle(e).transformOrigin)
  check('hovering magnifies it', scaled.startsWith('matrix(2.2'), scaled)
  check('the anchor follows the cursor', originTopLeft.startsWith(`${Math.round(box.width * 0.25)}px`), originTopLeft)

  await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.75)
  await page.waitForTimeout(400)
  const originBottomRight = await image.evaluate((e) => getComputedStyle(e).transformOrigin)
  check('the anchor moves with it', originBottomRight !== originTopLeft, originBottomRight)

  await page.mouse.move(5, 5)
  await page.waitForTimeout(400)
  check('leaving resets it', (await image.evaluate((e) => getComputedStyle(e).transform)) === 'none')

  await trigger.click()
  await page.waitForTimeout(600)
  check('clicking opens the whole frame', await page.locator('[role="dialog"]').isVisible())
  await page.keyboard.press('Escape')
  await page.waitForTimeout(400)
  check('escape closes it', (await page.locator('[role="dialog"]').count()) === 0)
})

test('Who made it, and how long it takes', async ({ browser }) => {
  const { context, page: reader } = await freshPage(browser)
  for (const [slug, maker, lead] of [
    ['linen-table-runner', 'Rosedale Weaving', '3–5 business days'],
    ['globe-wall-light', 'Kestrel Glass', '2–3 weeks'],
    ['ridge-breakfast-mug', 'our studio', '3–5 business days'],
  ]) {
    await open(reader, `/products/${slug}`)
    const said = await visibleText(reader)
    check(`${slug} names its maker`, said.includes(maker), said.match(/Made [^\n]*/)?.[0])
    check(`and quotes ${lead}`, said.includes(lead), said.match(/(ships in|Made to order,)[^\n]*/)?.[0])
  }

  // The claim on the landing page has to match what the catalog actually holds.
  await open(reader, '/')
  const band = await visibleText(reader)
  check('the landing page counts the workshops correctly', /three workshops/.test(band))
  await context.close()
})

test('A missing product', async ({ page }) => {
  const response = await page.goto(`${BASE}/products/does-not-exist`, { waitUntil: 'networkidle' })
  const text = await visibleText(page)
  // The product segment has its own not-found copy; the global one is a different page.
  check('it shows the product not-found page', /do not make that one/i.test(text), text.slice(0, 120))
  check(
    'it is marked noindex',
    (await page.locator('meta[name="robots"]').count()) > 0,
    `status was ${response.status()}`,
  )
  check('no product markup is served', !/Add to cart/i.test(text))
})

test('More from a category', async ({ browser }) => {
  const { context, page: nav } = await freshPage(browser)
  await nav.goto(`${BASE}/products/ash-glaze-dinner-plate`, { waitUntil: 'networkidle' })
  const rail = nav.locator('ul:has(> li a[href^="/products/"])').last()
  check('the rail offers more than a single row', (await rail.locator('li').count()) > 4)

  const forward = nav.getByRole('button', { name: 'More products' })
  check('an arrow is offered when there is overflow', (await forward.count()) === 1)
  const before = await rail.evaluate((element) => element.scrollLeft)
  await forward.click()
  await nav.waitForTimeout(900)
  const after = await rail.evaluate((element) => element.scrollLeft)
  check('and it pages the rail along', after > before, `scrollLeft ${before} to ${after}`)
  await context.close()
})

test('The shop skeleton mirrors the shop', async () => {
  // The prerendered shell is read straight from the response rather than racing the browser for it.
  const html = await (await fetch(`${BASE}/shop`)).text()
  const shell = html.split('<script>self.__next_f')[0]

  check('the shell is the skeleton', shell.includes('data-slot="skeleton"'), `${shell.length} bytes`)
  check('it reserves the filter rail', shell.includes('lg:grid-cols-[12rem_1fr]'))
  const rows = (shell.match(/size-4 rounded-sm/g) ?? []).length
  check('with facet rows in it', rows > 5, `${rows} rows`)
  const pills = (shell.match(/h-8 rounded-full/g) ?? []).length
  check('and the category pills above it', pills > 3, `${pills} pills`)
})

test('The widened catalog', async ({ browser }) => {
  const { context, page: shop } = await freshPage(browser)
  const tiles = () => shop.locator('article').count()

  await shop.goto(`${BASE}/shop`, { waitUntil: 'networkidle' })
  const all = await tiles()
  check('the catalog has grown', all >= 45, `${all} pieces`)

  for (const [label, category] of [
    ['textiles', 'textiles'],
    ['storage', 'storage'],
  ]) {
    await shop.goto(`${BASE}/shop?category=${category}`, { waitUntil: 'networkidle' })
    const found = await tiles()
    check(`${label} is a category of its own`, found > 0 && found < all, `${found} of ${all}`)
  }

  // Walnut is a material the vocabulary did not have until these pieces existed.
  await shop.goto(`${BASE}/shop?material=walnut`, { waitUntil: 'networkidle' })
  check('walnut filters to the pieces made of it', (await tiles()) > 0, `${await tiles()} in walnut`)

  await shop.goto(`${BASE}/shop?material=linen`, { waitUntil: 'networkidle' })
  check('and linen reaches the textiles', (await tiles()) >= 5, `${await tiles()} in linen`)
  await context.close()
})

test('Material and color filters', async ({ browser }) => {
  const { context, page: shop } = await freshPage(browser)
  const tiles = () => shop.locator('article').count()

  await shop.goto(`${BASE}/shop`, { waitUntil: 'networkidle' })
  const all = await tiles()
  check('materials are checkboxes', (await shop.locator('input[type="checkbox"][name="material"]').count()) > 5)
  check('colors are swatches', (await shop.locator('input[type="checkbox"][name="color"]').count()) > 5)
  // Scoped to the material list: the price band labels contain digits quite legitimately.
  const materialList = await shop.locator('fieldset:has(legend:text-is("Material"))').innerText()
  check(
    'no counts beside the materials',
    !/\w\s+\d+/.test(materialList),
    materialList.replace(/\n/g, ' | ').slice(0, 80),
  )

  const listed = (
    await shop.locator('fieldset:has(legend:text-is("Material")) label span:not(.sr-only)').allInnerTexts()
  )
    .map((text) => text.trim())
    .filter(Boolean)
  check(
    'materials are listed alphabetically',
    listed.every((name, index) => index === 0 || listed[index - 1].localeCompare(name) <= 0),
    listed.slice(0, 5).join(', '),
  )

  // A gradient sized to the padding box leaves a bordered circle with pale crescents at the curve.
  const mixed = shop.locator('label[title="Mixed"] span[aria-hidden]')
  if ((await mixed.count()) > 0) {
    check(
      'the mixed swatch fills its circle',
      (await mixed.evaluate((node) => getComputedStyle(node).backgroundOrigin)) === 'border-box',
    )
  }

  await shop.locator('label:has(input[name="material"][value="oak"])').click()
  await shop.waitForURL((url) => url.searchParams.getAll('material').includes('oak'))
  const oak = await tiles()
  check('checking a box filters the grid', oak > 0 && oak < all, `${all} to ${oak}`)
  check('and the URL carries it', shop.url().includes('material=oak'), shop.url())
  check('the box stays checked', await shop.locator('input[name="material"][value="oak"]').isChecked())

  await shop.locator('label:has(input[name="material"][value="ash"])').click()
  await shop.waitForURL((url) => url.searchParams.getAll('material').includes('ash'))
  // Overlap, not intersection: nothing is made of oak *and* ash.
  check('two materials returns either, not both', (await tiles()) > oak, `${await tiles()} tiles`)

  await shop.locator('label:has(input[name="material"][value="oak"])').click()
  await shop.waitForURL((url) => !url.searchParams.getAll('material').includes('oak'))
  check(
    'unchecking removes only that one',
    shop.url().includes('material=ash') && !shop.url().includes('oak'),
    shop.url(),
  )

  await shop.goto(`${BASE}/shop?color=blue`, { waitUntil: 'networkidle' })
  check('color filters too', (await tiles()) > 0 && (await tiles()) < all)

  await shop.goto(`${BASE}/shop?material=stoneware&color=cream`, { waitUntil: 'networkidle' })
  check('material and color combine', (await tiles()) > 0 && (await tiles()) < all, `${await tiles()} tiles`)

  await shop.goto(`${BASE}/shop?category=vases&material=stoneware`, { waitUntil: 'networkidle' })
  check('filtering keeps the category', shop.url().includes('category=vases'), shop.url())

  await shop.goto(`${BASE}/shop?material=bogus&color=nonsense`, { waitUntil: 'networkidle' })
  check('nonsense facets fall back rather than throwing', (await tiles()) === all, `${await tiles()} tiles`)

  // The quick actions overlay the whole tile, so it must not swallow the card's own link.
  await shop.goto(`${BASE}/shop?material=oak`, { waitUntil: 'networkidle' })
  const image = await shop.locator('article').first().locator('img').first().boundingBox()
  await shop.mouse.click(image.x + image.width / 2, image.y + image.height / 2)
  await shop.waitForTimeout(1800)
  check('clicking a tile image opens the product', shop.url().includes('/products/'), shop.url())
  await context.close()
})

test('Filtering does not reload or flood', async ({ browser }) => {
  const { context, page: shop } = await freshPage(browser)
  let requests = 0
  shop.on('request', (request) => {
    // Prefetches are the router filling its cache, not the typing asking the server for anything.
    if (request.headers()['next-router-prefetch']) return
    if (request.url().includes('/shop') && request.resourceType() !== 'image') requests++
  })

  await open(shop, '/shop')
  requests = 0

  // Typing used to re-run its own effect on the render its navigation caused, which is a loop.
  await shop.locator('input[type="search"][name="q"]').click()
  for (const letter of 'teapot') {
    await shop.keyboard.type(letter)
    await shop.waitForTimeout(80)
  }
  await shop.waitForURL((url) => url.searchParams.get('q') === 'teapot')
  const afterTyping = requests
  check('typing is debounced into one request', afterTyping <= 3, `${afterTyping} for six keystrokes`)

  await shop.waitForTimeout(3000)
  check('and stops once idle', requests === afterTyping, `${requests - afterTyping} more while idle`)

  // fill() ignores maxLength, so unclamped 150 characters reach the URL and the schema drops them.
  await shop.locator('input[type="search"][name="q"]').fill('a'.repeat(150))
  await shop.waitForURL((url) => (url.searchParams.get('q') ?? '').length === 100)
  const asked = new URL(shop.url()).searchParams.get('q') ?? ''
  check('an over-long query is clamped to what the schema accepts', asked.length === 100, `${asked.length} chars`)

  // Scrolled to where the checkbox is on screen, so the click itself cannot scroll.
  await open(shop, '/shop')
  const boxes = shop.locator('label:has(input[name="material"][value="stoneware"])')
  await boxes.scrollIntoViewIfNeeded()
  await shop.evaluate(() => window.scrollBy({ top: 120, behavior: 'instant' }))
  await shop.waitForTimeout(300)
  const before = await shop.evaluate(() => window.scrollY)

  await boxes.click()
  await shop.waitForURL((url) => url.searchParams.getAll('material').includes('stoneware'))
  const after = await shop.evaluate(() => window.scrollY)
  check('filtering keeps the scroll position', Math.abs(before - after) < 60, `${before} to ${after}`)
  check(
    'and does not reload the page',
    await shop.evaluate(() => performance.getEntriesByType('navigation').length === 1),
  )
  await context.close()
})

test('Price bands', async ({ browser }) => {
  const { context, page: shop } = await freshPage(browser)
  const tiles = () => shop.locator('article').count()

  await shop.goto(`${BASE}/shop`, { waitUntil: 'networkidle' })
  const all = await tiles()
  check('the four bands are offered', (await shop.locator('input[name="price"]').count()) === 4)

  await shop.goto(`${BASE}/shop?price=under-50`, { waitUntil: 'networkidle' })
  const cheap = await tiles()
  check('a band narrows the grid', cheap > 0 && cheap < all, `${cheap} of ${all}`)

  await shop.goto(`${BASE}/shop?price=under-50&price=over-200`, { waitUntil: 'networkidle' })
  check('two bands are a union', (await tiles()) > cheap, `${await tiles()} tiles`)

  await shop.goto(`${BASE}/shop?price=under-50&material=stoneware`, { waitUntil: 'networkidle' })
  check('price combines with material', (await tiles()) > 0 && (await tiles()) <= cheap)

  await shop.goto(`${BASE}/shop?price=bogus`, { waitUntil: 'networkidle' })
  check('a bogus band falls back rather than throwing', (await tiles()) === all)

  // The box we draw ourselves, so its shape and its checked fill are both ours to assert.
  const boxOf = (name, value) => shop.locator(`label:has(input[name="${name}"][value="${value}"]) > span`).first()
  const radiusOf = (box) => box.evaluate((node) => parseFloat(getComputedStyle(node).borderTopLeftRadius))
  const size = await boxOf('price', 'under-50').evaluate((node) => node.getBoundingClientRect().width)

  await shop.goto(`${BASE}/shop`, { waitUntil: 'networkidle' })
  check('a price box is round', (await radiusOf(boxOf('price', 'under-50'))) >= size / 2, `radius of ${size}px box`)
  check('a material box is not', (await radiusOf(boxOf('material', 'stoneware'))) < size / 2)

  const fill = (box) => box.evaluate((node) => getComputedStyle(node).backgroundColor)
  const idle = await fill(boxOf('price', 'under-50'))
  await shop.locator('label:has(input[name="price"][value="under-50"])').click()
  await shop.waitForURL((url) => url.searchParams.getAll('price').includes('under-50'))
  check('and it fills once checked', (await fill(boxOf('price', 'under-50'))) !== idle, `was ${idle}`)
  await context.close()
})

test('Sale prices', async ({ browser }) => {
  const { context, page: shopper } = await freshPage(browser)

  await shopper.goto(`${BASE}/products/harvest-vase`, { waitUntil: 'networkidle' })
  const page = await visibleText(shopper)
  // Seeded at 25% off, so the sale price shows beside the struck-through original.
  check('a sale product shows both prices', /\$58\.50/.test(page) && /\$78\.00/.test(page), page.slice(0, 120))

  await shopper.getByRole('button', { name: 'Add to cart' }).click()
  await shopper.locator('[data-slot="sheet-content"]').waitFor()
  const sheet = await shopper.locator('[role="dialog"]').innerText()
  // The important one: the cart has to charge the sale price, not the list price.
  check(
    'and the cart charges the sale price',
    /58\.50/.test(sheet) && !/78\.00/.test(sheet),
    sheet.replace(/\n/g, ' | ').slice(0, 140),
  )

  await shopper.goto(`${BASE}/shop?category=vases`, { waitUntil: 'networkidle' })
  check('the grid marks it as on sale', /% off/.test(await visibleText(shopper)))
  await context.close()
})

test('Reviews', async ({ browser }) => {
  const { context, page: reader } = await freshPage(browser)

  await reader.goto(`${BASE}/products/oak-wall-shelf`, { waitUntil: 'networkidle' })
  await reader.locator('#reviews').scrollIntoViewIfNeeded()
  await reader.waitForTimeout(1200)
  const section = await reader.locator('#reviews').innerText()
  check('a reviewed product shows its reviews', /Marta Ellison|Joseph Ndiaye|Priya Raman/.test(section))
  check('and a rating beside the price', (await reader.locator('a[href="#reviews"]').count()) === 1)

  check('a signed-out visitor is asked to log in', /Log in/.test(section), section.slice(-120))
  await context.close()
})

test('Sorting reviews', async ({ browser }) => {
  const { context, page: reader } = await freshPage(browser)

  const open = async (query = '') => {
    await reader.goto(`${BASE}/products/spouted-pendant${query}`, { waitUntil: 'networkidle' })
    await reader.locator('#reviews').scrollIntoViewIfNeeded()
    await reader.waitForTimeout(1200)
  }
  // Stars put the rating in an aria-label, not in the text, so read it there.
  const ratings = async () =>
    Promise.all(
      (await reader.locator('#reviews li [role="img"]').all()).map(async (star) =>
        Number((await star.getAttribute('aria-label')).split(' ')[0]),
      ),
    )
  const scores = async () =>
    (await reader.locator('#reviews li').allInnerTexts()).map((text) => {
      const [up = 0, down = 0] = (text.match(/\d+/g) ?? []).slice(-2).map(Number)
      return up - down
    })

  const falling = (values) => values.every((value, index) => index === 0 || values[index - 1] >= value)
  const rising = (values) => values.every((value, index) => index === 0 || values[index - 1] <= value)

  await open()
  const helpful = await scores()
  const helpfulStars = await ratings()
  check('reviews are listed', helpful.length > 1, `${helpful.length} reviews`)
  check('most helpful runs down the net score', falling(helpful), helpful.join(' then '))
  check('the sort control is offered', (await reader.getByLabel('Sort reviews').count()) === 1)

  await open('?reviews=highest')
  const high = await ratings()
  check('highest rated runs down the stars', falling(high), high.join(' then '))
  // Without this the two sorts could be agreeing by chance and neither check would mean much.
  check(
    'and it is not the order most helpful gave',
    high.join() !== helpfulStars.join(),
    `${helpfulStars.join()} then ${high.join()}`,
  )

  await open('?reviews=lowest')
  const low = await ratings()
  check('lowest rated runs up them', rising(low), low.join(' then '))

  await open('?reviews=bogus')
  check('a bogus sort falls back rather than throwing', (await scores()).length === helpful.length)
  await context.close()
})

test('Long review lists are capped', async ({ browser }) => {
  const { context, page: reader } = await freshPage(browser)
  await reader.goto(`${BASE}/products/spouted-pendant`, { waitUntil: 'networkidle' })
  await reader.locator('#reviews').scrollIntoViewIfNeeded()
  await reader.waitForTimeout(1200)

  const shown = () => reader.locator('#reviews li').count()
  const capped = await shown()
  check('only the first few are shown', capped === 5, `${capped} on screen`)

  const more = reader.getByRole('button', { name: /Show all \d+ reviews/ })
  check('with an offer to see the rest', (await more.count()) === 1)
  const total = Number((await more.innerText()).match(/\d+/)[0])
  check('which names the real total', total > capped, `${total} in all`)

  await more.click()
  await reader.waitForTimeout(400)
  check('expanding shows them all', (await shown()) === total, `${await shown()} on screen`)
  check('and offers to fold them back', (await reader.getByRole('button', { name: 'Show fewer' }).count()) === 1)

  await reader.getByRole('button', { name: 'Show fewer' }).click()
  await reader.waitForTimeout(400)
  check('folding back returns to the cap', (await shown()) === capped)
  await context.close()
})

test('Choosing a review sort does not jump', async ({ browser }) => {
  const { context, page: reader } = await freshPage(browser)
  await reader.goto(`${BASE}/products/spouted-pendant`, { waitUntil: 'networkidle' })
  // Scrolled to the control first, or the browser's own scroll-into-view on focus is read as the sort's.
  await reader.getByLabel('Sort reviews').scrollIntoViewIfNeeded()
  await reader.waitForTimeout(400)
  const before = await reader.evaluate(() => window.scrollY)

  await reader.getByLabel('Sort reviews').selectOption('lowest')
  await reader.waitForTimeout(2000)
  const after = await reader.evaluate(() => window.scrollY)
  check('the page stays where it was', Math.abs(before - after) < 60, `${Math.round(before)} to ${Math.round(after)}`)
  check('but the sort did apply', reader.url().includes('reviews=lowest'), reader.url())
  await context.close()
})
