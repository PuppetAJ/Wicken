import type { Metadata } from 'next'
import Image from 'next/image'
import { ButtonLink, PlainButtonLink } from '@/components/elements/button'
import { ArrowNarrowRightIcon } from '@/components/icons/arrow-narrow-right-icon'
import { CalendarDaysIcon, PackageIcon, WrenchIcon } from 'lucide-react'
import { Container } from '@/components/elements/container'
import { Eyebrow } from '@/components/elements/eyebrow'
import { Subheading } from '@/components/elements/subheading'
import { Text } from '@/components/elements/text'
import { Rise } from '@/components/motion'
import { CallToActionSimple } from '@/components/sections/call-to-action-simple'
import { HeroSimpleCentered } from '@/components/sections/hero-simple-centered'
import { TestimonialTwoColumnWithLargePhoto } from '@/components/sections/testimonial-two-column-with-large-photo'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Two makers, three workshops they buy from, and a kiln that decides what the rest of the week looks like.',
}

export default function AboutPage() {
  return (
    <>
      <HeroSimpleCentered
        eyebrow="The studio"
        headline="Named after a tree."
        subheadline={
          <p>
            The wicken tree, better known as rowan, was the one planted by the door to keep harm out of the house. It
            seemed like a good thing to name a workshop after.
          </p>
        }
        cta={<ButtonLink href="/shop">See what we make</ButtonLink>}
      />

      <Container>
        <Rise className="relative aspect-3/2 overflow-hidden rounded-xl bg-tile sm:aspect-21/9">
          <Image
            src="/images/editorial-shelf.jpg"
            alt="A painted shelf of unglazed vases and bottles, drying before they are fired"
            fill
            priority
            sizes="(min-width: 1280px) 1200px, 96vw"
            className="object-cover"
          />
        </Rise>
      </Container>

      <Step
        id="made"
        eyebrow="Mornings"
        headline="Handling clay while the light is good"
        image="/images/editorial-wheel.jpg"
        alt="Hands smoothing the rim of a tall jar on a wheel with a wet sponge"
      >
        <p>
          We always start on the wheel. Our batches are whatever we can produce between when we open and about midday.
        </p>
        <p>
          Pieces are left to dry on the shelf for a week, then get turned, glazed, and wait for a kiln that we always
          fire full. That's why sold-out pieces take time to come back.
        </p>
      </Step>

      <Step
        eyebrow="Afternoons"
        headline="Wood, and a lot of measuring"
        image="/images/editorial-timber.jpg"
        alt="A hand marking a pine board with a pencil, surrounded by shavings and a chisel"
        reversed
      >
        <p>
          We buy oak, ash, elm and a little walnut as boards, not sheets, and cut everything to size here. Every joint
          is made so it can be taken apart again, because a chair that can't be repaired has an expiry date.
        </p>
        <p>
          Nothing is lacquered. Oil marks more easily and needs redoing every few years, but it means a scratch sands
          out instead of staying.
        </p>
        <p>
          What we don&rsquo;t make ourselves comes from three workshops we have bought from for years. Kestrel Glass in
          Beacon blows the glass, Rosedale Weaving in Hudson weaves the linen, and Fennimore Wax in Kingston pours the
          candles. Every product page says which of us made it.
        </p>
      </Step>

      <Rise>
        <TestimonialTwoColumnWithLargePhoto
          quote={
            <>
              <p>
                I bought two mugs in 2021 expecting them to be the nice ones you keep in the cupboard. They have been in
                daily use ever since. Four winters, a house move and a toddler, and not a chip between them.
              </p>
            </>
          }
          img={
            <Image
              src="/images/editorial-studio.jpg"
              alt="A wall shelf of pottery and books above a scrubbed wooden table in a calm, warm room"
              width={1600}
              height={1058}
              sizes="(min-width: 1024px) 50vw, 96vw"
              className="w-full"
            />
          }
          name="Maren Solheim"
          byline="Bought two mugs in 2021, and rather more since"
        />
      </Rise>

      <Promises />

      <CallToActionSimple
        reveal
        headline="Come and visit."
        subheadline={
          <p>The workshop is open the first Saturday of every month, and email gets answered faster than that.</p>
        }
        cta={
          <div className="flex flex-wrap items-center gap-2">
            <ButtonLink href="/help" size="lg">
              Plan a visit
            </ButtonLink>
            <PlainButtonLink href="/shop" size="lg">
              Shop now <ArrowNarrowRightIcon />
            </PlainButtonLink>
          </div>
        }
      />
    </>
  )
}

function Step({
  id,
  eyebrow,
  headline,
  image,
  alt,
  reversed = false,
  children,
}: {
  id?: string
  eyebrow: string
  headline: string
  image: string
  alt: string
  reversed?: boolean
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24 py-16">
      <Container className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
        <Rise className={`relative aspect-4/3 overflow-hidden rounded-xl bg-tile ${reversed ? 'lg:order-2' : ''}`}>
          <Image src={image} alt={alt} fill sizes="(min-width: 1024px) 45vw, 92vw" className="object-cover" />
        </Rise>
        <Rise className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Eyebrow>{eyebrow}</Eyebrow>
            <Subheading>{headline}</Subheading>
          </div>
          <Text className="flex flex-col gap-4 text-pretty">{children}</Text>
        </Rise>
      </Container>
    </section>
  )
}

const promises = [
  {
    icon: WrenchIcon,
    title: 'Repairs, for as long as you have it',
    body: "Anything we made, we'll fix. Send a photo and we'll tell you honestly whether it's worth doing.",
  },
  {
    icon: PackageIcon,
    title: 'Spares on the shelf',
    body: 'We keep spares for everything we make, so a lid or a leg can be replaced on its own.',
  },
  {
    icon: CalendarDaysIcon,
    title: 'Open the first Saturday',
    body: '10 to 4, every month, no appointment. Come and see the kiln.',
  },
]

function Promises() {
  return (
    <section className="py-10 sm:py-14">
      <Container className="flex flex-col gap-8">
        <Rise className="flex max-w-2xl flex-col gap-2">
          <Eyebrow>What we stand behind</Eyebrow>
          <Subheading>Three things you can hold us to</Subheading>
        </Rise>
        <div className="grid gap-4 md:grid-cols-3">
          {promises.map(({ icon: Icon, title, body }, index) => (
            <Rise
              key={title}
              delay={index * 0.08}
              className="flex flex-col gap-3 rounded-xl border border-olive-950/10 p-6 dark:border-white/10"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-olive-950/5 text-olive-700 dark:bg-white/10 dark:text-olive-300">
                <Icon className="size-5" />
              </span>
              <h3 className="font-medium text-olive-950 dark:text-white">{title}</h3>
              <p className="text-sm/6 text-olive-700 dark:text-olive-400">{body}</p>
            </Rise>
          ))}
        </div>
      </Container>
    </section>
  )
}
