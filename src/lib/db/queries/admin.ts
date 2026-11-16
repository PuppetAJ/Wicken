import 'server-only'
import { pool } from '../pool.ts'
import { orderItemsJson } from './orders.ts'
import { paged, perPage, withTotal, type Page } from './paging.ts'
import { searchTerm } from '../text.ts'
import type { Category, Order, OrderStatus, Product } from '../types.ts'

type ProductFilters = { q?: string; category?: Category; stock?: 'low' | 'out'; page?: number }

export async function listAdminProducts({ q, category, stock, page = 1 }: ProductFilters = {}): Promise<Page<Product>> {
  const { rows } = await pool.query<Product & { total_rows: string }>(
    `SELECT *, ${withTotal} FROM products
      WHERE ($1::text IS NULL OR name ILIKE '%' || $1 || '%' OR slug ILIKE '%' || $1 || '%')
        AND ($2::text IS NULL OR category = $2)
        AND ($3::text IS NULL
             OR ($3 = 'low' AND stock_quantity BETWEEN 1 AND 3)
             OR ($3 = 'out' AND stock_quantity = 0))
      ORDER BY name
      LIMIT $4 OFFSET $5`,
    [q ? searchTerm(q) : null, category ?? null, stock ?? null, perPage, (page - 1) * perPage],
  )
  return paged<Product>(rows)
}

type ProductEdit = {
  price_cents: number
  sale_price_cents: number | null
  stock_quantity: number
  is_featured: boolean
}

export async function updateProduct(id: number, edit: ProductEdit): Promise<Product | null> {
  const { rows } = await pool.query<Product>(
    `UPDATE products
        SET price_cents = $2, sale_price_cents = $3, stock_quantity = $4, is_featured = $5
      WHERE id = $1
      RETURNING *`,
    [id, edit.price_cents, edit.sale_price_cents, edit.stock_quantity, edit.is_featured],
  )
  return rows[0] ?? null
}

const orderWithItems = (extra = '') => `
  SELECT o.*, u.name AS customer_name, u.email AS customer_email${extra}, ${orderItemsJson}
  FROM orders o
  JOIN users u ON u.id = o.user_id
  LEFT JOIN order_items oi ON oi.order_id = o.id
`

type AdminOrder = Order & { customer_name: string; customer_email: string }

export const orderSorts = ['order', 'placed', 'status', 'items', 'total'] as const
export type OrderSort = (typeof orderSorts)[number]
export type SortDirection = 'asc' | 'desc'

export const orderSortDefaults: Record<OrderSort, SortDirection> = {
  order: 'desc',
  placed: 'desc',
  status: 'asc',
  items: 'desc',
  total: 'desc',
}

const orderSortColumns: Record<OrderSort, string> = {
  order: 'o.id',
  placed: 'o.created_at',
  status: 'o.status',
  items: 'COALESCE(sum(oi.quantity), 0)',
  total: 'o.total_cents',
}

type OrderFilters = { status?: OrderStatus; q?: string; page?: number; sort?: OrderSort; dir?: SortDirection }

export async function listAdminOrders({
  status,
  q,
  page = 1,
  sort = 'placed',
  dir = orderSortDefaults[sort],
}: OrderFilters = {}): Promise<Page<AdminOrder>> {
  const direction = dir === 'asc' ? 'ASC' : 'DESC'
  const { rows } = await pool.query<AdminOrder & { total_rows: string }>(
    `${orderWithItems(`, ${withTotal}`)}
      WHERE ($1::text IS NULL OR o.status = $1)
        AND ($2::text IS NULL OR u.name ILIKE '%' || $2 || '%' OR u.email ILIKE '%' || $2 || '%')
      GROUP BY o.id, u.name, u.email
      ORDER BY ${orderSortColumns[sort]} ${direction}, o.id DESC
      LIMIT $3 OFFSET $4`,
    [status ?? null, q ? searchTerm(q) : null, perPage, (page - 1) * perPage],
  )
  return paged<AdminOrder>(rows)
}

export async function getAdminOrder(id: number): Promise<AdminOrder | null> {
  const { rows } = await pool.query<AdminOrder>(`${orderWithItems()} WHERE o.id = $1 GROUP BY o.id, u.name, u.email`, [
    id,
  ])
  return rows[0] ?? null
}

export async function setOrderStatus(id: number, status: OrderStatus): Promise<AdminOrder | null> {
  await pool.query(
    `UPDATE orders SET status = $2, paid_at = CASE WHEN $2 = 'paid' THEN COALESCE(paid_at, now()) ELSE NULL END
      WHERE id = $1`,
    [id, status],
  )
  return getAdminOrder(id)
}

type Customer = {
  id: string
  name: string
  email: string
  created_at: Date
  orders: number
  spent_cents: number
  last_order: Date | null
}

export async function listCustomers(q?: string, page = 1): Promise<Page<Customer>> {
  const { rows } = await pool.query<Customer & { orders: string; spent_cents: string; total_rows: string }>(
    `SELECT u.id, u.name, u.email, u.created_at, ${withTotal},
            count(o.id) FILTER (WHERE o.status = 'paid') AS orders,
            COALESCE(sum(o.total_cents) FILTER (WHERE o.status = 'paid'), 0) AS spent_cents,
            max(o.created_at) AS last_order
       FROM users u
       LEFT JOIN orders o ON o.user_id = u.id
      WHERE ($1::text IS NULL OR u.name ILIKE '%' || $1 || '%' OR u.email ILIKE '%' || $1 || '%')
      GROUP BY u.id, u.name, u.email, u.created_at
      ORDER BY COALESCE(sum(o.total_cents) FILTER (WHERE o.status = 'paid'), 0) DESC, u.name
      LIMIT $2 OFFSET $3`,
    [q ? searchTerm(q) : null, perPage, (page - 1) * perPage],
  )
  return paged<Customer>(
    rows.map((row) => ({ ...row, orders: Number(row.orders), spent_cents: Number(row.spent_cents) })),
  )
}

type AdminReview = {
  user_id: string
  author: string
  product_id: number
  product_name: string
  product_slug: string
  rating: number
  body: string
  created_at: Date
}

export async function listAllReviews(q?: string, page = 1): Promise<Page<AdminReview>> {
  const { rows } = await pool.query<AdminReview & { total_rows: string }>(
    `SELECT r.user_id, u.name AS author, r.product_id, p.name AS product_name, p.slug AS product_slug,
            r.rating, r.body, r.created_at, ${withTotal}
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       JOIN products p ON p.id = r.product_id
      WHERE ($1::text IS NULL OR r.body ILIKE '%' || $1 || '%' OR u.name ILIKE '%' || $1 || '%'
             OR p.name ILIKE '%' || $1 || '%')
      ORDER BY r.created_at DESC, r.user_id
      LIMIT $2 OFFSET $3`,
    [q ? searchTerm(q) : null, perPage, (page - 1) * perPage],
  )
  return paged<AdminReview>(rows)
}

export async function deleteReview(userId: string, productId: number): Promise<void> {
  await pool.query('DELETE FROM reviews WHERE user_id = $1 AND product_id = $2', [userId, productId])
}
