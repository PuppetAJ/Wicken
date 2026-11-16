import assert from 'node:assert/strict'
import { after, beforeEach, describe, it } from 'node:test'
import { pool } from '../pool.ts'
import { insertProduct, resetDatabase } from '../test-support.ts'
import { getProductBySlug, listFeaturedProducts, listProducts, listFacets } from './products.ts'

after(() => pool.end())
beforeEach(resetDatabase)

describe('product queries', () => {
  it('filters by category', async () => {
    await insertProduct({ category: 'vases', name: 'A Vase' })
    await insertProduct({ category: 'furniture', name: 'A Chair' })

    const vases = await listProducts({ category: 'vases' })
    assert.equal(vases.length, 1)
    assert.equal(vases[0].name, 'A Vase')
  })

  it('searches name and description', async () => {
    await insertProduct({ name: 'Ridge Mug', description: 'Thrown by hand.' })
    await insertProduct({ name: 'Plate', description: 'Glazed with ash.' })

    assert.equal((await listProducts({ search: 'ridge' })).length, 1, 'matches name, case-insensitively')
    assert.equal((await listProducts({ search: 'ash' })).length, 1, 'matches description')
    assert.equal((await listProducts({ search: 'nothing' })).length, 0)
  })

  it('sorts by price in both directions', async () => {
    await insertProduct({ price_cents: 500, name: 'Cheap' })
    await insertProduct({ price_cents: 9000, name: 'Dear' })

    assert.equal((await listProducts({ sort: 'price-asc' }))[0].name, 'Cheap')
    assert.equal((await listProducts({ sort: 'price-desc' }))[0].name, 'Dear')
  })

  it('returns null rather than throwing for an unknown slug', async () => {
    assert.equal(await getProductBySlug('does-not-exist'), null)
  })

  it('returns only featured products', async () => {
    await insertProduct({ is_featured: true, name: 'Featured' })
    await insertProduct({ is_featured: false })

    const featured = await listFeaturedProducts()
    assert.equal(featured.length, 1)
    assert.equal(featured[0].name, 'Featured')
  })

  it('reads prices back as numbers, not strings', async () => {
    await insertProduct({ price_cents: 2800 })
    const [product] = await listProducts()
    assert.equal(typeof product.price_cents, 'number')
    assert.equal(product.price_cents, 2800)
  })
})

describe('filtering by material and color', () => {
  const stock = async () => {
    await pool.query(
      `INSERT INTO products (slug, name, description, category, price_cents, stock_quantity, material_tags, color)
       VALUES ('oak-thing', 'Oak Thing', 'x', 'furniture', 100, 1, ARRAY['oak'], 'natural'),
              ('ash-thing', 'Ash Thing', 'x', 'furniture', 100, 1, ARRAY['ash', 'steel'], 'natural'),
              ('blue-pot', 'Blue Pot', 'x', 'vases', 100, 1, ARRAY['stoneware'], 'blue'),
              ('white-pot', 'White Pot', 'x', 'vases', 100, 1, ARRAY['stoneware'], 'white')`,
    )
  }

  it('returns anything carrying one of the chosen materials', async () => {
    await stock()
    const found = await listProducts({ materials: ['oak', 'ash'] })
    assert.deepEqual(found.map((p) => p.slug).sort(), ['ash-thing', 'oak-thing'])
  })

  it('matches a material anywhere in the array, not only first', async () => {
    await stock()
    const found = await listProducts({ materials: ['steel'] })
    assert.deepEqual(
      found.map((p) => p.slug),
      ['ash-thing'],
      'steel is the second tag on that product',
    )
  })

  it('filters by color', async () => {
    await stock()
    assert.deepEqual(
      (await listProducts({ colors: ['blue'] })).map((p) => p.slug),
      ['blue-pot'],
    )
  })

  it('combines material and color', async () => {
    await stock()
    const found = await listProducts({ materials: ['stoneware'], colors: ['white'] })
    assert.deepEqual(
      found.map((p) => p.slug),
      ['white-pot'],
    )
  })

  it('treats an empty selection as no filter at all', async () => {
    await stock()
    assert.equal((await listProducts({ materials: [], colors: [] })).length, 4)
  })

  it('offers only the facets the catalog actually carries', async () => {
    await stock()
    const { materials, colors } = await listFacets()

    assert.ok(materials.includes('stoneware'))
    assert.ok(colors.includes('natural'))
    assert.ok(!colors.includes('black'))
  })

  it('lists materials alphabetically, because that is a list you scan for a word', async () => {
    await stock()
    const { materials } = await listFacets()
    assert.deepEqual(materials, [...materials].sort())
  })

  it('but lists colors commonest first, because a swatch has no word to scan for', async () => {
    await stock()
    const { colors } = await listFacets()
    assert.equal(colors[0], 'natural', 'two carry it, the rest one each')
  })
})

describe('filtering by price band', () => {
  const priced = async () => {
    await pool.query(
      `INSERT INTO products (slug, name, description, category, price_cents, stock_quantity, sale_price_cents)
       VALUES ('cheap', 'Cheap', 'x', 'tableware', 3000, 1, NULL),
              ('mid', 'Mid', 'x', 'tableware', 7000, 1, NULL),
              ('dear', 'Dear', 'x', 'furniture', 30000, 1, NULL),
              ('reduced', 'Reduced', 'x', 'furniture', 30000, 1, 4000)`,
    )
  }

  it('bands on what the shopper pays, not the list price', async () => {
    await priced()
    const found = await listProducts({ priceRanges: [[0, 5000]] })
    assert.deepEqual(
      found.map((p) => p.slug).sort(),
      ['cheap', 'reduced'],
      'a £300 chair reduced to £40 belongs in the cheapest band',
    )
  })

  it('excludes the upper bound and includes the lower', async () => {
    await priced()
    const found = await listProducts({ priceRanges: [[3000, 7000]] })
    assert.deepEqual(found.map((p) => p.slug).sort(), ['cheap', 'reduced'])
    assert.ok(!found.some((p) => p.slug === 'mid'), '7000 is the exclusive upper bound')
  })

  it('treats a null upper bound as open ended', async () => {
    await priced()
    assert.deepEqual(
      (await listProducts({ priceRanges: [[20000, null]] })).map((p) => p.slug),
      ['dear'],
    )
  })

  it('returns anything in any chosen band', async () => {
    await priced()
    const found = await listProducts({
      priceRanges: [
        [0, 5000],
        [20000, null],
      ],
    })
    assert.deepEqual(found.map((p) => p.slug).sort(), ['cheap', 'dear', 'reduced'])
  })
})
