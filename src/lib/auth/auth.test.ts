import assert from 'node:assert/strict'
import { after, beforeEach, describe, it } from 'node:test'
import { betterAuth } from 'better-auth'
import { pool } from '../db/pool.ts'
import { resetDatabase } from '../db/test-support.ts'
import { authOptions } from './options.ts'

const auth = betterAuth(authOptions)

after(() => pool.end())
beforeEach(resetDatabase)

const shopper = { name: 'Test Shopper', email: 'test@example.com', password: 'a-long-enough-password' }

describe('authentication', () => {
  it('stores a hashed password against a credential account', async () => {
    await auth.api.signUpEmail({ body: shopper })

    const { rows } = await pool.query<{ provider_id: string; password: string }>(
      'SELECT provider_id, password FROM accounts',
    )
    assert.equal(rows.length, 1)
    assert.equal(rows[0].provider_id, 'credential')
    assert.notEqual(rows[0].password, shopper.password, 'the plain password must never reach the table')
  })

  it('refuses a wrong password', async () => {
    await auth.api.signUpEmail({ body: shopper })

    await assert.rejects(() => auth.api.signInEmail({ body: { email: shopper.email, password: 'wrong-password-x' } }))
  })

  it('refuses a password under the minimum length', async () => {
    await assert.rejects(() => auth.api.signUpEmail({ body: { ...shopper, password: 'short' } }))
  })

  it('refuses a second account on the same email', async () => {
    await auth.api.signUpEmail({ body: shopper })
    await assert.rejects(() => auth.api.signUpEmail({ body: shopper }))
  })

  it('never lets the sign-up body choose its own role', async () => {
    await auth.api.signUpEmail({ body: { ...shopper, role: 'admin' } as never })

    const { rows } = await pool.query<{ role: string }>('SELECT role FROM users')
    assert.equal(rows[0].role, 'customer')
  })

  it('issues a cookie that resolves back to the user', async () => {
    await auth.api.signUpEmail({ body: shopper })

    const response = await auth.api.signInEmail({
      body: { email: shopper.email, password: shopper.password },
      asResponse: true,
    })
    const cookie = response.headers
      .getSetCookie()
      .map((value) => value.split(';')[0])
      .join('; ')

    const session = await auth.api.getSession({ headers: new Headers({ cookie }) })
    assert.equal(session?.user.email, shopper.email)
    assert.equal(session?.user.role, 'customer')
  })

  it('takes a user and account in the shape the Google callback writes', async () => {
    const { internalAdapter } = await auth.$context
    const user = await internalAdapter.createUser(
      {
        name: 'Google Shopper',
        email: 'google@example.com',
        emailVerified: true,
        image: 'https://lh3.googleusercontent.com/a/photo',
      },
      { method: 'oauth', oauth: { providerId: 'google' } },
    )
    await internalAdapter.createAccount({
      userId: user.id,
      providerId: 'google',
      accountId: '104857206349813592654',
      accessToken: 'ya29.access',
      refreshToken: '1//refresh',
      idToken: 'eyJ.id.token',
      accessTokenExpiresAt: new Date('2026-09-23T00:00:00Z'),
      refreshTokenExpiresAt: undefined,
      scope: 'openid email profile',
    })

    const { rows } = await pool.query<{
      provider_id: string
      account_id: string
      scope: string
      password: string | null
      expires: Date
      image: string
      email_verified: boolean
      role: string
    }>(
      `SELECT a.provider_id, a.account_id, a.scope, a.password, a.access_token_expires_at AS expires,
              u.image, u.email_verified, u.role
       FROM accounts a JOIN users u ON u.id = a.user_id`,
    )
    assert.equal(rows.length, 1)
    assert.equal(rows[0].provider_id, 'google')
    assert.equal(rows[0].account_id, '104857206349813592654')
    assert.equal(rows[0].scope, 'openid email profile')
    assert.equal(rows[0].password, null)
    assert.equal(rows[0].expires.toISOString(), '2026-09-23T00:00:00.000Z')
    assert.equal(rows[0].image, 'https://lh3.googleusercontent.com/a/photo')
    assert.equal(rows[0].email_verified, true)
    assert.equal(rows[0].role, 'customer')
  })
})
