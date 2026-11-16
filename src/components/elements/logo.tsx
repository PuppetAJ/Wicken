export function Logo({ className = 'size-6' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 21v-7" />
      <circle cx="12" cy="6.4" r="3.4" />
      <circle cx="7.4" cy="11.2" r="3.1" />
      <circle cx="16.6" cy="11.2" r="3.1" />
    </svg>
  )
}
