'use client'

import { domAnimation, LazyMotion, m, type Variants } from 'motion/react'
import { Children, useCallback, useRef, type ReactNode } from 'react'

const step = 0.06
const most = 9
const apart = 120

const rise: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  shown: (take: () => number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: take() * step, type: 'spring', stiffness: 260, damping: 22 },
  }),
}

export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  const queue = useRef({ at: 0, next: 0, given: new Map<number, number>() })

  // Remembered per tile: Motion resolves a variant more than once, and a fresh slot each time doubles.
  const take = useCallback((index: number) => {
    const had = queue.current.given.get(index)
    if (had !== undefined) return had

    const now = performance.now()
    if (now - queue.current.at > apart) queue.current.next = 0
    queue.current.at = now
    const slot = Math.min(queue.current.next++, most)
    queue.current.given.set(index, slot)
    return slot
  }, [])

  return (
    <LazyMotion features={domAnimation} strict>
      <div className={className}>
        {Children.toArray(children).map((child, index) => (
          <m.div
            key={index}
            data-stagger
            custom={() => take(index)}
            variants={rise}
            initial="hidden"
            whileInView="shown"
            viewport={{ once: true, amount: 0.2 }}
          >
            {child}
          </m.div>
        ))}
      </div>
      <noscript>
        <style>{'[data-stagger]{opacity:1!important;transform:none!important}'}</style>
      </noscript>
    </LazyMotion>
  )
}

export function Enter({
  children,
  className,
  delay = 0,
  as = 'div',
}: {
  children: ReactNode
  className?: string
  delay?: number
  as?: 'div' | 'span'
}) {
  const Tag = as === 'span' ? m.span : m.div

  return (
    <LazyMotion features={domAnimation} strict>
      <Tag
        className={className}
        data-stagger
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, type: 'spring', stiffness: 240, damping: 26 }}
      >
        {children}
      </Tag>
      <noscript>
        <style>{'[data-stagger]{opacity:1!important;transform:none!important}'}</style>
      </noscript>
    </LazyMotion>
  )
}

export function Rise({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <m.div
        className={className}
        data-stagger
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ delay, type: 'spring', stiffness: 260, damping: 24 }}
      >
        {children}
      </m.div>
      <noscript>
        <style>{'[data-stagger]{opacity:1!important;transform:none!important}'}</style>
      </noscript>
    </LazyMotion>
  )
}

export function Pop({ on, children, className }: { on: boolean; children: ReactNode; className?: string }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <m.span
        className={className}
        data-pop
        key={String(on)}
        initial={{ scale: 0.55 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 520, damping: 14 }}
      >
        {children}
      </m.span>
    </LazyMotion>
  )
}
