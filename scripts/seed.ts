import { pool } from '../src/lib/db/pool.ts'
import { seedDemoOrders } from './demo-orders.ts'
import { seedDemoMessages } from './demo-messages.ts'
import { seedDemoReviews } from './demo-reviews.ts'
import { seedDemoSubscribers } from './demo-subscribers.ts'
import { seedDemoUsers } from './demo-users.ts'
import { products } from './catalog.ts'
import { productFacets } from './product-facets.ts'
import { productSpecs } from './product-specs.ts'

const ourOwn = ['stoneware', 'porcelain', 'earthenware', 'oak', 'ash', 'elm', 'pine', 'walnut', 'reclaimed-wood']

function whoMadeIt(materials: string[]): string | null {
  if (materials.some((material) => ourOwn.includes(material))) return null
  if (materials.includes('linen')) return 'rosedale-weaving'
  if (materials.includes('glass')) return 'kestrel-glass'
  if (materials.includes('wax') || materials.includes('stone')) return 'fennimore-wax'
  return null
}

const client = await pool.connect()
try {
  await client.query('BEGIN')
  await client.query('TRUNCATE order_items, orders, cart_items, carts, products RESTART IDENTITY CASCADE')
  for (const p of products) {
    await client.query(
      `INSERT INTO products (slug, name, description, category, price_cents, stock_quantity, dimensions, materials, specs, image_url, is_featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        p.slug,
        p.name,
        p.description,
        p.category,
        p.price_cents,
        p.stock_quantity,
        p.dimensions,
        p.materials,
        JSON.stringify(productSpecs[p.slug] ?? {}),
        `/images/${p.slug}.jpg`,
        p.is_featured ?? false,
      ],
    )
  }
  for (const [slug, facets] of Object.entries(productFacets)) {
    await client.query('UPDATE products SET material_tags = $1, color = $2, made_by = $3 WHERE slug = $4', [
      facets.materials,
      facets.color,
      whoMadeIt(facets.materials),
      slug,
    ])
  }

  await client.query(`UPDATE products SET sale_price_cents = round(price_cents * 0.75)
     WHERE slug IN ('harvest-vase', 'ridged-tumblers', 'weathered-stool', 'globe-wall-light')`)

  await client.query('COMMIT')
  console.log(`Seeded ${products.length} products, four on sale`)
} catch (error) {
  await client.query('ROLLBACK')
  throw error
} finally {
  client.release()
}

try {
  await seedDemoUsers()
  console.log('Seeded the demo shopper and demo admin')
  console.log(`Seeded ${await seedDemoReviews()} reviews`)
  console.log(`Seeded ${await seedDemoOrders()} orders across the last 90 days`)
  console.log(`Seeded ${await seedDemoMessages()} messages to the studio`)
  console.log(`Seeded ${await seedDemoSubscribers()} newsletter subscribers`)
} finally {
  await pool.end()
}
