'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { ButtonLink, PlainButtonLink } from '@/components/elements/button'

export function SignedOutLinks({ layout = 'header' }: { layout?: 'header' | 'sheet' }) {
  const pathname = usePathname()
  const params = useSearchParams().toString()
  const here = `${pathname}${params ? `?${params}` : ''}`
  const next = pathname === '/' ? '' : `?next=${encodeURIComponent(here)}`

  if (layout === 'sheet') {
    return (
      <div className="flex flex-col gap-2 border-t border-olive-950/10 pt-4 dark:border-white/10">
        <ButtonLink href={`/register${next}`} size="lg" className="w-full">
          Sign up
        </ButtonLink>
        <PlainButtonLink href={`/login${next}`} size="lg" className="w-full">
          Log in
        </PlainButtonLink>
      </div>
    )
  }

  return (
    <>
      <PlainButtonLink href={`/login${next}`} className="max-lg:hidden">
        Log in
      </PlainButtonLink>
      <ButtonLink href={`/register${next}`} className="max-lg:hidden">
        Sign up
      </ButtonLink>
    </>
  )
}
