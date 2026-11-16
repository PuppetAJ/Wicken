import { categories } from '@/lib/db/types'
import { clsx } from 'clsx/lite'
import Link from 'next/link'
import { categoryLabels, shopHref, sortLabels, sorts, type ShopSearch } from '../schemas'
import { FilterSheet } from './filter-sheet'
import { SearchBox } from './search-box'
import { SortSelect } from '@/components/elements/sort-select'

export function ShopToolbar({
  search,
  count,
  facets,
}: {
  search: ShopSearch
  count: number
  facets: { materials: string[]; colors: string[] }
}) {
  const filtered = Boolean(search.category || search.q || search.price || search.material || search.color)

  return (
    <div className="flex flex-col gap-6">
      <div data-inline-filters="chips" className="hidden flex-wrap items-center gap-x-2 gap-y-3 lg:flex">
        <CategoryLink href={shopHref({ ...search, category: undefined })} active={!search.category}>
          Everything
        </CategoryLink>
        {categories.map((category) => (
          <CategoryLink key={category} href={shopHref({ ...search, category })} active={search.category === category}>
            {categoryLabels[category]}
          </CategoryLink>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
        <SearchBox search={search} />

        <div className="flex min-w-0 items-center justify-between gap-3 sm:gap-4">
          <FilterSheet search={search} facets={facets} count={count} />
          <SortSelect
            value={search.sort}
            options={sorts.map((sort) => ({
              value: sort,
              label: sortLabels[sort],
              href: shopHref({ ...search, sort }),
            }))}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm text-olive-600 dark:text-olive-400">
        <p>
          {count} {count === 1 ? 'piece' : 'pieces'}
          {search.category && ` in ${categoryLabels[search.category].toLowerCase()}`}
        </p>
        {filtered && (
          <Link href="/shop" className="underline underline-offset-4 hover:text-olive-950 dark:hover:text-white">
            Clear all
          </Link>
        )}
      </div>
    </div>
  )
}

function CategoryLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={clsx(
        'rounded-full px-3.5 py-1.5 text-sm transition-colors',
        active
          ? 'bg-olive-950 text-white dark:bg-white dark:text-olive-950'
          : 'border border-olive-300 text-olive-700 hover:bg-olive-200/50 dark:border-olive-800 dark:text-olive-300 dark:hover:bg-olive-800/50',
      )}
    >
      {children}
    </Link>
  )
}
