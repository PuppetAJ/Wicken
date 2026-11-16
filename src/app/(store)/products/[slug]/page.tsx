import { Container } from '@/components/elements/container'
import { Heading } from '@/components/elements/heading'
import { Subheading } from '@/components/elements/subheading'
import { Text } from '@/components/elements/text'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Suspense } from 'react'
import { FavoriteButton } from '@/app/_components/favorite-button'
import { AddToCart } from '@/features/cart/components/add-to-cart'
import { TrackProduct } from '@/components/analytics'
import { Enter, Rise } from '@/components/motion'
import { Breadcrumbs } from '@/features/products/components/breadcrumbs'
import { ProductRail } from '@/features/products/components/product-rail'
import { ProductImage } from '@/features/products/components/product-image'
import { getProduct, getRelated } from '@/features/products/data'
import { focalPosition } from '@/features/products/focal'
import { categoryLabels, fromShop, shopSearchSchema } from '@/features/products/schemas'
import { Price } from '@/features/products/components/price'
import { getSession } from '@/lib/auth/session'
import { listFavoriteIds } from '@/lib/db/queries/favorites'
import { SortSelect } from '@/components/elements/sort-select'
import { reviewSortLabels, reviewSortSchema, reviewsHref } from '@/features/reviews/schemas'
import { reviewSorts } from '@/lib/db/types'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Fragment } from 'react'
import { ProductReviews, RatingSummary } from '@/features/reviews/components/product-reviews'
import { leadTimeFor, leadTimeShort } from '@/lib/lead-times'
import { madeByLine } from '@/lib/makers'

export async function generateMetadata({ params }: PageProps<'/products/[slug]'>): Promise<Metadata> {
  const product = await getProduct((await params).slug)
  if (!product) return { title: 'Not found' }

  return {
    title: product.name,
    description: product.description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.description,
      images: product.image_url ? [{ url: product.image_url, width: 1600, height: 1067 }] : undefined,
    },
  }
}

export const instant = false

export default async function ProductPage({ params, searchParams }: PageProps<'/products/[slug]'>) {
  const product = await getProduct((await params).slug)
  if (!product) notFound()

  const search = shopSearchSchema.parse(await searchParams)
  const reviewSort = reviewSortSchema.parse((await searchParams).reviews)
  const related = await getRelated(product, 12)
  const soldOut = product.stock_quantity === 0
  const low = !soldOut && product.stock_quantity <= 3
  const lead = leadTimeFor(product.category)

  return (
    <Container className="flex flex-col gap-16 py-10">
      <TrackProduct productId={product.id} />
      <div className="flex flex-col gap-6">
        <Enter delay={0.05}>
          <Breadcrumbs search={search} category={product.category} name={product.name} />
        </Enter>
        <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">
          {product.image_url && (
            <Enter className="min-w-0 flex-1 self-start">
              <ProductImage src={product.image_url} alt={product.name} objectPosition={focalPosition(product.slug)} />
            </Enter>
          )}

          <div className="flex flex-1 flex-col items-start gap-6 lg:py-8">
            <Enter delay={0.12} className="flex flex-col gap-3">
              <Link
                href={`/shop?category=${product.category}`}
                className="text-sm text-olive-600 underline underline-offset-4 dark:text-olive-400"
              >
                {categoryLabels[product.category]}
              </Link>
              <Heading className="text-4xl/10 sm:text-5xl/12">{product.name}</Heading>
            </Enter>

            <Enter delay={0.2} className="flex flex-col items-start gap-6">
              <Price product={product} size="lg" />

              <Suspense fallback={null}>
                <RatingSummary productId={product.id} />
              </Suspense>

              <p className="text-sm text-olive-600 dark:text-olive-400">{madeByLine(product.made_by)}</p>

              <p className="text-sm text-olive-600 dark:text-olive-400">
                {soldOut
                  ? 'Back when the next batch comes out of the kiln.'
                  : lead.madeToOrder
                    ? `Made to order, ${leadTimeShort(lead)}`
                    : low
                      ? `Only ${product.stock_quantity} left, ships in ${leadTimeShort(lead)}`
                      : `In stock, ships in ${leadTimeShort(lead)}`}
              </p>
            </Enter>

            <Enter delay={0.28} className="flex flex-col items-start gap-6">
              <Text>
                <p>{product.description}</p>
              </Text>

              {(product.dimensions || product.materials) && (
                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
                  {product.dimensions && (
                    <>
                      <dt className="text-olive-600 dark:text-olive-400">Dimensions</dt>
                      <dd className="text-olive-950 dark:text-white">{product.dimensions}</dd>
                    </>
                  )}
                  {product.materials && (
                    <>
                      <dt className="text-olive-600 dark:text-olive-400">Materials</dt>
                      <dd className="text-olive-950 dark:text-white">{product.materials}</dd>
                    </>
                  )}
                </dl>
              )}
            </Enter>

            <Enter delay={0.36} className="w-full">
              <AddToCart
                productId={product.id}
                name={product.name}
                stock={product.stock_quantity}
                save={
                  <Suspense fallback={null}>
                    <SaveControl productId={product.id} name={product.name} />
                  </Suspense>
                }
              />
            </Enter>
          </div>
        </div>
      </div>

      <Rise className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        <section id="reviews" className="flex min-w-0 flex-col gap-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Subheading>Reviews</Subheading>
            <SortSelect
              label="Sort reviews"
              scroll={false}
              value={reviewSort}
              options={reviewSorts.map((sort) => ({
                value: sort,
                label: reviewSortLabels[sort],
                href: reviewsHref(product.slug, fromShop(search), sort),
              }))}
            />
          </div>
          <Suspense fallback={<p className="text-sm text-olive-600 dark:text-olive-400">Loading reviews…</p>}>
            <ProductReviews productId={product.id} slug={product.slug} sort={reviewSort} />
          </Suspense>
        </section>

        <div className="lg:pt-2">
          <Accordion type="single" collapsible className="w-full">
            {Object.keys(product.specs).length > 0 && (
              <AccordionItem value="specs">
                <AccordionTrigger>Product information</AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-6">
                    {Object.entries(product.specs).map(([group, rows]) => (
                      <div key={group} className="flex flex-col gap-2">
                        <h4 className="font-medium text-olive-950 dark:text-white">{group}</h4>
                        <dl className="grid grid-cols-[minmax(0,10rem)_1fr] gap-x-6">
                          {Object.entries(rows).map(([label, value]) => (
                            <Fragment key={label}>
                              <dt className="border-t border-olive-200 py-2 text-olive-600 dark:border-olive-800 dark:text-olive-400">
                                {label}
                              </dt>
                              <dd className="border-t border-olive-200 py-2 dark:border-olive-800">{value}</dd>
                            </Fragment>
                          ))}
                        </dl>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
            <AccordionItem value="care">
              <AccordionTrigger>Care and repair</AccordionTrigger>
              <AccordionContent>
                Dishwasher safe, though hand washing keeps the glaze brighter longer. Wood is oiled, not lacquered, so a
                scratch can be sanded out and re-oiled. We keep spares for everything we make.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="shipping">
              <AccordionTrigger>Shipping and returns</AccordionTrigger>
              <AccordionContent>
                {lead.madeToOrder ? 'Made to order, so it takes' : 'Ships in'} {leadTimeShort(lead)}, packed in molded
                paper instead of plastic. Return anything unused within 30 days and we&rsquo;ll arrange the pickup.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </Rise>

      {related.length > 0 && (
        <Rise className="flex flex-col gap-8">
          <ProductRail
            products={related}
            from={fromShop(search)}
            title={
              <Subheading className="min-w-0">
                More from{' '}
                <Link
                  href={`/shop?category=${product.category}`}
                  className="text-olive-500 no-underline transition-colors hover:underline hover:decoration-1 hover:underline-offset-[6px] dark:text-olive-400"
                >
                  {categoryLabels[product.category].toLowerCase()}
                </Link>
              </Subheading>
            }
          />
        </Rise>
      )}
    </Container>
  )
}

async function SaveControl({ productId, name }: { productId: number; name: string }) {
  const session = await getSession()
  const favorited = session ? (await listFavoriteIds(session.user.id)).includes(productId) : false
  return <FavoriteButton productId={productId} name={name} favorited={favorited} />
}
