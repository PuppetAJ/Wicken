import 'server-only'
import { pool } from '../pool.ts'
import { withoutNulls } from '../text.ts'

type SubscriberSource = 'footer' | 'landing'

export async function subscribe(email: string, source: SubscriberSource): Promise<boolean> {
  const { rowCount } = await pool.query(
    'INSERT INTO subscribers (email, source) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING',
    [withoutNulls(email).toLowerCase(), source],
  )
  return rowCount === 1
}

export async function countSubscribers(): Promise<number> {
  const { rows } = await pool.query<{ count: string }>('SELECT count(*) AS count FROM subscribers')
  return Number(rows[0].count)
}
