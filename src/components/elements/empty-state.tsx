import type { ReactNode } from 'react'
import { ButtonLink } from './button'
import { Heading } from './heading'
import { Text } from './text'

export function EmptyState({ heading, children }: { heading?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-6">
      {heading && <Heading>{heading}</Heading>}
      <Text size="lg" className="max-w-xl">
        <p>{children}</p>
      </Text>
      <ButtonLink href="/shop" size="lg">
        Browse the collection
      </ButtonLink>
    </div>
  )
}
