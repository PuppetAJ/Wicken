import 'server-only'
import { pool } from '../pool.ts'
import { withoutNulls } from '../text.ts'

type Message = {
  id: number
  name: string
  email: string
  body: string
  user_id: string | null
  answered: boolean
  created_at: Date
}

export async function saveMessage(
  name: string,
  email: string,
  body: string,
  userId: string | null = null,
): Promise<void> {
  await pool.query('INSERT INTO messages (name, email, body, user_id) VALUES ($1, $2, $3, $4)', [
    withoutNulls(name),
    withoutNulls(email),
    withoutNulls(body),
    userId,
  ])
}

export async function listMessages(limit: number, offset: number): Promise<{ rows: Message[]; total: number }> {
  const { rows } = await pool.query<Message & { total_rows: string }>(
    `SELECT *, count(*) OVER () AS total_rows
       FROM messages
      ORDER BY answered, created_at DESC, id DESC
      LIMIT $1 OFFSET $2`,
    [limit, offset],
  )
  return { rows, total: Number(rows[0]?.total_rows ?? 0) }
}

export async function markAnswered(id: number, answered: boolean): Promise<void> {
  await pool.query('UPDATE messages SET answered = $2 WHERE id = $1', [id, answered])
}
