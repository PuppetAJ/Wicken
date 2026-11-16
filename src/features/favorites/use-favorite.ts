'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { toggle } from './actions'

export function useFavorite(productId: number, name: string, initial: boolean) {
  const [isFavorite, setIsFavorite] = useState(initial)
  const [pending, start] = useTransition()
  const router = useRouter()

  function save() {
    start(async () => {
      const previous = isFavorite
      setIsFavorite(!previous)
      const result = await toggle(productId)
      if (result?.needsLogin || result?.error) {
        setIsFavorite(previous)
        toast.error(result.needsLogin ? 'Log in to save favorites' : result.error!)
        return
      }
      setIsFavorite(Boolean(result?.favorited))
      router.refresh()
    })
  }

  return {
    isFavorite,
    pending,
    save,
    label: isFavorite ? `Remove ${name} from your favorites` : `Save ${name} to your favorites`,
  }
}
