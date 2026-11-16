'use client'

import { HeartIcon, PackageIcon, SettingsIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/account/orders', label: 'Orders', icon: PackageIcon },
  { href: '/account/favorites', label: 'Favorites', icon: HeartIcon },
  { href: '/account/settings', label: 'Settings', icon: SettingsIcon },
]

export function AccountNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Account">
      <ul className="flex flex-wrap gap-2 lg:flex-col lg:flex-nowrap lg:gap-1">
        {links.map(({ href, label, icon: Icon }) => {
          const current = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={current ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  current
                    ? 'bg-olive-950/5 font-medium text-olive-950 dark:bg-white/10 dark:text-white'
                    : 'text-olive-600 hover:bg-olive-950/5 hover:text-olive-950 dark:text-olive-400 dark:hover:bg-white/5 dark:hover:text-white'
                }`}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
