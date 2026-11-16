import { betterAuth } from 'better-auth'
import { authOptions } from '../src/lib/auth/options.ts'
import { demoAccounts } from '../src/lib/auth/demo.ts'
import { pool } from '../src/lib/db/pool.ts'

const auth = betterAuth(authOptions)

export async function seedDemoUsers(): Promise<void> {
  const accounts = Object.values(demoAccounts)
  await pool.query('DELETE FROM users WHERE email = ANY($1)', [accounts.map((a) => a.email)])

  for (const account of accounts) {
    await auth.api.signUpEmail({ body: account })
  }

  await pool.query('DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE email = ANY($1))', [
    accounts.map((a) => a.email),
  ])
  await pool.query('UPDATE users SET role = $1 WHERE email = $2', ['admin', demoAccounts.admin.email])
}
