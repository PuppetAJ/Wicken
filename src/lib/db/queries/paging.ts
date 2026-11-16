import 'server-only'

export const perPage = 20

export type Page<T> = { rows: T[]; total: number }

export const withTotal = 'count(*) OVER () AS total_rows'

export function paged<T>(rows: (T & { total_rows?: string })[]): Page<T> {
  return { rows: rows as T[], total: Number(rows[0]?.total_rows ?? 0) }
}
