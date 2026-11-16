'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { demoAccounts } from '@/lib/auth/demo'
import { getSession } from '@/lib/auth/session'
import { deleteUser, renameUser } from '@/lib/db/queries/account'
import { succeeded, type ActionState } from '@/lib/action-state'

export type AccountState = ActionState

const displayName = z.object({ name: z.string().trim().min(1).max(80) })

function isDemo(email: string) {
  return email === demoAccounts.customer.email || email === demoAccounts.admin.email
}

export async function updateName(_previous: AccountState, formData: FormData): Promise<AccountState> {
  const session = await getSession()
  if (!session) return { error: 'You are not signed in.' }
  if (isDemo(session.user.email)) return { error: 'The demo accounts are shared, so they cannot be edited.' }

  const parsed = displayName.safeParse({ name: formData.get('name') })
  if (!parsed.success) return { error: 'Enter a name between 1 and 80 characters.' }

  await renameUser(session.user.id, parsed.data.name)
  revalidatePath('/', 'layout')
  return succeeded()
}

export async function deleteAccount(_previous: AccountState, formData: FormData): Promise<AccountState> {
  const session = await getSession()
  if (!session) return { error: 'You are not signed in.' }
  if (isDemo(session.user.email)) return { error: 'The demo accounts are shared, so they cannot be deleted.' }

  if (formData.get('confirm') !== session.user.email) {
    return { error: 'Type your email address exactly to confirm.' }
  }

  await auth.api.signOut({ headers: await headers() })
  await deleteUser(session.user.id)
  redirect('/')
}
