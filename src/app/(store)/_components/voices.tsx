import Image from 'next/image'
import Link from 'next/link'
import { Carousel } from '@/components/elements/carousel'
import { Container } from '@/components/elements/container'
import { Rise } from '@/components/motion'
import { Section } from '@/components/elements/section'
import { Subheading } from '@/components/elements/subheading'
import { Skeleton } from '@/components/ui/skeleton'
import { Stars } from '@/features/reviews/components/stars'
import { listTestimonials } from '@/lib/db/queries/reviews'

const card = 'w-[min(20rem,85vw)] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]'

export async function Voices() {
  const quotes = await listTestimonials(6)
  if (quotes.length < 3) return null

  return (
    <section className="py-10 sm:py-14">
      <Container>
        <Rise>
          <Carousel
            title={<Subheading>What people say</Subheading>}
            itemClassName={card}
            label="Reviews left on the pieces"
            previousLabel="Previous reviews"
            nextLabel="More reviews"
          >
            {quotes.map((quote) => (
              <figure
                key={quote.product_slug}
                className="flex h-full flex-col gap-5 rounded-xl bg-olive-950/2.5 p-6 dark:bg-white/5"
              >
                <Stars rating={quote.rating} />
                <blockquote className="flex-1 text-pretty text-olive-950 dark:text-white">
                  &ldquo;{quote.body}&rdquo;
                </blockquote>
                <figcaption className="flex items-center gap-3">
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-tile">
                    {quote.image_url && (
                      <Image src={quote.image_url} alt="" fill sizes="48px" className="object-cover" />
                    )}
                  </span>
                  <div className="min-w-0 text-sm">
                    <p className="font-medium text-olive-950 dark:text-white">{quote.author}</p>
                    <p className="truncate text-olive-600 dark:text-olive-400">
                      on{' '}
                      <Link href={`/products/${quote.product_slug}`} className="underline underline-offset-4">
                        {quote.product_name}
                      </Link>
                    </p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </Carousel>
        </Rise>
      </Container>
    </section>
  )
}

export function VoicesSkeleton() {
  return (
    <Section tight headline="What people say">
      <div className="grid gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-56 rounded-xl" />
        ))}
      </div>
    </Section>
  )
}
