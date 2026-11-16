'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

const KEY = 'wicken.session'

function sessionId(): string | null {
  try {
    const existing = sessionStorage.getItem(KEY)
    if (existing) return existing
    const made = crypto.randomUUID()
    sessionStorage.setItem(KEY, made)
    return made
  } catch {
    return null
  }
}

export function track(name: string, productId?: number | null): void {
  const session = sessionId()
  if (!session) return

  const body = JSON.stringify({ name, session, path: location.pathname, productId: productId ?? null })
  if (navigator.sendBeacon?.('/api/events', new Blob([body], { type: 'application/json' }))) return
  fetch('/api/events', { method: 'POST', body, keepalive: true }).catch(() => {})
}

export function TrackView() {
  const path = usePathname()
  useEffect(() => track('view'), [path])
  return null
}

export function TrackProduct({ productId }: { productId: number }) {
  useEffect(() => track('product_view', productId), [productId])
  return null
}

export function TrackPurchase({ orderId }: { orderId: number }) {
  useEffect(() => track('purchase'), [orderId])
  return null
}
