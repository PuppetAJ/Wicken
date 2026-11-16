import { z } from 'zod'

export const ranges = ['7', '30', '90'] as const
type Range = (typeof ranges)[number]

export const rangeLabels: Record<Range, string> = {
  '7': 'Last 7 days',
  '30': 'Last 30 days',
  '90': 'Last 90 days',
}

export const pageNumber = z.coerce.number().int().min(1).max(10000).default(1).catch(1)

export const adminListSearch = z.object({
  q: z.string().trim().min(1).max(100).optional().catch(undefined),
  page: pageNumber,
})

export function pageHref(path: string, filters: Record<string, string | undefined>, page: number): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value)
  if (page > 1) params.set('page', String(page))
  const query = params.toString()
  return query ? `${path}?${query}` : path
}

export function adminHref(path: string, filters: Record<string, string | undefined>): string {
  return pageHref(path, filters, 1)
}

export function sortHref<Key extends string>(
  path: string,
  filters: Record<string, string | undefined>,
  key: Key,
  active: { sort: Key; dir: 'asc' | 'desc' },
  defaults: Record<Key, 'asc' | 'desc'>,
): string {
  const dir = key === active.sort ? (active.dir === 'asc' ? 'desc' : 'asc') : defaults[key]
  return adminHref(path, { ...filters, sort: key, dir })
}

export const adminSearchSchema = z.object({
  range: z.enum(ranges).default('30').catch('30'),
})

export function windows(range: Range): { from: Date; to: Date; wasFrom: Date; wasTo: Date } {
  const days = Number(range)
  const to = new Date()
  to.setUTCHours(0, 0, 0, 0)
  to.setUTCDate(to.getUTCDate() + 1)

  const from = new Date(to)
  from.setUTCDate(from.getUTCDate() - days)
  const wasFrom = new Date(from)
  wasFrom.setUTCDate(wasFrom.getUTCDate() - days)

  return { from, to, wasFrom, wasTo: from }
}

export const productEdit = z.object({
  id: z.coerce.number().int().positive(),
  priceDollars: z.coerce.number().min(0).max(100000),
  // z.coerce.number() turns '' into 0, which made the product free, so empty becomes null first.
  salePriceDollars: z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? null : value),
    z.coerce.number().min(0).max(100000).nullable(),
  ),
  stock: z.coerce.number().int().min(0).max(9999),
  featured: z.union([z.literal('on'), z.literal(null), z.undefined()]).transform(Boolean),
})

export const orderStatusEdit = z.object({
  id: z.coerce.number().int().positive(),
  status: z.enum(['pending', 'paid', 'canceled']),
})

export const reviewTarget = z.object({
  userId: z.string().min(1).max(200),
  productId: z.coerce.number().int().positive(),
})

export const messageAnswered = z.object({
  id: z.coerce.number().int().positive(),
  answered: z.boolean(),
})
