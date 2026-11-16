import type { ReactNode } from 'react'
import { Container } from '@/components/elements/container'
import { Subheading } from '@/components/elements/subheading'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

export function FaqAccordion({
  headline,
  icon,
  items,
  id,
}: {
  headline: ReactNode
  icon?: ReactNode
  items: { question: string; answer: ReactNode }[]
  id?: string
}) {
  return (
    <section id={id} className="scroll-mt-24 py-8">
      <Container>
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
          <div className="flex items-center gap-3">
            {icon && (
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-olive-950/5 text-olive-700 dark:bg-white/10 dark:text-olive-300">
                {icon}
              </span>
            )}
            <Subheading className="text-2xl/8 sm:text-2xl/8">{headline}</Subheading>
          </div>
          <Accordion type="single" collapsible className="border-y border-olive-950/10 dark:border-white/10">
            {items.map((item) => (
              <AccordionItem key={item.question} value={item.question}>
                <AccordionTrigger className="text-base/7 text-olive-950 dark:text-white">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="pr-12 text-sm/7 text-olive-700 dark:text-olive-400">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Container>
    </section>
  )
}
