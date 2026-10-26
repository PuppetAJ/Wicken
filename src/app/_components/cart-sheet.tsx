'use client'

import { ShoppingBagIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useCartOpen } from '@/features/cart/components/cart-open'

export function CartSheet({ badge, children }: { badge: ReactNode; children: ReactNode }) {
  const { open, setOpen } = useCartOpen()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="relative inline-flex size-9 items-center justify-center rounded-full text-olive-700 hover:bg-olive-200 dark:text-olive-400 dark:hover:bg-olive-800">
        {/* Words in the button rather than an aria-label, so its name takes in the badge's count when there is one. */}
        <span className="sr-only">Open cart </span>
        <ShoppingBagIcon className="size-5" />
        {badge}
      </SheetTrigger>
      <SheetContent className="flex flex-col gap-0 p-0">
        <SheetHeader className="border-b border-olive-950/10 px-4 dark:border-white/10">
          <SheetTitle className="font-display text-xl font-medium">Your cart</SheetTitle>
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  )
}
