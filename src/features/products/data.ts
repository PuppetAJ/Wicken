import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import {
  getProductBySlug,
  listCategoryCovers,
  listFacets,
  listFeaturedProducts,
  listProducts,
  listRelatedProducts,
} from '@/lib/db/queries/products'
import type { Product } from '@/lib/db/types'
import { priceBandRanges, type ShopSearch } from './schemas'

export async function getCatalog({ category, sort, q, material, color, price }: ShopSearch): Promise<Product[]> {
  'use cache'
  cacheTag('products')
  if (q) cacheLife('seconds')
  else cacheLife('hours')
  return listProducts({
    category,
    sort,
    search: q,
    materials: material,
    colors: color,
    priceRanges: price?.map((band) => priceBandRanges[band]),
  })
}

export async function getProduct(slug: string): Promise<Product | null> {
  'use cache'
  cacheLife('hours')
  cacheTag('products')
  return getProductBySlug(slug)
}

// Uncached, unlike the rest: a "use cache" result in the landing shell leaves the prefetch of "/" open.
export async function getFeatured(limit = 4): Promise<Product[]> {
  return listFeaturedProducts(limit)
}

export async function getCategoryCovers() {
  return listCategoryCovers()
}

export async function getRelated(product: Product, limit = 4): Promise<Product[]> {
  'use cache'
  cacheLife('hours')
  cacheTag('products')
  return listRelatedProducts(product, limit)
}

export async function getFacets() {
  'use cache'
  cacheLife('hours')
  cacheTag('products')
  return listFacets()
}
