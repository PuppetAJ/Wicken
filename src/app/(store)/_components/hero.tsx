import { AnnouncementBadge } from '@/components/elements/announcement-badge'
import { ButtonLink, PlainButtonLink } from '@/components/elements/button'
import { ArrowNarrowRightIcon } from '@/components/icons/arrow-narrow-right-icon'
import { Enter } from '@/components/motion'
import { HeroTwoColumnWithPhoto } from '@/components/sections/hero-two-column-with-photo'
import Image from 'next/image'

export function LandingHero() {
  return (
    <HeroTwoColumnWithPhoto
      tallPhoto
      eyebrow={
        <Enter delay={0.05}>
          <AnnouncementBadge
            href="/about"
            text={<>&ldquo;Four winters of daily use, not a chip.&rdquo;</>}
            cta="Read Maren's story"
          />
        </Enter>
      }
      headline={
        <Enter as="span" className="block lg:text-5xl/12 xl:text-[3.5rem]/14" delay={0.12}>
          Made slowly, to be kept.
        </Enter>
      }
      subheadline={
        <Enter delay={0.2}>
          <p className="lg:max-w-[90%]">
            Wicken is a small studio working in clay and wood. What we don't make ourselves comes from a short list of
            makers we've bought from for years. Nothing is ever made in amounts too large for us to inspect each piece
            by hand.
          </p>
        </Enter>
      }
      cta={
        <Enter delay={0.28}>
          <div className="flex flex-wrap items-center gap-2">
            <ButtonLink href="/shop" size="lg">
              Shop now
            </ButtonLink>
            <PlainButtonLink href="/about" size="lg">
              How it&rsquo;s made <ArrowNarrowRightIcon />
            </PlainButtonLink>
          </div>
        </Enter>
      }
      photo={
        <Enter className="h-full w-full">
          <Image
            src="/images/hero-teaware.jpg"
            alt="Stoneware cups and shallow bowls on a table against an olive wall, in low afternoon light"
            width={1600}
            height={1060}
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="h-full w-full object-cover"
          />
        </Enter>
      }
    />
  )
}
