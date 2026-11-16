import { StarIcon } from 'lucide-react'

export function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const box = size === 'md' ? 'size-5' : 'size-4'

  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${rating.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon
          key={star}
          aria-hidden
          className={
            star <= Math.round(rating)
              ? `${box} fill-olive-500 text-olive-500 dark:fill-olive-400 dark:text-olive-400`
              : `${box} text-olive-300 dark:text-olive-700`
          }
        />
      ))}
    </span>
  )
}
