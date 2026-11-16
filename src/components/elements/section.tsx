import { clsx } from 'clsx/lite'
import type { ComponentProps, ReactNode } from 'react'
import { Rise } from '../motion'
import { Container } from './container'
import { Eyebrow } from './eyebrow'
import { Subheading } from './subheading'
import { Text } from './text'

export function Section({
  eyebrow,
  headline,
  subheadline,
  cta,
  tight = false,
  reveal = false,
  className,
  children,
  ...props
}: {
  eyebrow?: ReactNode
  headline?: ReactNode
  subheadline?: ReactNode
  cta?: ReactNode
  tight?: boolean
  reveal?: boolean
} & ComponentProps<'section'>) {
  return (
    <section className={clsx(tight ? 'py-10 sm:py-14' : 'py-16', className)} {...props}>
      <Container className={clsx('flex flex-col', tight ? 'gap-8 sm:gap-10' : 'gap-10 sm:gap-16')}>
        {headline && (
          <Header reveal={reveal}>
            <div className="flex flex-col gap-2">
              {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
              <Subheading>{headline}</Subheading>
            </div>
            {subheadline && <Text className="text-pretty">{subheadline}</Text>}
            {cta}
          </Header>
        )}
        <div>{children}</div>
      </Container>
    </section>
  )
}

function Header({ reveal, children }: { reveal: boolean; children: ReactNode }) {
  const className = 'flex max-w-2xl flex-col gap-6'
  if (!reveal) return <div className={className}>{children}</div>
  return <Rise className={className}>{children}</Rise>
}
