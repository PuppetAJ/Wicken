import Image from 'next/image'
import Link from 'next/link'
import { ArrowNarrowRightIcon } from '@/components/icons/arrow-narrow-right-icon'
import { Container } from '@/components/elements/container'
import { Eyebrow } from '@/components/elements/eyebrow'
import { Subheading } from '@/components/elements/subheading'
import { Text } from '@/components/elements/text'
import { Rise } from '@/components/motion'
import { NewsletterForm } from '@/features/newsletter/components/newsletter-form'

export function Closing() {
  return (
    <section data-closing className="py-10 max-sm:pb-0 sm:py-14">
      <Container>
        <Rise className="grid overflow-hidden bg-olive-950/2.5 max-sm:-mx-6 sm:rounded-2xl lg:grid-cols-2 dark:bg-white/5">
          <div className="relative aspect-video lg:order-2 lg:aspect-auto lg:min-h-full">
            <Image
              src="/images/editorial-shelf.jpg"
              alt="A painted shelf of unglazed vases and bottles, drying before they are fired"
              fill
              sizes="(min-width: 1024px) 50vw, 96vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col gap-6 p-6 sm:p-10 lg:p-12">
            <div className="flex flex-col gap-2">
              <Eyebrow>Stay close</Eyebrow>
              <Subheading>Come and visit, or hear when a batch is out.</Subheading>
            </div>
            <Text className="text-pretty">
              <p>
                The workshop is open the first Saturday of every month. If you can&rsquo;t make it, we&rsquo;ll send one
                email when something new comes out of the kiln. Nothing else, and it&rsquo;s easy to stop.
              </p>
            </Text>
            <NewsletterForm
              source="landing"
              fineprint={
                <p>
                  Never more than one a month, and you can stop any time. Wicken is a demo, so nothing is actually sent.
                </p>
              }
            />
            <Link
              href="/help#contact"
              className="inline-flex items-center gap-1 self-start text-sm/7 font-medium text-olive-950 underline underline-offset-4 dark:text-white"
            >
              Plan a visit <ArrowNarrowRightIcon />
            </Link>
          </div>
        </Rise>
      </Container>
    </section>
  )
}
