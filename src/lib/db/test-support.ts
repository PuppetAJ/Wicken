import { pool } from './pool.ts'

export async function resetDatabase(): Promise<void> {
  await pool.query(
    'TRUNCATE order_items, orders, cart_items, carts, favorites, reviews, products, users, rate_limits RESTART IDENTITY CASCADE',
  )
}

export async function insertUser(id: string, role = 'customer'): Promise<string> {
  await pool.query('INSERT INTO users (id, name, email, role) VALUES ($1, $2, $3, $4)', [
    id,
    `Test ${id}`,
    `${id}@example.test`,
    role,
  ])
  return id
}

type ProductOverrides = Partial<{
  slug: string
  name: string
  description: string
  category: string
  price_cents: number
  stock_quantity: number
  is_featured: boolean
}>

export async function insertProduct(overrides: ProductOverrides = {}): Promise<number> {
  const p = {
    slug: `product-${Math.random().toString(36).slice(2, 10)}`,
    name: 'Test Product',
    description: 'A product used by the tests.',
    category: 'tableware',
    price_cents: 1000,
    stock_quantity: 10,
    is_featured: false,
    ...overrides,
  }
  const { rows } = await pool.query<{ id: number }>(
    `INSERT INTO products (slug, name, description, category, price_cents, stock_quantity, is_featured)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [p.slug, p.name, p.description, p.category, p.price_cents, p.stock_quantity, p.is_featured],
  )
  return rows[0].id
}
