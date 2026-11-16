import { execFileSync } from 'node:child_process'
import { Client } from 'pg'

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL is not set')

const client = new Client({ connectionString: url })
await client.connect()
const { rows } = await client.query<{ count: string }>('SELECT count(*) AS count FROM products')
await client.end()

if (Number(rows[0].count) > 0) {
  console.log(`${rows[0].count} products already; leaving the catalog alone`)
} else {
  console.log('No products yet, seeding')
  const { APP_DATABASE_URL: _, ...owner } = process.env
  execFileSync('pnpm', ['db:seed'], { stdio: 'inherit', env: owner })
}
