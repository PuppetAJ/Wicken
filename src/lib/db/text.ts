/** Postgres has no representation for a null byte in text, so it throws rather than store one. */
export function withoutNulls(value: string): string {
  return value.replaceAll('\u0000', '')
}

export function searchTerm(value: string): string {
  return withoutNulls(value).replace(/[\\%_]/g, (character) => `\\${character}`)
}
