'use client'

import { domAnimation, LazyMotion, m, type Variants } from 'motion/react'
import { Children, useCallback, useRef, type ReactNode } from 'react'

const step = 0.06
// Past this the delay stops growing, or the last tile of a tall screenful arrives a second late.
const most = 9
// A pause longer than this is a new arrival rather than the same one, so the count starts over.
const apart = 120

const rise: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  // `take` is called here so the queue place is claimed when the tile starts, not when it rendered.
  shown: (take: () => number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    // A spring rather than an ease: the small overshoot reads as arriving rather than fading.
    transition: { delay: take() * step, type: 'spring', stiffness: 260, damping: 22 },
  }),
}

/** Wraps server-rendered children so only the wrapper ships; the delay counts arrivals, not positions. */
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
      {/* Motion's hidden state is in the server markup, so without JavaScript nothing is ever revealed. */}
      <noscript>
        <style>{'[data-stagger]{opacity:1!important;transform:none!important}'}</style>
      </noscript>
    </LazyMotion>
  )
}

/** Plays on mount, for what is already on screen: `Rise` would wait to be scrolled to. */
export function Enter({
  children,
  className,
  delay = 0,
  as = 'div',
}: {
  children: ReactNode
  className?: string
  delay?: number
  /** A span where the parent only accepts phrasing content, such as inside a heading. */
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

/** One thing rising into place, for a heading or a panel rather than a list. */
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

/** A spring, which CSS transitions cannot do; no movement at all when motion is not wanted. */
export function Pop({ on, children, className }: { on: boolean; children: ReactNode; className?: string }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <m.span
        className={className}
        data-pop
        // Keyed on the state, so the spring replays each time it flips rather than only on mount.
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
