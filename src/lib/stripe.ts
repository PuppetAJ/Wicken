import 'server-only'
import Stripe from 'stripe'
import { env } from './env.ts'

export const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2026-10-28.endive' })
  : null
