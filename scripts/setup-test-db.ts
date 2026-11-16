import { execFileSync } from 'node:child_process'
import { Client } from 'pg'

const url = process.env.TEST_DATABASE_URL
if (!url) throw new Error('TEST_DATABASE_URL is not set')

const parsed = new URL(url)
const database = parsed.pathname.slice(1)
if (!database.endsWith('_test')) throw new Error(`Refusing to use ${database}: a test database must end in _test`)

const admin = new Client({ connectionString: new URL('/postgres', parsed).toString() })
await admin.connect()
const { rows } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [database])
if (rows.length === 0) await admin.query(`CREATE DATABASE "${database}"`)
await admin.end()

execFileSync('node_modules/.bin/node-pg-migrate', ['up', '-m', 'migrations'], {
  env: { ...process.env, DATABASE_URL: url },
  stdio: 'ignore',
})
