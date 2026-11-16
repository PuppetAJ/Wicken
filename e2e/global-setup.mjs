import { Client } from 'pg'

export default async function globalSetup(config) {
  console.log(`against ${config.projects[0].use.baseURL}`)

  if (!process.env.DATABASE_URL) return
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  await client.query('DELETE FROM rate_limits')
  await client.end()
}
