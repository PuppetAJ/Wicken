'use client'

import { SlidersHorizontalIcon } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/elements/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import type { ShopSearch } from '../schemas'
import { FacetFilters } from './facet-filters'

export function FilterSheet({
  search,
  facets,
  count,
}: {
  search: ShopSearch
  facets: { materials: string[]; colors: string[] }
  count: number
}) {
  const [open, setOpen] = useState(false)
  const applied =
    (search.category ? 1 : 0) +
    (search.price?.length ?? 0) +
    (search.material?.length ?? 0) +
    (search.color?.length ?? 0)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        data-filter-trigger
        className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-olive-300 px-3 py-1.5 text-sm text-olive-700 transition-colors hover:bg-olive-200/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none lg:hidden dark:border-olive-800 dark:text-olive-300 dark:hover:bg-olive-800/50"
      >
        <SlidersHorizontalIcon aria-hidden className="size-4" />
        Filters
        {applied > 0 && (
          <span className="inline-flex size-5 items-center justify-center rounded-full bg-olive-950 text-xs font-medium text-white dark:bg-olive-200 dark:text-olive-950">
            {applied}
          </span>
        )}
      </SheetTrigger>

      <SheetContent side="right" className="gap-0 p-0 data-[side=right]:w-[min(22rem,92vw)]">
        <SheetHeader className="border-b border-olive-950/10 px-5 py-4 dark:border-white/10">
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
          <FacetFilters search={search} facets={facets} withCategories />
        </div>

        <SheetFooter className="flex-row items-center justify-between gap-3 border-t border-olive-950/10 px-5 py-4 dark:border-white/10">
          {applied > 0 ? (
            <Link
              href="/shop"
              onClick={() => setOpen(false)}
              className="text-sm text-olive-700 underline underline-offset-4 dark:text-olive-300"
            >
              Clear all
            </Link>
          ) : (
            <span />
          )}
          <SheetClose asChild>
            <Button size="lg">
              Show {count} {count === 1 ? 'piece' : 'pieces'}
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
