export function FormError({ children }: { children: string }) {
  return (
    <p role="alert" className="text-sm text-destructive">
      {children}
    </p>
  )
}
