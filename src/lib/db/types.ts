export const categories = ['tableware', 'vases', 'lighting', 'furniture', 'textiles', 'storage'] as const
export type Category = (typeof categories)[number]

export const orderStatuses = ['pending', 'paid', 'canceled'] as const
export type OrderStatus = (typeof orderStatuses)[number]

export const eventNames = ['view', 'product_view', 'add_to_cart', 'checkout_started', 'purchase'] as const
export type EventName = (typeof eventNames)[number]

export const reviewSorts = ['helpful', 'recent', 'highest', 'lowest'] as const
export type ReviewSort = (typeof reviewSorts)[number]

export const makers = ['kestrel-glass', 'rosedale-weaving', 'fennimore-wax'] as const
export type Maker = (typeof makers)[number]

export type Product = {
  id: number
  slug: string
  name: string
  description: string
  category: Category
  price_cents: number
  sale_price_cents: number | null
  stock_quantity: number
  dimensions: string | null
  materials: string | null
  specs: Record<string, Record<string, string>>
  image_url: string | null
  is_featured: boolean
  made_by: Maker | null
  created_at: Date
}

export type CartItem = {
  product_id: number
  slug: string
  name: string
  category: Category
  image_url: string | null
  unit_price_cents: number
  stock_quantity: number
  quantity: number
}

export type OrderItem = {
  product_id: number | null
  product_name: string
  product_slug: string
  image_url: string | null
  quantity: number
  unit_price_cents: number
}

export type Order = {
  id: number
  user_id: string
  status: OrderStatus
  stripe_session_id: string | null
  total_cents: number
  created_at: Date
  paid_at: Date | null
  items: OrderItem[]
}

export type PriceRange = { fromCents: number; belowCents: number | null }
