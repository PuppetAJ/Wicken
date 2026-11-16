'use client'

import { MenuIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { Logo } from '@/components/elements/logo'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { navLinks } from '@/lib/nav'

export function MobileNav({ account }: { account?: ReactNode }) {
  const pathname = usePathname()
  const [openedAt, setOpenedAt] = useState<string | null>(null)
  const open = openedAt === pathname

  useEffect(() => {
    const wide = window.matchMedia('(min-width: 1024px)')
    const close = (event: MediaQueryListEvent) => {
      if (event.matches) setOpenedAt(null)
    }
    wide.addEventListener('change', close)
    return () => wide.removeEventListener('change', close)
  }, [])

  return (
    <Sheet open={open} onOpenChange={(next) => setOpenedAt(next ? pathname : null)}>
      <SheetTrigger
        aria-label="Open menu"
        className="inline-flex size-9 items-center justify-center rounded-full text-olive-700 hover:bg-olive-200 lg:hidden dark:text-olive-400 dark:hover:bg-olive-800"
      >
        <MenuIcon className="size-5" />
      </SheetTrigger>
      <SheetContent side="top">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-1.5 font-display text-xl font-medium">
            <Logo className="size-6 shrink-0" />
            Wicken
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-4 pb-6">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="py-2 text-base/7 text-olive-950 dark:text-white">
              {link.label}
            </Link>
          ))}
          {account}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
