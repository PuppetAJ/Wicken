'use client'

import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { XIcon } from 'lucide-react'
import Image from 'next/image'
import { useRef, useState, type MouseEvent } from 'react'

const magnification = 2.2

export function ProductImage({ src, alt, objectPosition }: { src: string; alt: string; objectPosition: string }) {
  const frame = useRef<HTMLButtonElement>(null)
  const [origin, setOrigin] = useState<string | null>(null)

  function track(event: MouseEvent) {
    const box = frame.current?.getBoundingClientRect()
    if (!box) return
    const x = ((event.clientX - box.left) / box.width) * 100
    const y = ((event.clientY - box.top) / box.height) * 100
    setOrigin(`${x}% ${y}%`)
  }

  return (
    <Dialog>
      <DialogTrigger
        ref={frame}
        aria-label={`View ${alt} larger`}
        onMouseMove={track}
        onMouseLeave={() => setOrigin(null)}
        className="relative aspect-square w-full flex-1 cursor-zoom-in self-start overflow-hidden rounded-xl bg-tile focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 1600px, 100vw"
          priority
          style={{
            objectPosition,
            transform: origin ? `scale(${magnification})` : undefined,
            transformOrigin: origin ?? undefined,
          }}
          className="object-cover transition-transform duration-200 ease-out motion-reduce:transition-none"
        />
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="max-w-5xl border-0 bg-transparent p-0 shadow-none sm:max-w-5xl">
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        <div className="relative overflow-hidden rounded-xl">
          <Image src={src} alt={alt} width={1600} height={1067} className="h-auto w-full" />
          <DialogClose
            aria-label="Close"
            className="absolute top-3 right-3 rounded-full bg-white/90 p-2 text-olive-950 hover:bg-white focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <XIcon className="size-4" />
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
