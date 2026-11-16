'use client'

import { useEffect, useRef, type ReactNode } from 'react'

export function Scroller({
  children,
  className = '',
  as: Tag = 'div',
  label,
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'nav'
  label?: string
}) {
  const strip = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = strip.current
    if (!node) return

    const measure = () => {
      const past = node.scrollWidth - node.clientWidth
      node.style.setProperty('--hint-start', node.scrollLeft > 4 ? '28px' : '0px')
      node.style.setProperty('--hint-end', past - node.scrollLeft > 4 ? '28px' : '0px')
    }

    measure()
    node.addEventListener('scroll', measure, { passive: true })
    const watch = new ResizeObserver(measure)
    watch.observe(node)
    return () => {
      node.removeEventListener('scroll', measure)
      watch.disconnect()
    }
  }, [])

  return (
    <Tag ref={strip as never} aria-label={label} className={`scroll-hint overflow-x-auto ${className}`}>
      {children}
    </Tag>
  )
}
