import 'server-only'
import { pool } from '../pool.ts'
import type { Product } from '../types.ts'

export async function toggleFavorite(userId: string, productId: number): Promise<boolean> {
  const { rowCount } = await pool.query('DELETE FROM favorites WHERE user_id = $1 AND product_id = $2', [
    userId,
    productId,
  ])
  if (rowCount) return false

  await pool.query('INSERT INTO favorites (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [
    userId,
    productId,
  ])
  return true
}

export async function listFavoriteIds(userId: string): Promise<number[]> {
  const { rows } = await pool.query<{ product_id: number }>('SELECT product_id FROM favorites WHERE user_id = $1', [
    userId,
  ])
  return rows.map((row) => row.product_id)
}

export async function listFavorites(userId: string): Promise<Product[]> {
  const { rows } = await pool.query<Product>(
    `SELECT p.* FROM favorites f JOIN products p ON p.id = f.product_id
     WHERE f.user_id = $1 ORDER BY f.created_at DESC`,
    [userId],
  )
  return rows
}
