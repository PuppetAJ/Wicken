import { pool } from '../src/lib/db/pool.ts'
import { people } from './demo-people.ts'

const signups: [number, 'footer' | 'landing'][] = [
  [1, 'footer'],
  [2, 'landing'],
  [4, 'footer'],
  [6, 'footer'],
  [8, 'landing'],
  [10, 'footer'],
]

export async function seedDemoSubscribers(): Promise<number> {
  await pool.query('DELETE FROM subscribers')
  for (const [index, [who, source]] of signups.entries()) {
    await pool.query(
      `INSERT INTO subscribers (email, source, created_at) VALUES ($1, $2, now() - ($3 || ' days')::interval)`,
      [people[who][1], source, index * 9 + 2],
    )
  }
  return signups.length
}
