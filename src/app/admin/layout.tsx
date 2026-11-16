import Link from 'next/link'
import { ArrowLeftIcon } from 'lucide-react'
import { Container } from '@/components/elements/container'
import { Logo } from '@/components/elements/logo'
import { AdminNav } from '@/features/admin/components/admin-nav'

export default function AdminLayout({ children }: LayoutProps<'/admin'>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-olive-950/10 dark:border-white/10">
        <Container className="flex h-14 items-center justify-between gap-6">
          <div className="flex items-center gap-1.5">
            <Logo className="size-5 shrink-0 text-olive-950 dark:text-white" />
            <span className="flex items-baseline gap-2">
              <span className="font-display text-lg font-medium text-olive-950 dark:text-white">Wicken</span>
              <span className="text-sm text-olive-600 dark:text-olive-400">Admin</span>
            </span>
          </div>
          <Link
            href="/"
            aria-label="Back to the store"
            className="flex shrink-0 items-center gap-1.5 text-sm text-olive-600 hover:text-olive-950 dark:text-olive-400 dark:hover:text-white"
          >
            <ArrowLeftIcon className="size-4 shrink-0" aria-hidden />
            <span className="hidden min-[380px]:inline">Back to the store</span>
          </Link>
        </Container>
      </header>

      <div className="border-b border-amber-500/25 bg-amber-500/10 dark:bg-amber-400/10">
        <Container className="py-2.5">
          <p className="text-xs/5 text-amber-900 dark:text-amber-200">
            <span className="font-medium">This admin writes to the real database.</span> Prices, stock and order
            statuses change for everybody. Everything is reseeded nightly, so nothing you do here lasts. Deleting
            products and customers, and issuing refunds, are switched off.
          </p>
        </Container>
      </div>

      <Container className="grid flex-1 items-start gap-8 py-8 lg:grid-cols-[13rem_1fr] lg:gap-12">
        <AdminNav />
        <div className="min-w-0">{children}</div>
      </Container>
    </div>
  )
}
