import { z } from 'zod'
import { eventNames } from './db/types'

export const trackedEvent = z.object({
  name: z.enum(eventNames),
  session: z.string().min(8).max(64),
  path: z.string().min(1).max(512),
  productId: z.coerce.number().int().positive().nullish(),
})
