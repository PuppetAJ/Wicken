import Link from 'next/link'
import { ArrowNarrowRightIcon } from '@/components/icons/arrow-narrow-right-icon'
import { Section } from '@/components/elements/section'
import { ProductGrid, ProductGridSkeleton } from '@/features/products/components/product-grid'
import { getFeatured } from '@/features/products/data'

export async function Featured() {
  const products = await getFeatured(4)
  if (products.length === 0) return null

  return (
    <Section
      tight
      reveal
      headline="Start with one good thing"
      subheadline={<p>If you're new here, start with something you'll use every day.</p>}
      cta={
        <Link
          href="/shop"
          className="inline-flex items-center gap-1 text-sm/7 font-medium text-olive-950 underline underline-offset-4 dark:text-white"
        >
          See the whole collection <ArrowNarrowRightIcon />
        </Link>
      }
    >
      <ProductGrid products={products} />
    </Section>
  )
}

export function FeaturedSkeleton() {
  return (
    <Section tight headline="Start with one good thing">
      <ProductGridSkeleton count={4} />
    </Section>
  )
}
