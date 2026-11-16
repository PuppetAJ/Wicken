import { z } from 'zod'

export const cartLine = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(0).max(99),
})

export const cartTarget = cartLine.pick({ productId: true })
