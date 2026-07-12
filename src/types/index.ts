export interface Variant {
  name: string
  price_override?: number
}

export interface ProductAttributes {
  dietary?: 'veg' | 'non-veg' | 'vegan'
  variants?: Variant[]
  [key: string]: any
}

export interface Product {
  id: string
  name: string
  description?: string
  base_price: number
  image_url?: string
  attributes: ProductAttributes
  is_active?: boolean
  category_id?: string
}

export interface Category {
  category_id: string
  category_name: string
  products: Product[]
}

export interface MerchantPublicProfile {
  id: string
  name: string
  logo_url?: string
  primary_color: string
  currency: string
  slug: string
  catalog: Category[]
}

export interface CartItem {
  cart_item_id: string
  product: Product
  variant?: Variant
  quantity: number
  unit_price: number
}

export interface Customer {
  id: string
  phone_number: string
  full_name?: string
}

export interface Order {
  id: string
  order_number: string
  order_status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  subtotal: number
  discount_applied: number
  tax_amount: number
  total_amount: number
  final_payable_amount: number
  created_at: string
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  product_name_snapshot: string
  unit_price_snapshot: number
  quantity: number
  line_total: number
}

export interface LoyaltyState {
  rewardUnlocked: boolean
  discountAmount: number
  finalPayable: number
  visitsUntilNextReward: number
}

export interface DashboardKPIs {
  totalRevenue: number
  totalOrders: number
  aov: number
  uniqueCustomers: number
}

export interface RevenueTrend {
  date: string
  revenue: number
}

export interface PeakHour {
  hour: string
  volume: number
}

export interface MerchantCustomer {
  phone_number: string
  total_visits: number
  total_spent: number
  current_cycle_visits: number
  visit_threshold: number
}

export type UserRole = 'SUPER_ADMIN' | 'MERCHANT'

export interface User {
  id: string
  email: string
  role: UserRole
  merchant_id?: string
  is_active: boolean
}
