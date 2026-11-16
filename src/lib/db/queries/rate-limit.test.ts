import assert from 'node:assert/strict'
import { after, beforeEach, describe, it } from 'node:test'
import { pool } from '../pool.ts'
import { resetDatabase } from '../test-support.ts'
import { consume } from './rate-limit.ts'

after(() => pool.end())
beforeEach(resetDatabase)

describe('rate limiting', () => {
  it('allows up to the limit and refuses the next attempt', async () => {
    for (let attempt = 1; attempt <= 3; attempt++) {
      const { allowed } = await consume('action:test:1.1.1.1', { window: 60, max: 3 })
      assert.equal(allowed, true, `attempt ${attempt} should be allowed`)
    }

    const fourth = await consume('action:test:1.1.1.1', { window: 60, max: 3 })
    assert.equal(fourth.allowed, false)
    assert.ok(fourth.retryAfter > 0, 'tells the caller how long to wait')
  })

  it('keeps one address from spending another address budget', async () => {
    await consume('action:test:1.1.1.1', { window: 60, max: 1 })
    const other = await consume('action:test:2.2.2.2', { window: 60, max: 1 })
    assert.equal(other.allowed, true)
  })

  it('starts a fresh window once the old one has passed', async () => {
    await consume('action:test:1.1.1.1', { window: 60, max: 1 })
    assert.equal((await consume('action:test:1.1.1.1', { window: 60, max: 1 })).allowed, false)

    await pool.query('UPDATE rate_limits SET last_request = last_request - 61000')

    assert.equal((await consume('action:test:1.1.1.1', { window: 60, max: 1 })).allowed, true)
  })

  it('counts concurrent attempts individually', async () => {
    const results = await Promise.all(
      Array.from({ length: 10 }, () => consume('action:burst:1.1.1.1', { window: 60, max: 4 })),
    )
    assert.equal(results.filter((r) => r.allowed).length, 4, 'a read-then-write limiter would let all ten through')
  })
})
