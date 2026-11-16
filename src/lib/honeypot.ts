export function isBot(formData: FormData): boolean {
  return Boolean(formData.get('website'))
}
