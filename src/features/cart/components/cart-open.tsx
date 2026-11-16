'use client'

import { createContext, use, useState, type ReactNode } from 'react'

const CartOpenContext = createContext<{ open: boolean; setOpen: (open: boolean) => void } | null>(null)

export function CartOpenProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return <CartOpenContext value={{ open, setOpen }}>{children}</CartOpenContext>
}

export function useCartOpen() {
  const context = use(CartOpenContext)
  if (!context) throw new Error('useCartOpen must be used within CartOpenProvider')
  return context
}
