import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { MessageCircleQuestionIcon, PackageIcon, TruckIcon, Undo2Icon, WrenchIcon } from 'lucide-react'
import { Container } from '@/components/elements/container'
import { Logo } from '@/components/elements/logo'
import { Subheading } from '@/components/elements/subheading'
import { Text } from '@/components/elements/text'
import { FaqAccordion } from '@/components/sections/faq-accordion'
import { ContactForm } from '@/features/help/components/contact-form'
import { getSession } from '@/lib/auth/session'
import { care, orders, returns, shipping } from './faqs'

export const metadata: Metadata = {
  title: 'Help',
  description: 'Shipping, returns, looking after what you bought, and how to reach the studio.',
}

export default function HelpPage() {
  const topics = [
    {
      id: 'shipping',
      title: 'Shipping',
      blurb: 'When it leaves, what it costs, and how it is packed.',
      items: shipping,
      icon: <TruckIcon className="size-5" />,
    },
    {
      id: 'returns',
      title: 'Returns',
      blurb: 'Sending something back, and what happens if it arrives broken.',
      items: returns,
      icon: <Undo2Icon className="size-5" />,
    },
    {
      id: 'care',
      title: 'Care and repair',
      blurb: 'Washing, oiling, and what we will mend for you.',
      items: care,
      icon: <WrenchIcon className="size-5" />,
    },
    {
      id: 'orders',
      title: 'Orders and account',
      blurb: 'Tracking, changing an order, and what this demo actually does.',
      items: orders,
      icon: <PackageIcon className="size-5" />,
    },
  ]

  return (
    <>
      <section className="pt-12 pb-8 sm:pt-16">
        <Container className="flex flex-col items-center gap-5 text-center">
          <Logo className="size-9 text-olive-950 dark:text-white" />
          <h1 className="font-display text-4xl/12 font-medium tracking-tight text-balance text-olive-950 sm:text-5xl/14 dark:text-white">
            Ask us anything.
          </h1>
          <Text className="max-w-xl text-pretty">
            <p>
              Shipping, returns, and how to look after what you bought. If the answer isn't below,{' '}
              <Link href="#contact" className="text-olive-950 underline underline-offset-4 dark:text-white">
                write to the studio
              </Link>{' '}
              and somebody will read it the same morning.
            </p>
          </Text>
        </Container>
      </section>

      <section className="py-8">
        <Container>
          <div className="grid gap-4 sm:grid-cols-2">
            {topics.map((topic) => (
              <Link
                key={topic.id}
                href={`#${topic.id}`}
                className="flex flex-col gap-3 rounded-xl border border-olive-950/10 p-6 transition-colors hover:border-olive-950/25 hover:bg-olive-950/2.5 dark:border-white/10 dark:hover:border-white/25 dark:hover:bg-white/5"
              >
                <span className="flex size-10 items-center justify-center rounded-lg bg-olive-950/5 text-olive-700 dark:bg-white/10 dark:text-olive-300">
                  {topic.icon}
                </span>
                <h2 className="font-medium text-olive-950 dark:text-white">{topic.title}</h2>
                <p className="text-sm/6 text-olive-700 dark:text-olive-400">{topic.blurb}</p>
                <p className="mt-auto pt-2 text-sm text-olive-600 dark:text-olive-500">
                  {topic.items.length} questions
                </p>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {topics.map((topic) => (
        <FaqAccordion key={topic.id} id={topic.id} headline={topic.title} icon={topic.icon} items={topic.items} />
      ))}

      <section id="contact" className="scroll-mt-24 py-12">
        <Container>
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 sm:rounded-xl sm:border sm:border-olive-950/10 sm:p-10 dark:sm:border-white/10">
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="flex size-10 items-center justify-center rounded-lg bg-olive-950/5 text-olive-700 dark:bg-white/10 dark:text-olive-300">
                <MessageCircleQuestionIcon className="size-5" />
              </span>
              <Subheading className="text-2xl/8 sm:text-2xl/8">Still stuck?</Subheading>
              <Text className="max-w-lg text-pretty">
                <p>
                  Write to <span className="text-olive-950 dark:text-white">hello@wicken.example</span> or use the form.
                  Either one reaches the same two people.
                </p>
              </Text>
            </div>

            <Suspense fallback={<ContactForm waiting />}>
              <PrefilledForm />
            </Suspense>

            <div className="flex flex-col gap-3 border-t border-olive-950/10 pt-6 text-sm/6 text-olive-700 dark:border-white/10 dark:text-olive-400">
              <p>
                The workshop is the old foundry on Mill Street in Hudson, New York. We're open to visitors the first
                Saturday of every month, 10 to 4, no appointment needed, and the coffee's usually on. We take a handful
                of commissions a year; write with a sketch and a size.
              </p>
              <p className="text-olive-600 dark:text-olive-500">
                The address and email are invented. Anything you send through the form is stored in this demo&rsquo;s
                database so the admin dashboard has something to show. Nothing is emailed anywhere.
              </p>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}

async function PrefilledForm() {
  const session = await getSession()
  return <ContactForm name={session?.user.name ?? ''} email={session?.user.email ?? ''} />
}
