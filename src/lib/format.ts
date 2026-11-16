const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const shortDate = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
const longDate = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
const monthAndDay = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'long' })
const utcDay = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
const utcDayShort = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const count = new Intl.NumberFormat('en-US')

export function formatPrice(cents: number): string {
  return currency.format(cents / 100)
}

export function formatDate(date: Date): string {
  return shortDate.format(date)
}

export function formatDateLong(date: Date): string {
  return longDate.format(date)
}

export function formatCount(value: number): string {
  return count.format(value)
}

export function formatMonthAndDay(date: Date): string {
  return monthAndDay.format(date)
}

export function formatUtcDay(date: Date): string {
  return utcDay.format(date)
}

export function formatUtcDayShort(date: Date): string {
  return utcDayShort.format(date)
}
