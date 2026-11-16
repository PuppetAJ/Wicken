import type { Role } from './options.ts'

export const demoAccounts = {
  customer: { name: 'Demo Shopper', email: 'shopper@wicken.store', password: 'demo-password' },
  admin: { name: 'Demo Admin', email: 'admin@wicken.store', password: 'demo-password' },
} satisfies Record<Role, { name: string; email: string; password: string }>
