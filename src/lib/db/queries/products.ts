import 'server-only'
import { pool } from '../pool.ts'
import type { Category, Product } from '../types.ts'
import { searchTerm } from '../text.ts'

export type ProductSort = 'newest' | 'price-asc' | 'price-desc' | 'name'

const orderBy: Record<ProductSort, string> = {
  newest: 'created_at DESC, id DESC',
  'price-asc': 'price_cents ASC, id ASC',
  'price-desc': 'price_cents DESC, id ASC',
  name: 'name ASC, id ASC',
}

export async function listProducts({
  category,
  search,
  materials,
  colors,
  priceRanges,
  sort = 'newest',
}: {
  category?: Category
  search?: string
  materials?: string[]
  colors?: string[]
  priceRanges?: [number, number | null][]
  sort?: ProductSort
} = {}): Promise<Product[]> {
  const { rows } = await pool.query<Product>(
    `SELECT * FROM products
     WHERE ($1::text IS NULL OR category = $1)
       AND ($2::text IS NULL OR name ILIKE '%' || $2 || '%' OR description ILIKE '%' || $2 || '%')
       AND ($3::text[] IS NULL OR material_tags && $3)
       AND ($4::text[] IS NULL OR color = ANY($4))
       AND ($5::int[] IS NULL OR EXISTS (
         SELECT 1 FROM unnest($5::int[], $6::int[]) AS band(lo, hi)
         WHERE COALESCE(sale_price_cents, price_cents) >= band.lo
           AND (band.hi IS NULL OR COALESCE(sale_price_cents, price_cents) < band.hi)
       ))
     ORDER BY ${orderBy[sort]}`,
    [
      category ?? null,
      search ? searchTerm(search) : null,
      materials?.length ? materials : null,
      colors?.length ? colors : null,
      priceRanges?.length ? priceRanges.map(([lo]) => lo) : null,
      priceRanges?.length ? priceRanges.map(([, hi]) => hi) : null,
    ],
  )
  return rows
}

export async function listFacets(): Promise<{ materials: string[]; colors: string[] }> {
  const [materials, colors] = await Promise.all([
    pool.query<{ value: string }>('SELECT unnest(material_tags) AS value FROM products GROUP BY value ORDER BY value'),
    pool.query<{ value: string }>(
      'SELECT color AS value FROM products WHERE color IS NOT NULL GROUP BY color ORDER BY count(*) DESC, value',
    ),
  ])
  return { materials: materials.rows.map((row) => row.value), colors: colors.rows.map((row) => row.value) }
}

export async function getProductById(id: number): Promise<Product | null> {
  const { rows } = await pool.query<Product>('SELECT * FROM products WHERE id = $1', [id])
  return rows[0] ?? null
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { rows } = await pool.query<Product>('SELECT * FROM products WHERE slug = $1', [slug])
  return rows[0] ?? null
}

export async function listFeaturedProducts(limit = 5): Promise<Product[]> {
  const { rows } = await pool.query<Product>(
    'SELECT * FROM products WHERE is_featured ORDER BY created_at DESC, id DESC LIMIT $1',
    [limit],
  )
  return rows
}

export async function listRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const { rows } = await pool.query<Product>(
    'SELECT * FROM products WHERE category = $1 AND id <> $2 ORDER BY random() LIMIT $3',
    [product.category, product.id, limit],
  )
  return rows
}

type CategoryCover = { category: Category; slug: string; count: number; image_url: string | null }

export async function listCategoryCovers(): Promise<CategoryCover[]> {
  const { rows } = await pool.query<CategoryCover & { count: string }>(
    `SELECT DISTINCT ON (category) category, slug, image_url,
            count(*) OVER (PARTITION BY category) AS count
       FROM products
      ORDER BY category, (stock_quantity > 0) DESC, price_cents DESC, id`,
  )
  return rows.map((row) => ({ ...row, count: Number(row.count) }))
}
