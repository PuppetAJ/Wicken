import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { safeNext } from './schemas.ts'

describe('safeNext', () => {
  it('keeps a path on this site', () => {
    assert.equal(safeNext('/cart'), '/cart')
    assert.equal(safeNext('/products/ash-dining-table?q=1'), '/products/ash-dining-table?q=1')
  })

  it('refuses anywhere off this site', () => {
    for (const hostile of ['https://evil.example', '//evil.example', 'javascript:alert(1)', 'evil.example']) {
      assert.equal(safeNext(hostile), '/', `${hostile} must not be followed`)
    }
  })

  it('falls back when there is nothing to read', () => {
    assert.equal(safeNext(undefined), '/')
    assert.equal(safeNext(['/a', '/b']), '/')
  })
})
