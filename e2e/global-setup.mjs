import { Client } from 'pg'

export default async function globalSetup(config) {
  // Printed because the default is the dev server, and a suite run against the wrong one fails oddly.
  console.log(`against ${config.projects[0].use.baseURL}`)

  // The throttling checks spend the sign-in budget, so a rerun within the minute fails for that reason alone.
  if (!process.env.DATABASE_URL) return
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  await client.query('DELETE FROM rate_limits')
  await client.end()
}
