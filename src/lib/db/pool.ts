import 'server-only'
import { Pool } from 'pg'
import { env } from '../env.ts'

// Next re-evaluates modules on every edit in dev, so a plain `new Pool()` would leak one per edit.
const globalForPool = globalThis as { wickenPool?: Pool }

export const pool =
  globalForPool.wickenPool ?? new Pool({ connectionString: env.DATABASE_URL, statement_timeout: 10_000 })

if (env.NODE_ENV !== 'production') globalForPool.wickenPool = pool

export async function transaction<T>(fn: (client: import('pg').PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
