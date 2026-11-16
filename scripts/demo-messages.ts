import { pool } from '../src/lib/db/pool.ts'
import { people } from './demo-people.ts'

const notes: [number, string, boolean][] = [
  [
    0,
    'The handle on my teapot has a hairline crack after two years. Is that something you would take a look at?',
    false,
  ],
  [
    3,
    'Do you ever take commissions? I am after a side table in elm, roughly two feet square, to fit a very specific alcove.',
    false,
  ],
  [7, 'Ordered last Thursday and I have not had a shipping confirmation. Order is under this email address.', false],
  [
    5,
    'Is the workshop open this Saturday? I would like to see the dinner plates before committing to eight of them.',
    true,
  ],
  [
    9,
    'Just to say the bowls arrived beautifully packed and my mother cried. Not a question, sorry, I just wanted somebody to know.',
    true,
  ],
]

export async function seedDemoMessages(): Promise<number> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('DELETE FROM messages')

    for (const [index, [who, body, answered]] of notes.entries()) {
      const [name, email] = people[who]
      await client.query(
        `INSERT INTO messages (name, email, body, answered, created_at)
         VALUES ($1, $2, $3, $4, now() - ($5 || ' days')::interval)`,
        [name, email, body, answered, index * 3 + 1],
      )
    }

    await client.query('COMMIT')
    return notes.length
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
