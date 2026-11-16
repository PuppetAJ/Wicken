'use server'

import { APIError } from 'better-auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { demoAccounts } from '@/lib/auth/demo'
import { limitAttempts, throttled } from '@/lib/rate-limit'
import { credentials, registration, safeNext } from './schemas'
import type { ActionState } from '@/lib/action-state'

export type AuthState = ActionState

function messageFor(error: unknown, fallback: string): string {
  if (error instanceof APIError) {
    if (error.status === 'TOO_MANY_REQUESTS') return throttled
    if (error.body?.code === 'USER_ALREADY_EXISTS') return 'An account already uses that email address.'
  }
  return fallback
}

export async function signIn(_previous: AuthState, formData: FormData): Promise<AuthState> {
  if (!(await limitAttempts('sign-in'))) return { error: throttled }

  const parsed = credentials.safeParse({ email: formData.get('email'), password: formData.get('password') })
  if (!parsed.success) return { error: 'Enter an email address and a password of at least 10 characters.' }

  try {
    await auth.api.signInEmail({ body: parsed.data, headers: await headers() })
  } catch (error) {
    return { error: messageFor(error, 'Those details do not match an account.') }
  }
  // Outside the try: redirect() works by throwing, so catching it would swallow it.
  redirect(safeNext(formData.get('next')))
}

export async function register(_previous: AuthState, formData: FormData): Promise<AuthState> {
  if (!(await limitAttempts('register'))) return { error: throttled }

  const parsed = registration.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) return { error: 'Enter your name, an email address, and a password of at least 10 characters.' }

  try {
    await auth.api.signUpEmail({ body: parsed.data, headers: await headers() })
  } catch (error) {
    return { error: messageFor(error, 'That account could not be created.') }
  }
  redirect(safeNext(formData.get('next')))
}

export async function signInWithGoogle(_previous: AuthState, formData: FormData): Promise<AuthState> {
  let url: string | undefined
  try {
    const result = await auth.api.signInSocial({
      body: { provider: 'google', callbackURL: safeNext(formData.get('next')) },
      headers: await headers(),
    })
    url = result.url
  } catch (error) {
    return { error: messageFor(error, 'Google sign-in is unavailable right now.') }
  }
  if (!url) return { error: 'Google sign-in is unavailable right now.' }
  redirect(url)
}

export async function signInAsDemo(_previous: AuthState, formData: FormData): Promise<AuthState> {
  if (!(await limitAttempts('demo', 15))) return { error: throttled }

  const account = formData.get('role') === 'admin' ? demoAccounts.admin : demoAccounts.customer

  try {
    await auth.api.signInEmail({
      body: { email: account.email, password: account.password },
      headers: await headers(),
    })
  } catch (error) {
    return { error: messageFor(error, 'The demo accounts are missing. Run `pnpm db:seed`.') }
  }
  redirect(formData.get('role') === 'admin' ? '/admin' : safeNext(formData.get('next')))
}

export async function signOut(): Promise<void> {
  await auth.api.signOut({ headers: await headers() })
  redirect('/')
}
