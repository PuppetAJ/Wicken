import type { Metadata } from 'next'
import { Inter, Mona_Sans } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { CartOpenProvider } from '@/features/cart/components/cart-open'
import { env } from '@/lib/env'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const monaSans = Mona_Sans({ subsets: ['latin'], variable: '--font-mona', axes: ['wdth'] })

const description =
  'Ceramics and wood from a small studio, plus a few things from workshops we trust. Made in small batches.'

export const metadata: Metadata = {
  metadataBase: new URL(env.APP_URL),
  title: { default: 'Wicken', template: '%s · Wicken' },
  description,
  openGraph: {
    type: 'website',
    siteName: 'Wicken',
    title: 'Wicken',
    description,
    url: '/',
    images: [
      { url: '/images/editorial-shelf.jpg', width: 1600, height: 1067, alt: 'A shelf of unglazed vases drying' },
    ],
  },
  twitter: { card: 'summary_large_image', title: 'Wicken', description },
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    // next-themes sets the class on <html> after hydration.
    <html
      lang="en"
      className={`${inter.variable} ${monaSans.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <CartOpenProvider>
            {children}
            <Toaster />
          </CartOpenProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
