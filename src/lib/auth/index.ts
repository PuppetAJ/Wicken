import 'server-only'
import { betterAuth } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'
import { adoptGuestCart } from '@/lib/cart/merge'
import { authOptions } from './options.ts'

export const auth = betterAuth({
  ...authOptions,
  plugins: [nextCookies()],
  databaseHooks: {
    session: { create: { after: async (session) => adoptGuestCart(session.userId) } },
  },
})
