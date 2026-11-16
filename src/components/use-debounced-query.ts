'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'

export function useDebouncedQuery({
  applied,
  maxLength,
  build,
}: {
  applied: string
  maxLength: number
  build: (wanted: string) => string
}) {
  const [value, setValue] = useState(applied)
  const [pending, start] = useTransition()
  const router = useRouter()

  const latest = useRef(build)
  useEffect(() => {
    latest.current = build
  })

  useEffect(() => {
    const wanted = value.trim().slice(0, maxLength)
    if (wanted === applied) return

    const timer = setTimeout(() => start(() => router.replace(latest.current(wanted), { scroll: false })), 300)
    return () => clearTimeout(timer)
  }, [value, applied, maxLength, router])

  return { value, setValue, pending }
}
