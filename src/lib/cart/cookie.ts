import 'server-only'
import { cookies } from 'next/headers'
import { env } from '@/lib/env'

const CART_COOKIE = 'wicken_cart'

export async function readCartCookie(): Promise<string | undefined> {
  return (await cookies()).get(CART_COOKIE)?.value
}

export async function writeCartCookie(cartId: string): Promise<void> {
  ;(await cookies()).set(CART_COOKIE, cartId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
}

export async function clearCartCookie(): Promise<void> {
  ;(await cookies()).delete(CART_COOKIE)
}
