'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/session'
import { deleteReview, setOrderStatus, updateProduct } from '@/lib/db/queries/admin'
import { markAnswered } from '@/lib/db/queries/messages'
import { messageAnswered, orderStatusEdit, productEdit, reviewTarget } from './schemas'
import { succeeded, type ActionState } from '@/lib/action-state'

export type AdminState = ActionState

export async function saveProduct(_previous: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin()

  const parsed = productEdit.safeParse({
    id: formData.get('id'),
    priceDollars: formData.get('price'),
    salePriceDollars: formData.get('salePrice'),
    stock: formData.get('stock'),
    featured: formData.get('featured'),
  })
  if (!parsed.success) return { error: 'Those values were not accepted. Check the numbers.' }

  const sale = parsed.data.salePriceDollars
  const saleCents = sale === null ? null : Math.round(sale * 100)
  const priceCents = Math.round(parsed.data.priceDollars * 100)
  if (saleCents !== null && saleCents <= 0) return { error: 'A sale price has to be more than nothing.' }
  if (saleCents !== null && saleCents >= priceCents) return { error: 'A sale price has to be below the price.' }

  const saved = await updateProduct(parsed.data.id, {
    price_cents: priceCents,
    sale_price_cents: saleCents,
    stock_quantity: parsed.data.stock,
    is_featured: parsed.data.featured,
  })
  if (!saved) return { error: 'That product could not be found.' }

  revalidatePath('/', 'layout')
  return succeeded()
}

export async function moveOrder(_previous: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin()

  const parsed = orderStatusEdit.safeParse({ id: formData.get('id'), status: formData.get('status') })
  if (!parsed.success) return { error: 'That status is not one an order can have.' }

  const moved = await setOrderStatus(parsed.data.id, parsed.data.status)
  if (!moved) return { error: 'That order could not be found.' }
  return succeeded()
}

export async function removeReview(_previous: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin()

  const parsed = reviewTarget.safeParse({ userId: formData.get('userId'), productId: formData.get('productId') })
  if (!parsed.success) return { error: 'That review could not be found.' }

  await deleteReview(parsed.data.userId, parsed.data.productId)
  revalidatePath('/', 'layout')
  return succeeded()
}

export async function answerMessage(_previous: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin()

  const parsed = messageAnswered.safeParse({
    id: formData.get('id'),
    answered: formData.get('answered') === 'true',
  })
  if (!parsed.success) return { error: 'That message could not be found.' }

  await markAnswered(parsed.data.id, parsed.data.answered)
  revalidatePath('/admin/messages')
  return succeeded()
}
