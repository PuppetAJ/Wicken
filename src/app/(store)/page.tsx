import { Suspense } from 'react'
import { Categories, CategoriesSkeleton } from '@/app/(store)/_components/categories'
import { Closing } from '@/app/(store)/_components/closing'
import { Featured, FeaturedSkeleton } from '@/app/(store)/_components/featured'
import { HowItIsMade } from '@/app/(store)/_components/how-it-is-made'
import { LandingHero } from '@/app/(store)/_components/hero'
import { Voices, VoicesSkeleton } from '@/app/(store)/_components/voices'

export default function HomePage() {
  return (
    <>
      <LandingHero />
      <Suspense fallback={<CategoriesSkeleton />}>
        <Categories />
      </Suspense>
      <Suspense fallback={<FeaturedSkeleton />}>
        <Featured />
      </Suspense>
      <HowItIsMade />
      <Suspense fallback={<VoicesSkeleton />}>
        <Voices />
      </Suspense>
      <Closing />
    </>
  )
}
