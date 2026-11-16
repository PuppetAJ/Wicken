import { pool } from '../src/lib/db/pool.ts'
import { ensurePeople, reviewerCount } from './demo-people.ts'

const lines: [number, string][] = [
  [
    5,
    'Better in person than in the photographs. The glaze pools slightly at the foot, which I did not expect and now like a lot.',
  ],
  [5, 'Third piece I have bought from here. The weight is the thing. It feels like it will outlast me.'],
  [4, 'Lovely object, slightly smaller than I pictured. That is on me for not reading the dimensions properly.'],
  [4, 'Arrived well packed in molded paper, no plastic anywhere. Took two weeks rather than the one I expected.'],
  [5, 'Bought as a gift and then could not part with it. Ordering a second.'],
  [
    3,
    'The making is genuinely good. The color is a touch grayer than it looks on screen, so be warned if you are matching something.',
  ],
  [5, 'Has lived on the table for six months and still looks new. No crazing, no staining from tea.'],
  [4, 'Handsome and solid. The oil finish needs redoing sooner than I would like, but that is oil for you.'],
  [
    5,
    'Ordered on a Sunday, packed and away by Tuesday, and the note inside was handwritten. Small things, but I noticed.',
  ],
  [4, 'Does exactly what I wanted it to and nothing more, which is the whole point. No notes.'],
  [5, 'I have washed this more times than I can count and it has not dulled. Whatever they are doing is working.'],
  [
    2,
    'Mine turned up with a chip on the underside. They replaced it without arguing, so two stars for the first one and no complaints about the second.',
  ],
  [5, 'Bought one, then another for my sister, then a third because the second never made it out of my kitchen.'],
  [3, 'Perfectly nice, but I would have liked a second photograph before ordering. The proportions surprised me.'],
  [4, 'Heavier than it looks in the listing, in a good way. It does not slide about on the counter.'],
  [5, 'Two years in and the only mark on it is one I put there myself. It has aged exactly as they said it would.'],
]

export async function seedDemoReviews(): Promise<number> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const ids = (await ensurePeople(client)).slice(0, reviewerCount)

    const { rows: products } = await client.query<{ id: number }>('SELECT id FROM products ORDER BY id')
    await client.query('DELETE FROM reviews WHERE user_id = ANY($1)', [ids])

    let written = 0
    for (const [index, product] of products.entries()) {
      const howMany = [3, 0, 7, 4, 1, 0, 2, 1][index % 8]
      for (let n = 0; n < howMany; n++) {
        const [rating, body] = lines[(index * 3 + n) % lines.length]
        await client.query(
          `INSERT INTO reviews (user_id, product_id, rating, body, created_at)
           VALUES ($1, $2, $3, $4, now() - ($5 || ' days')::interval)
           ON CONFLICT DO NOTHING`,
          [ids[n % ids.length], product.id, rating, body, (index * 7 + n * 11) % 180],
        )
        written++
      }
    }

    await client.query('DELETE FROM review_votes WHERE voter_id = ANY($1)', [ids])
    const { rows: seeded } = await client.query<{ user_id: string; product_id: number }>(
      'SELECT user_id, product_id FROM reviews WHERE user_id = ANY($1) ORDER BY product_id, user_id',
      [ids],
    )
    for (const [index, review] of seeded.entries()) {
      for (const [offset, voter] of ids.entries()) {
        if (voter === review.user_id) continue
        const roll = (index * 5 + offset * 3) % 7
        if (roll > 3) continue
        await client.query(
          `INSERT INTO review_votes (voter_id, review_user_id, product_id, helpful) VALUES ($1, $2, $3, $4)
           ON CONFLICT DO NOTHING`,
          [voter, review.user_id, review.product_id, roll !== 3],
        )
      }
    }

    await client.query('COMMIT')
    return written
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
