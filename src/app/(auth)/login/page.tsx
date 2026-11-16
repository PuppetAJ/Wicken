import Link from 'next/link'
import { redirect } from 'next/navigation'
import { demoAccounts } from '@/lib/auth/demo'
import { getSession } from '@/lib/auth/session'
import { googleEnabled } from '@/lib/env'
import { safeNext } from '@/features/auth/schemas'
import { DemoLogin } from '@/features/auth/components/demo-login'
import { Divider } from '@/features/auth/components/divider'
import { GoogleButton } from '@/features/auth/components/google-button'
import { LoginForm } from '@/features/auth/components/login-form'

export const metadata = { title: 'Log in' }

export const instant = false

export default async function Page({ searchParams }: PageProps<'/login'>) {
  if (await getSession()) redirect('/')
  const next = safeNext((await searchParams).next)

  return (
    <div className="grid gap-6">
      <div className="grid gap-1.5">
        <h1 className="font-display text-3xl font-medium tracking-tight text-olive-950 dark:text-white">
          Welcome back
        </h1>
        <p className="text-sm text-olive-600 dark:text-olive-400">
          New here?{' '}
          <Link href={`/register?next=${encodeURIComponent(next)}`} className="underline underline-offset-4">
            Create an account
          </Link>
          .
        </p>
      </div>

      <LoginForm next={next} />

      {googleEnabled ? (
        <>
          <Divider />
          <GoogleButton next={next} label="Continue with Google" />
        </>
      ) : null}

      <Divider label="Or look around as" />
      <DemoLogin next={next} />
      <p className="text-xs text-olive-600 dark:text-olive-400">
        Both demo accounts use{' '}
        <code className="rounded bg-olive-950/5 px-1 py-0.5 dark:bg-white/10">{demoAccounts.customer.password}</code>,
        so you can sign in by hand too.
      </p>
    </div>
  )
}
