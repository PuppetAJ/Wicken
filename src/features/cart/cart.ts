import 'server-only'
import {
  countCartItems,
  createCart,
  createCartForUser,
  getCartIdForUser,
  getCartItems,
  isGuestCart,
} from '@/lib/db/queries/cart'
import type { CartItem } from '@/lib/db/types'
import { getSession } from '@/lib/auth/session'
import { readCartCookie, writeCartCookie } from '@/lib/cart/cookie'

async function currentCartId(): Promise<string | null> {
  const session = await getSession()
  if (session) return getCartIdForUser(session.user.id)

  const cookieId = await readCartCookie()
  return cookieId && (await isGuestCart(cookieId)) ? cookieId : null
}

export async function getCart(): Promise<CartItem[]> {
  const cartId = await currentCartId()
  return cartId ? getCartItems(cartId) : []
}

export async function getCartCount(): Promise<number> {
  const cartId = await currentCartId()
  return cartId ? countCartItems(cartId) : 0
}

export async function resolveCartId(): Promise<string> {
  const session = await getSession()
  if (session) {
    return (await getCartIdForUser(session.user.id)) ?? (await createCartForUser(session.user.id))
  }

  const cookieId = await readCartCookie()
  if (cookieId && (await isGuestCart(cookieId))) return cookieId

  const created = await createCart()
  await writeCartCookie(created)
  return created
}

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.unit_price_cents * item.quantity, 0)
}
