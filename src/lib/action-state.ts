type Result = { error?: string; ok?: number }

export type ActionState<Extra = unknown> = (Result & Extra) | undefined

export function succeeded(): { ok: number } {
  return { ok: Date.now() }
}
