import type { Maker } from './db/types'

export const makerNames: Record<Maker, { name: string; where: string; what: string }> = {
  'kestrel-glass': { name: 'Kestrel Glass', where: 'Beacon, New York', what: 'blows the glass' },
  'rosedale-weaving': { name: 'Rosedale Weaving', where: 'Hudson, New York', what: 'weaves the linen' },
  'fennimore-wax': { name: 'Fennimore Wax', where: 'Kingston, New York', what: 'pours the candles' },
}

export function madeByLine(maker: Maker | null): string {
  if (!maker) return 'Made in our studio in Hudson, New York'
  const { name, where } = makerNames[maker]
  return `Made by ${name} in ${where}`
}
