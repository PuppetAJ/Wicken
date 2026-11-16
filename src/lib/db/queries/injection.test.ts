import assert from 'node:assert/strict'
import { after, beforeEach, describe, it } from 'node:test'
import { pool } from '../pool.ts'
import { insertProduct, resetDatabase } from '../test-support.ts'
import { listProducts, type ProductSort } from './products.ts'
import { listAdminProducts, listAllReviews, listCustomers } from './admin.ts'

after(() => pool.end())
beforeEach(resetDatabase)

const payloads = [
  "'; DROP TABLE products; --",
  "' OR '1'='1",
  "') OR 1=1 --",
  "1; DELETE FROM products WHERE 't'='t",
  "\\'; DROP TABLE products; --",
  "%' --",
  "' UNION SELECT NULL, NULL, NULL --",
  "admin'--",
  "\u0000'; DROP TABLE products; --",
]

const survives = async () => (await pool.query<{ count: string }>('SELECT count(*) FROM products')).rows[0].count

describe('hostile input reaches the database as a value, never as SQL', () => {
  it('leaves the catalog standing whatever is typed into the search box', async () => {
    await insertProduct({ name: 'Ridge Mug' })
    await insertProduct({ name: 'Ash Plate' })

    for (const payload of payloads) {
      const found = await listProducts({ search: payload })
      assert.equal(found.length, 0, `${payload} should match nothing, not everything`)
      assert.equal(await survives(), '2', `${payload} should not have changed the table`)
    }
  })

  it('does the same through the admin lists', async () => {
    await insertProduct({ name: 'Ridge Mug' })

    for (const payload of payloads) {
      assert.equal((await listAdminProducts({ q: payload })).rows.length, 0)
      assert.equal((await listCustomers(payload)).rows.length, 0)
      assert.equal((await listAllReviews(payload)).rows.length, 0)
      assert.equal(await survives(), '1', `${payload} should not have changed the table`)
    }
  })

  it('treats a payload as text rather than a pattern', async () => {
    await insertProduct({ name: 'Ridge Mug' })
    await insertProduct({ name: 'Ash Plate' })
    assert.equal((await listProducts({ search: '%' })).length, 0, 'a wildcard is a literal percent sign')
    assert.equal((await listProducts({ search: '_' })).length, 0)
  })

  it('refuses a sort it does not recognize instead of splicing it in', async () => {
    await insertProduct({ name: 'Ridge Mug' })

    const hostile = ['newest; DROP TABLE products; --', 'constructor', '__proto__', 'toString', '']
    for (const sort of hostile) {
      const asIfUnchecked = sort as ProductSort
      const found = await listProducts({ sort: asIfUnchecked }).catch(() => 'refused' as const)
      assert.notEqual(found, undefined)
      assert.equal(await survives(), '1', `${sort} should not have changed the table`)
      if (found !== 'refused') assert.equal(found.length, 1, `${sort} should fall back to a real ordering`)
    }
  })
})
