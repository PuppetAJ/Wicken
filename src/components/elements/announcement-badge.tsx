import { clsx } from 'clsx/lite'
import NextLink from 'next/link'
import type { ComponentProps, ReactNode } from 'react'
import { ChevronIcon } from '../icons/chevron-icon'

export function AnnouncementBadge({
  text,
  href,
  cta = 'Learn more',
  variant = 'normal',
  className,
  ...props
}: {
  text: ReactNode
  href: string
  cta?: ReactNode
  variant?: 'normal' | 'overlay'
} & Omit<ComponentProps<'a'>, 'href' | 'children'>) {
  return (
    <NextLink
      href={href}
      {...props}
      data-variant={variant}
      className={clsx(
        'group relative inline-flex max-w-full items-center gap-x-3 overflow-hidden rounded-full px-3 py-0.5 text-sm/6',
        variant === 'normal' &&
          'bg-olive-950/5 text-olive-950 hover:bg-olive-950/10 dark:bg-white/5 dark:text-white dark:inset-ring-1 dark:inset-ring-white/5 dark:hover:bg-white/10',
        variant === 'overlay' &&
          'bg-olive-950/15 text-white hover:bg-olive-950/20 dark:bg-olive-950/20 dark:hover:bg-olive-950/25',
        className,
      )}
    >
      <span className="min-w-0 truncate max-sm:hidden">{text}</span>
      <span
        className={clsx(
          'h-3 w-px max-sm:hidden',
          variant === 'normal' && 'bg-olive-950/20 dark:bg-white/10',
          variant === 'overlay' && 'bg-white/20',
        )}
      />
      <span
        className={clsx(
          'inline-flex shrink-0 items-center gap-2 font-semibold',
          variant === 'normal' && 'text-olive-950 dark:text-white',
        )}
      >
        {cta} <ChevronIcon className="shrink-0" />
      </span>
    </NextLink>
  )
}
