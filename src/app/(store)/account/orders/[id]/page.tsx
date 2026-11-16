import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Heading } from '@/components/elements/heading'
import { requireUser } from '@/lib/auth/session'
import { getOrderForUser } from '@/lib/db/queries/orders'
import { OrderSummary } from '@/features/checkout/components/order-summary'
import { ResumePayment } from '@/features/checkout/components/resume-payment'

export const metadata = { title: 'Order' }

export const instant = false

export default async function Page({ params }: PageProps<'/account/orders/[id]'>) {
  const user = await requireUser()
  const id = Number((await params).id)
  const order = Number.isInteger(id) ? await getOrderForUser(id, user.id) : null
  if (!order) notFound()

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Link
          href="/account/orders"
          className="text-sm text-olive-600 hover:text-olive-950 dark:text-olive-400 dark:hover:text-white"
        >
          Back to your orders
        </Link>
        <Heading>Order #{order.id}</Heading>
      </div>
      <OrderSummary order={order} heading={false} />
      {order.status === 'pending' && <ResumePayment orderId={order.id} size="lg" />}
    </div>
  )
}
