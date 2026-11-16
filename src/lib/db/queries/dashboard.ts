import 'server-only'
import { pool } from '../pool.ts'
import type { Category, Product } from '../types.ts'

type Totals = { revenue_cents: number; orders: number; average_cents: number; returning_rate: number }

type DashboardPoint = { day: string; revenue_cents: number; orders: number }

type TopSeller = {
  id: number
  name: string
  slug: string
  image_url: string | null
  sold: number
  revenue_cents: number
}

const paidWithin = (o: string) => `${o}.status = 'paid' AND ${o}.created_at >= $1 AND ${o}.created_at < $2`

export async function totalsBetween(from: Date, to: Date): Promise<Totals> {
  const { rows } = await pool.query<{ revenue: string | null; orders: string; buyers: string; repeat: string }>(
    `WITH paid AS (SELECT orders.user_id, orders.total_cents FROM orders WHERE ${paidWithin('orders')}),
          per_buyer AS (SELECT user_id, count(*) AS orders FROM paid GROUP BY user_id)
     SELECT (SELECT sum(total_cents) FROM paid) AS revenue,
            (SELECT count(*) FROM paid) AS orders,
            (SELECT count(*) FROM per_buyer) AS buyers,
            (SELECT count(*) FROM per_buyer WHERE orders > 1) AS repeat`,
    [from, to],
  )
  const revenue = Number(rows[0].revenue ?? 0)
  const orders = Number(rows[0].orders)
  const buyers = Number(rows[0].buyers)
  return {
    revenue_cents: revenue,
    orders,
    average_cents: orders > 0 ? Math.round(revenue / orders) : 0,
    returning_rate: buyers > 0 ? Number(rows[0].repeat) / buyers : 0,
  }
}

export async function revenueByDay(from: Date, to: Date): Promise<DashboardPoint[]> {
  const { rows } = await pool.query<{ day: string; revenue: string; orders: string }>(
    `SELECT to_char(days.day, 'YYYY-MM-DD') AS day,
            COALESCE(sum(o.total_cents), 0) AS revenue,
            count(o.id) AS orders
       FROM generate_series($1::date, $2::date - interval '1 day', interval '1 day') AS days(day)
       LEFT JOIN orders o ON o.created_at >= days.day AND o.created_at < days.day + interval '1 day'
                         AND o.status = 'paid'
      GROUP BY days.day ORDER BY days.day`,
    [from, to],
  )
  return rows.map((row) => ({ day: row.day, revenue_cents: Number(row.revenue), orders: Number(row.orders) }))
}

export async function topSellers(from: Date, to: Date, limit = 5): Promise<TopSeller[]> {
  const { rows } = await pool.query<TopSeller & { sold: string; revenue_cents: string }>(
    `SELECT p.id, p.name, p.slug, p.image_url,
            sum(oi.quantity) AS sold,
            sum(oi.quantity * oi.unit_price_cents) AS revenue_cents
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN products p ON p.id = oi.product_id
      WHERE ${paidWithin('o')}
      GROUP BY p.id, p.name, p.slug, p.image_url
      ORDER BY sum(oi.quantity * oi.unit_price_cents) DESC
      LIMIT $3`,
    [from, to, limit],
  )
  return rows.map((row) => ({ ...row, sold: Number(row.sold), revenue_cents: Number(row.revenue_cents) }))
}

type CategorySplit = { category: Category; units: number; revenue_cents: number }

export async function salesByCategory(from: Date, to: Date): Promise<CategorySplit[]> {
  const { rows } = await pool.query<{ category: Category; units: string; revenue_cents: string }>(
    `SELECT p.category, sum(oi.quantity) AS units, sum(oi.quantity * oi.unit_price_cents) AS revenue_cents
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN products p ON p.id = oi.product_id
      WHERE ${paidWithin('o')}
      GROUP BY p.category
      ORDER BY sum(oi.quantity * oi.unit_price_cents) DESC`,
    [from, to],
  )
  return rows.map((row) => ({ ...row, units: Number(row.units), revenue_cents: Number(row.revenue_cents) }))
}

export async function lowStock(threshold = 3, limit = 6): Promise<Product[]> {
  const { rows } = await pool.query<Product>(
    'SELECT * FROM products WHERE stock_quantity <= $1 ORDER BY stock_quantity, name LIMIT $2',
    [threshold, limit],
  )
  return rows
}
