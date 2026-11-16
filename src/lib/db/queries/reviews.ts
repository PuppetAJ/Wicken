import 'server-only'
import { pool } from '../pool.ts'
import type { ReviewSort } from '../types.ts'

export type Review = {
  user_id: string
  author: string
  rating: number
  body: string
  created_at: Date
  helpful: number
  unhelpful: number
  own_vote: boolean | null
}

type ReviewSummary = { count: number; average: number }

const net = 'count(*) FILTER (WHERE v.helpful) - count(*) FILTER (WHERE NOT v.helpful)'

const reviewOrder: Record<ReviewSort, string> = {
  helpful: `${net} DESC, r.created_at DESC`,
  recent: 'r.created_at DESC',
  highest: 'r.rating DESC, r.created_at DESC',
  lowest: 'r.rating ASC, r.created_at DESC',
}

type Row = Omit<Review, 'helpful' | 'unhelpful'> & { helpful: string; unhelpful: string }

export async function listReviews(
  productId: number,
  { sort = 'helpful', viewerId }: { sort?: ReviewSort; viewerId?: string } = {},
): Promise<Review[]> {
  const { rows } = await pool.query<Row>(
    `SELECT r.user_id, u.name AS author, r.rating, r.body, r.created_at,
            count(*) FILTER (WHERE v.helpful) AS helpful,
            count(*) FILTER (WHERE NOT v.helpful) AS unhelpful,
            mine.helpful AS own_vote
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       LEFT JOIN review_votes v ON v.review_user_id = r.user_id AND v.product_id = r.product_id
       LEFT JOIN review_votes mine
              ON mine.review_user_id = r.user_id AND mine.product_id = r.product_id AND mine.voter_id = $2
      WHERE r.product_id = $1
      GROUP BY r.user_id, u.name, r.rating, r.body, r.created_at, mine.helpful
      ORDER BY ${reviewOrder[sort]}`,
    [productId, viewerId ?? null],
  )
  return rows.map((row) => ({ ...row, helpful: Number(row.helpful), unhelpful: Number(row.unhelpful) }))
}

export async function summarizeReviews(productId: number): Promise<ReviewSummary> {
  const { rows } = await pool.query<{ count: string; average: string | null }>(
    'SELECT count(*) AS count, avg(rating) AS average FROM reviews WHERE product_id = $1',
    [productId],
  )
  return { count: Number(rows[0].count), average: Number(rows[0].average ?? 0) }
}

export async function saveReview(userId: string, productId: number, rating: number, body: string): Promise<void> {
  await pool.query(
    `INSERT INTO reviews (user_id, product_id, rating, body) VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, product_id) DO UPDATE SET rating = EXCLUDED.rating, body = EXCLUDED.body, created_at = now()`,
    [userId, productId, rating, body],
  )
}

export async function getOwnReview(
  userId: string,
  productId: number,
): Promise<{ rating: number; body: string } | null> {
  const { rows } = await pool.query<{ rating: number; body: string }>(
    'SELECT rating, body FROM reviews WHERE user_id = $1 AND product_id = $2',
    [userId, productId],
  )
  return rows[0] ?? null
}

export async function voteOnReview(
  voterId: string,
  reviewUserId: string,
  productId: number,
  helpful: boolean | null,
): Promise<void> {
  if (helpful === null) {
    await pool.query('DELETE FROM review_votes WHERE voter_id = $1 AND review_user_id = $2 AND product_id = $3', [
      voterId,
      reviewUserId,
      productId,
    ])
    return
  }

  await pool.query(
    `INSERT INTO review_votes (voter_id, review_user_id, product_id, helpful) VALUES ($1, $2, $3, $4)
     ON CONFLICT (voter_id, review_user_id, product_id) DO UPDATE SET helpful = EXCLUDED.helpful`,
    [voterId, reviewUserId, productId, helpful],
  )
}

export async function summarizeMany(productIds: number[]): Promise<Map<number, ReviewSummary>> {
  if (productIds.length === 0) return new Map()

  const { rows } = await pool.query<{ product_id: number; count: string; average: string }>(
    `SELECT product_id, count(*) AS count, avg(rating) AS average
     FROM reviews WHERE product_id = ANY($1) GROUP BY product_id`,
    [productIds],
  )
  return new Map(rows.map((row) => [row.product_id, { count: Number(row.count), average: Number(row.average) }]))
}

type Testimonial = {
  author: string
  body: string
  rating: number
  product_name: string
  product_slug: string
  image_url: string | null
}

export async function listTestimonials(limit = 3): Promise<Testimonial[]> {
  const { rows } = await pool.query<Testimonial>(
    `SELECT * FROM (
       SELECT DISTINCT ON (r.body) u.name AS author, r.body, r.rating,
              p.name AS product_name, p.slug AS product_slug, p.image_url
         FROM reviews r
         JOIN users u ON u.id = r.user_id
         JOIN products p ON p.id = r.product_id
        WHERE r.rating = 5 AND length(r.body) BETWEEN 70 AND 220
        ORDER BY r.body, r.product_id
     ) best
     ORDER BY length(best.body) DESC
     LIMIT $1`,
    [limit],
  )
  return rows
}
