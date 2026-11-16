import 'server-only'
import { pool } from '../pool.ts'
import type { EventName } from '../types.ts'

export async function recordEvent(event: {
  name: EventName
  session: string
  path: string
  productId?: number | null
  userId?: string | null
}): Promise<void> {
  await pool.query('INSERT INTO events (name, session, path, product_id, user_id) VALUES ($1, $2, $3, $4, $5)', [
    event.name,
    event.session,
    event.path.slice(0, 512),
    event.productId ?? null,
    event.userId ?? null,
  ])
}

type Visitors = {
  signedIn: number
  returning: number
  bought: number
}

export async function visitorsBetween(from: Date, to: Date): Promise<Visitors> {
  const { rows } = await pool.query<{ signed_in: string; returning: string; bought: string }>(
    `WITH seen AS (
       SELECT DISTINCT user_id FROM events
        WHERE user_id IS NOT NULL AND created_at >= $1 AND created_at < $2
     )
     SELECT (SELECT count(*) FROM seen) AS signed_in,
            (SELECT count(*) FROM seen s
              WHERE EXISTS (SELECT 1 FROM events e
                             WHERE e.user_id = s.user_id AND e.created_at < $1)) AS returning,
            (SELECT count(*) FROM seen s
              WHERE EXISTS (SELECT 1 FROM events e
                             WHERE e.user_id = s.user_id AND e.name = 'purchase'
                               AND e.created_at >= $1 AND e.created_at < $2)) AS bought`,
    [from, to],
  )
  const row = rows[0]
  return { signedIn: Number(row.signed_in), returning: Number(row.returning), bought: Number(row.bought) }
}

export type Funnel = {
  sessions: number
  product_views: number
  carts: number
  checkouts: number
  purchases: number
}

export async function funnelBetween(from: Date, to: Date): Promise<Funnel> {
  const { rows } = await pool.query<Record<keyof Funnel, string>>(
    `SELECT count(DISTINCT session) FILTER (WHERE name = 'view') AS sessions,
            count(DISTINCT session) FILTER (WHERE name = 'product_view') AS product_views,
            count(DISTINCT session) FILTER (WHERE name = 'add_to_cart') AS carts,
            count(DISTINCT session) FILTER (WHERE name = 'checkout_started') AS checkouts,
            count(DISTINCT session) FILTER (WHERE name = 'purchase') AS purchases
       FROM events WHERE created_at >= $1 AND created_at < $2`,
    [from, to],
  )
  const row = rows[0]
  return {
    sessions: Number(row.sessions),
    product_views: Number(row.product_views),
    carts: Number(row.carts),
    checkouts: Number(row.checkouts),
    purchases: Number(row.purchases),
  }
}

type SessionPoint = { day: string; sessions: number }

export async function sessionsByDay(from: Date, to: Date): Promise<SessionPoint[]> {
  const { rows } = await pool.query<{ day: string; sessions: string }>(
    `SELECT to_char(days.day, 'YYYY-MM-DD') AS day, count(DISTINCT e.session) AS sessions
       FROM generate_series($1::date, $2::date - interval '1 day', interval '1 day') AS days(day)
       LEFT JOIN events e ON e.created_at >= days.day AND e.created_at < days.day + interval '1 day'
                         AND e.name = 'view'
      GROUP BY days.day ORDER BY days.day`,
    [from, to],
  )
  return rows.map((row) => ({ day: row.day, sessions: Number(row.sessions) }))
}
