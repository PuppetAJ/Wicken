import 'server-only'
import type { PoolClient } from 'pg'
import { pool } from '../pool.ts'
import type { CartItem } from '../types.ts'

export async function createCart(): Promise<string> {
  const { rows } = await pool.query<{ id: string }>('INSERT INTO carts DEFAULT VALUES RETURNING id')
  return rows[0].id
}

export async function createCartForUser(userId: string): Promise<string> {
  const { rows } = await pool.query<{ id: string }>('INSERT INTO carts (user_id) VALUES ($1) RETURNING id', [userId])
  return rows[0].id
}

export async function isGuestCart(cartId: string): Promise<boolean> {
  const { rows } = await pool.query('SELECT 1 FROM carts WHERE id = $1 AND user_id IS NULL', [cartId])
  return rows.length > 0
}

export async function countCartItems(cartId: string): Promise<number> {
  const { rows } = await pool.query<{ total: string | null }>(
    'SELECT SUM(quantity)::int AS total FROM cart_items WHERE cart_id = $1',
    [cartId],
  )
  return Number(rows[0]?.total ?? 0)
}

export async function cartExists(cartId: string): Promise<boolean> {
  const { rows } = await pool.query('SELECT 1 FROM carts WHERE id = $1', [cartId])
  return rows.length > 0
}

export async function getCartItems(cartId: string): Promise<CartItem[]> {
  const { rows } = await pool.query<CartItem>(
    `SELECT p.id AS product_id, p.slug, p.name, p.category, p.image_url,
            COALESCE(p.sale_price_cents, p.price_cents) AS unit_price_cents, p.stock_quantity, ci.quantity
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.cart_id = $1
     ORDER BY p.name`,
    [cartId],
  )
  return rows
}

export async function addCartItem(cartId: string, productId: number, quantity: number): Promise<void> {
  await pool.query(
    `INSERT INTO cart_items (cart_id, product_id, quantity)
     SELECT $1, p.id, LEAST($3, p.stock_quantity)
     FROM products p
     WHERE p.id = $2 AND p.stock_quantity > 0
     ON CONFLICT (cart_id, product_id) DO UPDATE
       SET quantity = LEAST(
         cart_items.quantity + EXCLUDED.quantity,
         (SELECT stock_quantity FROM products WHERE id = EXCLUDED.product_id)
       )`,
    [cartId, productId, quantity],
  )
}

export async function setCartItemQuantity(cartId: string, productId: number, quantity: number): Promise<void> {
  if (quantity <= 0) return removeCartItem(cartId, productId)
  await pool.query(
    `UPDATE cart_items ci
     SET quantity = LEAST($3, p.stock_quantity)
     FROM products p
     WHERE p.id = ci.product_id AND ci.cart_id = $1 AND ci.product_id = $2`,
    [cartId, productId, quantity],
  )
}

export async function removeCartItem(cartId: string, productId: number): Promise<void> {
  await pool.query('DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2', [cartId, productId])
}

export async function clearCart(cartId: string, client: PoolClient | typeof pool = pool): Promise<void> {
  await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId])
}

export async function getCartIdForUser(userId: string): Promise<string | null> {
  const { rows } = await pool.query<{ id: string }>('SELECT id FROM carts WHERE user_id = $1', [userId])
  return rows[0]?.id ?? null
}

export async function mergeGuestCart(guestCartId: string, userId: string): Promise<string> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const existing = await client.query<{ id: string }>('SELECT id FROM carts WHERE user_id = $1', [userId])

    if (existing.rows.length === 0) {
      await client.query('UPDATE carts SET user_id = $1 WHERE id = $2', [userId, guestCartId])
      await client.query('COMMIT')
      return guestCartId
    }

    const userCartId = existing.rows[0].id
    await client.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity)
       SELECT $1, gi.product_id, gi.quantity FROM cart_items gi WHERE gi.cart_id = $2
       ON CONFLICT (cart_id, product_id) DO UPDATE
         SET quantity = LEAST(
           cart_items.quantity + EXCLUDED.quantity,
           (SELECT stock_quantity FROM products WHERE id = EXCLUDED.product_id)
         )`,
      [userCartId, guestCartId],
    )
    await client.query('DELETE FROM carts WHERE id = $1', [guestCartId])
    await client.query('COMMIT')
    return userCartId
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
