import 'server-only'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { auth } from './index.ts'
import { hasRole } from './options.ts'

export async function getSession() {
  return auth.api.getSession({ headers: await headers() })
}

export async function requireUser(next?: string) {
  const session = await getSession()
  if (!session) redirect(next ? `/login?next=${encodeURIComponent(next)}` : '/login')
  return session.user
}

export async function requireAdmin() {
  const session = await getSession()
  if (!session) redirect('/login?next=/admin')
  if (!hasRole(session.user, 'admin')) notFound()
  return session.user
}
