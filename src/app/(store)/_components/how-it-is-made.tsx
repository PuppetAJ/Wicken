import Image from 'next/image'
import { Container } from '@/components/elements/container'
import { Eyebrow } from '@/components/elements/eyebrow'
import { Subheading } from '@/components/elements/subheading'
import { Text } from '@/components/elements/text'
import { Rise } from '@/components/motion'
import { Feature } from '@/components/elements/feature'

export function HowItIsMade() {
  return (
    <section className="py-10 sm:py-14">
      <Container className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
        <Rise className="relative aspect-4/3 overflow-hidden rounded-xl bg-tile">
          <Image
            src="/images/editorial-throwing.jpg"
            alt="Two clay covered hands raising the wall of a small cylinder on a potter's wheel"
            fill
            sizes="(min-width: 1024px) 45vw, 92vw"
            className="object-cover"
          />
        </Rise>

        <Rise className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <Eyebrow>How it is made</Eyebrow>
            <Subheading>Made here, or by people we know</Subheading>
          </div>
          <Text className="text-pretty">
            <p>
              The clay and the wood are ours. The glass, the linen and the candles come from three workshops we have
              bought from for years.
            </p>
          </Text>
          <div className="flex flex-col gap-6">
            <Feature
              headline="Thrown and turned here"
              subheadline="Clay and wood, in batches small enough that we've handled every piece before it ships."
            />
            <Feature
              headline="The rest from three workshops"
              subheadline="Glass, linen and candles from makers we know by name and can call."
            />
            <Feature
              headline="Built to be repaired"
              subheadline="Joinery that comes apart, and spares kept for everything we make."
            />
          </div>
        </Rise>
      </Container>
    </section>
  )
}
