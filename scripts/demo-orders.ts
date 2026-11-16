import { pool } from '../src/lib/db/pool.ts'
import { ensurePeople, rolls } from './demo-people.ts'

const DAYS = 90

export async function seedDemoOrders(): Promise<number> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const people = await ensurePeople(client)

    const { rows: catalog } = await client.query<{
      id: number
      name: string
      slug: string
      image_url: string | null
      price: number
    }>(
      `SELECT id, name, slug, image_url, COALESCE(sale_price_cents, price_cents) AS price
       FROM products ORDER BY id`,
    )
    if (catalog.length === 0) return 0

    await client.query('DELETE FROM orders WHERE user_id = ANY($1)', [people])

    await client.query('DELETE FROM events')

    const roll = rolls(20260920)
    let written = 0
    const events: {
      name: string
      session: string
      path: string
      productId: number | null
      at: Date
      userId: string | null
    }[] = []

    for (let back = DAYS; back >= 0; back--) {
      const day = new Date()
      day.setUTCDate(day.getUTCDate() - back)
      const weekend = day.getUTCDay() === 0 || day.getUTCDay() === 6
      const growth = 0.6 + (1 - back / DAYS) * 0.8
      const howMany = Math.floor(roll() * (weekend ? 2 : 4) * growth)

      const sessions = Math.round((8 + roll() * 22) * growth)
      for (let visit = 0; visit < sessions; visit++) {
        const session = `seed-${back}-${visit}-${Math.floor(roll() * 1e6)}`
        const at = new Date(day)
        at.setUTCHours(7 + Math.floor(roll() * 15), Math.floor(roll() * 60), 0, 0)
        const product = catalog[Math.floor(roll() * catalog.length)]
        const userId = roll() < 0.35 ? people[Math.floor(roll() * people.length)] : null

        events.push({ name: 'view', session, path: roll() < 0.5 ? '/' : '/shop', productId: null, at, userId })
        const depth = roll()
        if (depth < 0.42) {
          events.push({ name: 'view', session, path: `/products/${product.slug}`, productId: null, at, userId })
          events.push({
            name: 'product_view',
            session,
            path: `/products/${product.slug}`,
            productId: product.id,
            at,
            userId,
          })
        }
        if (depth < 0.16)
          events.push({
            name: 'add_to_cart',
            session,
            path: `/products/${product.slug}`,
            productId: product.id,
            at,
            userId,
          })
        if (depth < 0.08)
          events.push({ name: 'checkout_started', session, path: '/checkout', productId: null, at, userId })
      }

      for (let n = 0; n < howMany; n++) {
        const placed = new Date(day)
        placed.setUTCHours(8 + Math.floor(roll() * 12), Math.floor(roll() * 60), 0, 0)

        const lines = 1 + Math.floor(roll() * 3)
        const picked = new Map<number, number>()
        for (let line = 0; line < lines; line++) {
          const product = catalog[Math.floor(roll() * catalog.length)]
          picked.set(product.id, (picked.get(product.id) ?? 0) + 1 + Math.floor(roll() * 2))
        }

        const items = [...picked].map(([id, quantity]) => ({
          product: catalog.find((row) => row.id === id)!,
          quantity,
        }))
        const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

        const fate = roll()
        const status = fate < 0.86 ? 'paid' : fate < 0.95 ? 'pending' : 'canceled'

        const { rows } = await client.query<{ id: number }>(
          `INSERT INTO orders (user_id, status, total_cents, created_at, paid_at)
           VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [
            people[Math.floor(roll() * people.length)],
            status,
            total,
            placed,
            status === 'paid' ? new Date(placed.getTime() + 60_000) : null,
          ],
        )

        for (const item of items) {
          await client.query(
            `INSERT INTO order_items (order_id, product_id, product_name, product_slug, image_url, quantity, unit_price_cents)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              rows[0].id,
              item.product.id,
              item.product.name,
              item.product.slug,
              item.product.image_url,
              item.quantity,
              item.product.price,
            ],
          )
        }
        if (status === 'paid') {
          const session = `seed-buy-${back}-${n}`
          const buyer = rows[0]
            ? await client.query<{ user_id: string }>('SELECT user_id FROM orders WHERE id = $1', [rows[0].id])
            : null
          const userId = buyer?.rows[0]?.user_id ?? null
          for (const [name, path] of [
            ['view', '/shop'],
            ['product_view', `/products/${items[0].product.slug}`],
            ['add_to_cart', `/products/${items[0].product.slug}`],
            ['checkout_started', '/checkout'],
            ['purchase', '/checkout/success'],
          ] as const) {
            events.push({
              name,
              session,
              path,
              productId:
                name === 'view' || name === 'checkout_started' || name === 'purchase' ? null : items[0].product.id,
              at: placed,
              userId,
            })
          }
        }
        written++
      }
    }

    await client.query(
      `INSERT INTO events (name, session, path, product_id, created_at, user_id)
       SELECT * FROM unnest($1::text[], $2::text[], $3::text[], $4::int[], $5::timestamptz[], $6::text[])`,
      [
        events.map((e) => e.name),
        events.map((e) => e.session),
        events.map((e) => e.path),
        events.map((e) => e.productId),
        events.map((e) => e.at),
        events.map((e) => e.userId),
      ],
    )

    await client.query('COMMIT')
    return written
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
