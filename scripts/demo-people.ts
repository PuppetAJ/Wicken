import type { PoolClient } from 'pg'

export const people = [
  ['Marta Ellison', 'marta.ellison@wicken.test'],
  ['Joseph Ndiaye', 'joseph.ndiaye@wicken.test'],
  ['Priya Raman', 'priya.raman@wicken.test'],
  ['Tom Whitlock', 'tom.whitlock@wicken.test'],
  ['Ana Beltrán', 'ana.beltran@wicken.test'],
  ['Ruth Kowalski', 'ruth.kowalski@wicken.test'],
  ['Desmond Achebe', 'desmond.achebe@wicken.test'],
  ['Hannah Vogel', 'hannah.vogel@wicken.test'],
  ['Elena Moreau', 'elena.moreau@wicken.test'],
  ['Samuel Okafor', 'samuel.okafor@wicken.test'],
  ['Freya Lindqvist', 'freya.lindqvist@wicken.test'],
  ['Idris Rahman', 'idris.rahman@wicken.test'],
] as const

export const reviewerCount = 8

export async function ensurePeople(client: PoolClient): Promise<string[]> {
  const ids: string[] = []
  for (const [name, email] of people) {
    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO users (id, name, email, email_verified)
       VALUES (encode(sha256($1::bytea), 'hex'), $2, $1, true)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [email, name],
    )
    ids.push(rows[0].id)
  }
  return ids
}

export function rolls(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
