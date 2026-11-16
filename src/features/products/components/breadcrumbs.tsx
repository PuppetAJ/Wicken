import Link from 'next/link'
import type { Category } from '@/lib/db/types'
import { categoryLabels, shopHref, type ShopSearch } from '../schemas'

const link = 'text-olive-600 hover:text-olive-950 dark:text-olive-400 dark:hover:text-white'

export function Breadcrumbs({ search, category, name }: { search: ShopSearch; category: Category; name: string }) {
  const filtered = Boolean(search.category || search.q || search.sort !== 'newest')

  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link href={filtered ? shopHref(search) : '/shop'} className={link}>
            {filtered ? 'Back to results' : 'Shop'}
          </Link>
        </li>
        <li aria-hidden className="text-olive-400 dark:text-olive-600">
          /
        </li>
        <li>
          <Link href={shopHref({ ...search, category })} className={link}>
            {categoryLabels[category]}
          </Link>
        </li>
        <li aria-hidden className="text-olive-400 dark:text-olive-600">
          /
        </li>
        <li aria-current="page" className="text-olive-950 dark:text-white">
          {name}
        </li>
      </ol>
    </nav>
  )
}
