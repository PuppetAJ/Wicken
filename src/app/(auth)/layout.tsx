import Image from 'next/image'
import Link from 'next/link'
import { Logo } from '@/components/elements/logo'

export default function AuthLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 lg:px-12">
        <Link
          href="/"
          className="flex items-center gap-1.5 self-start font-display text-xl font-medium tracking-tight text-olive-950 dark:text-white"
        >
          <Logo className="size-6 shrink-0" />
          Wicken
        </Link>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
      <div className="relative hidden bg-tile lg:block">
        <Image
          src="/images/editorial-bench.jpg"
          alt="A wooden bench and two stools in a plain concrete room"
          fill
          sizes="50vw"
          priority
          className="object-cover dark:brightness-[0.8]"
        />
      </div>
    </div>
  )
}
