'use client'

import { MoonIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="inline-flex size-9 items-center justify-center rounded-full text-olive-700 hover:bg-olive-200 dark:text-olive-400 dark:hover:bg-olive-800"
    >
      <SunIcon className="size-5 dark:hidden" />
      <MoonIcon className="size-5 not-dark:hidden" />
    </button>
  )
}
