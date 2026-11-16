import Image from 'next/image'
import Link from 'next/link'
import { Container } from '@/components/elements/container'
import { Skeleton } from '@/components/ui/skeleton'
import { Rise, Stagger } from '@/components/motion'
import { getCategoryCovers } from '@/features/products/data'
import { focalPosition } from '@/features/products/focal'
import { categoryLabels } from '@/features/products/schemas'

const grid = 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6'
const tile = 'relative aspect-4/3 overflow-hidden rounded-xl bg-tile'
const sizes = '(min-width: 1280px) 195px, (min-width: 1024px) 16vw, (min-width: 640px) 31vw, 47vw'

export async function Categories() {
  const covers = await getCategoryCovers()

  return (
    <section className="py-10 sm:py-14">
      <Container className="flex flex-col gap-4">
        <Rise className="flex items-baseline justify-between gap-4">
          <h2 className="text-sm font-medium text-olive-950 dark:text-white">Browse by type</h2>
          <Link
            href="/shop"
            className="text-sm text-olive-600 underline underline-offset-4 hover:text-olive-950 dark:text-olive-400 dark:hover:text-white"
          >
            All {covers.reduce((all, cover) => all + cover.count, 0)} pieces
          </Link>
        </Rise>

        <Stagger className={grid}>
          {covers.map((cover) => (
            <Link key={cover.category} href={`/shop?category=${cover.category}`} className="group block">
              <div className={tile}>
                {cover.image_url && (
                  <Image
                    src={cover.image_url}
                    alt=""
                    fill
                    sizes={sizes}
                    style={{ objectPosition: focalPosition(cover.slug) }}
                    className="object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  />
                )}
                <div className="absolute inset-0 bg-linear-to-t from-black/65 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-baseline justify-between gap-2 p-3">
                  <span className="text-sm font-medium text-white">{categoryLabels[cover.category]}</span>
                  <span className="text-xs text-white/70 tabular-nums">{cover.count}</span>
                </div>
              </div>
            </Link>
          ))}
        </Stagger>
      </Container>
    </section>
  )
}

export function CategoriesSkeleton() {
  return (
    <section className="py-10 sm:py-14">
      <Container className="flex flex-col gap-4">
        <Skeleton className="h-5 w-40" />
        <div className={grid}>
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="aspect-4/3 rounded-xl" />
          ))}
        </div>
      </Container>
    </section>
  )
}
