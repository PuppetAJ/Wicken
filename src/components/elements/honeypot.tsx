'use client'

import { useId } from 'react'

export function Honeypot() {
  const id = useId()

  return (
    <div aria-hidden className="absolute -left-[9999px]">
      <label htmlFor={id}>Leave this empty</label>
      <input id={id} name="website" type="text" tabIndex={-1} autoComplete="off" />
    </div>
  )
}
