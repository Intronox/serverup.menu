import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { supabase } from '@/lib/supabase'
import type { MerchantPublicProfile, Product, Variant, CartItem, LoyaltyState } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import ItemCard from '@/components/ItemCard'
import FloatingCart from '@/components/FloatingCart'
import CustomerLoginModal from '@/components/CustomerLoginModal'

export default function MerchantLandingPage() {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()
  const tableParam = searchParams.get('table')
  const [merchant, setMerchant] = useState<MerchantPublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const [showLogin, setShowLogin] = useState(false)
  const [customer, setCustomer] = useState<any>(null)
  const [loyalty, setLoyalty] = useState<LoyaltyState | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('')

  useEffect(() => {
    async function fetchMerchant() {
      if (!slug) return
      try {
        const { data, error } = await supabase.from('merchants').select(`
            id, name, logo_url, primary_color, currency, slug,
            categories!inner(id, name, display_order, products(id, name, description, base_price, image_url, attributes, is_active))
          `).eq('slug', slug).eq('status', 'active').single()
        if (error) throw error
        const merchantData = data as any
        const categories = (merchantData.categories || []).sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0)).map((cat: any) => ({
          category_id: cat.id, category_name: cat.name,
          products: (cat.products || []).filter((p: any) => p.is_active).sort((a: any, b: any) => a.name.localeCompare(b.name))
        }))
        setMerchant({ ...merchantData, catalog: categories } as MerchantPublicProfile)
        if (categories.length > 0) setActiveCategory(categories[0].category_id)
      } catch (err) { toast.error('Failed to load menu') } finally { setLoading(false) }
    }
    fetchMerchant()
  }, [slug])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => { if (user) setCustomer(user) })
  }, [])

  useEffect(() => {
    if (!customer || !merchant || cart.length === 0) { setLoyalty(null); return }
    calculateLoyalty()
  }, [cart, customer, merchant])

  async function calculateLoyalty() {
    if (!merchant || !customer) return
    const cartTotal = cart.reduce((s, i) => s + i.unit_price * i.quantity, 0)
    const { data: ruleData } = await supabase.from('loyalty_rules').select('*').eq('merchant_id', merchant.id).eq('is_active', true).single()
    const rule = ruleData as any
    if (!rule) { setLoyalty({ rewardUnlocked: false, discountAmount: 0, finalPayable: cartTotal, visitsUntilNextReward: 5 }); return }
    const { data: mcData } = await supabase.from('merchant_customers').select('current_cycle_visits').eq('merchant_id', merchant.id).eq('customer_id', customer.id).single()
    const mc = mcData as any
    const currentVisits = mc?.current_cycle_visits || 0
    const rewardUnlocked = (currentVisits + 1) >= (rule.visit_threshold || 5)
    let discountAmount = 0
    if (rewardUnlocked) {
      if (rule.reward_type === 'PERCENTAGE_DISCOUNT') { discountAmount = cartTotal * ((rule.reward_value || 0) / 100); if (rule.max_discount_amount && discountAmount > rule.max_discount_amount) discountAmount = rule.max_discount_amount }
      else if (rule.reward_type === 'FLAT_AMOUNT') discountAmount = Math.min(rule.reward_value || 0, cartTotal)
    }
    setLoyalty({ rewardUnlocked, discountAmount: Number(discountAmount.toFixed(2)), finalPayable: Number((cartTotal - discountAmount).toFixed(2)), visitsUntilNextReward: rewardUnlocked ? (rule.visit_threshold || 5) : ((rule.visit_threshold || 5) - (currentVisits + 1)) })
  }

  function handleUpdateCart(product: Product, quantity: number, variant?: Variant) {
    setCart(prev => {
      const cartItemId = `${product.id}-${variant?.name || 'base'}`
      const existing = prev.find(item => item.cart_item_id === cartItemId)
      if (quantity === 0) return prev.filter(item => item.cart_item_id !== cartItemId)
      if (existing) return prev.map(item => item.cart_item_id === cartItemId ? { ...item, quantity } : item)
      return [...prev, { cart_item_id: cartItemId, product, variant, quantity, unit_price: variant?.price_override ?? product.base_price }]
    })
  }

  async function handleCheckout() {
    if (!customer) { setShowLogin(true); return }
    if (!merchant || cart.length === 0) return
    try {
      const subtotal = cart.reduce((s, i) => s + i.unit_price * i.quantity, 0)
      const discount = loyalty?.discountAmount || 0
      const finalPayable = loyalty?.finalPayable || subtotal
      const { data: orderData, error } = await supabase.from('orders').insert({
        order_number: `ORD-${Date.now()}`, merchant_id: merchant.id, customer_id: customer.id,
        subtotal, discount_applied: discount, tax_amount: 0, final_payable_amount: finalPayable, reward_consumed: loyalty?.rewardUnlocked || false,
      } as any).select().single()
      if (error) throw error
      const order = orderData as any
      const items = cart.map(item => ({ order_id: order.id, product_id: item.product.id, product_name_snapshot: item.product.name, unit_price_snapshot: item.unit_price, quantity: item.quantity, selected_attributes: item.variant ? { variant: item.variant } : {} }))
      await supabase.from('order_items').insert(items as any)
      toast.success('Order placed!')
      setCart([])
      window.location.href = `/orders/success?order_id=${order.id}`
    } catch (err: any) { toast.error(err.message || 'Failed to place order') }
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 max-w-md mx-auto w-full p-4">
      <div className="flex items-center space-x-4 mb-8 mt-4"><Skeleton className="w-16 h-16 rounded-full" /><Skeleton className="h-6 w-1/2" /></div>
      {[1, 2, 3].map(i => (<div key={i} className="mb-6"><Skeleton className="h-5 w-1/3 mb-4" /><div className="space-y-3">{[1, 2].map(j => <Skeleton key={j} className="h-24 rounded-2xl" />)}</div></div>))}
    </div>
  )

  if (!merchant) return (
    <div className="min-h-screen bg-slate-50 max-w-md mx-auto w-full flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-6 shadow-inner"><span className="text-3xl">🔍</span></div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Menu Not Found</h1>
      <p className="text-slate-500 mb-8 max-w-xs">We couldn't find this business.</p>
      <a href="/" className="bg-slate-900 text-white px-8 py-3 rounded-full font-semibold w-full max-w-xs shadow-lg hover:scale-[1.02] transition-transform">Go Home</a>
    </div>
  )

  const brandColor = merchant.primary_color || '#0F172A'
  const categories = merchant.catalog || []

  return (
    <main className="min-h-screen bg-slate-50 max-w-md mx-auto w-full relative pb-28">
      <header className="bg-white/80 backdrop-blur-md p-6 shadow-sm flex items-center gap-4 sticky top-0 z-10 border-b border-slate-100">
        {merchant.logo_url ? (
          <img src={merchant.logo_url} alt={merchant.name} className="w-[60px] h-[60px] rounded-full object-cover shadow-sm" />
        ) : (
          <div className="w-[60px] h-[60px] rounded-full flex items-center justify-center text-white font-bold text-xl shadow-sm" style={{ backgroundColor: brandColor }}>{merchant.name.charAt(0).toUpperCase()}</div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-slate-900 leading-tight truncate">{merchant.name}</h1>
          {tableParam && <p className="text-sm text-slate-500">Table #{tableParam}</p>}
        </div>
        {customer && <button onClick={() => supabase.auth.signOut()} className="text-xs text-slate-500 hover:text-slate-900">Logout</button>}
      </header>

      <nav className="sticky top-[92px] z-40 bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-100">
        <ul className="flex overflow-x-auto px-4 py-3 gap-2" style={{ scrollbarWidth: 'none' }}>
          {categories.map(cat => (
            <li key={cat.category_id} className="shrink-0">
              <button onClick={() => { setActiveCategory(cat.category_id); document.getElementById(`cat-${cat.category_id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${activeCategory === cat.category_id ? 'text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                style={{ backgroundColor: activeCategory === cat.category_id ? brandColor : undefined }}>{cat.category_name}</button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 mt-4 space-y-10">
        {categories.map(category => (
          <section key={category.category_id} id={`cat-${category.category_id}`} className="scroll-mt-36">
            <h2 className="text-xl font-bold text-slate-900 mb-4 ml-1">{category.category_name}</h2>
            <div className="grid grid-cols-1 gap-3">{category.products?.map(product => (<ItemCard key={product.id} product={product} brandColor={brandColor} onUpdateCart={handleUpdateCart} cartItem={cart.find(item => item.product.id === product.id)} />))}</div>
          </section>
        ))}
      </div>

      {loyalty && loyalty.rewardUnlocked && (
        <div className="fixed bottom-24 left-0 right-0 max-w-md mx-auto px-4 z-30">
          <div className="bg-emerald-500 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between"><div><p className="font-bold text-sm">🎉 Reward Unlocked!</p><p className="text-xs opacity-90">Save INR {loyalty.discountAmount.toFixed(2)} on this order</p></div></div>
        </div>
      )}

      <FloatingCart cart={cart} brandColor={brandColor} onCheckout={handleCheckout} />
      {showLogin && <CustomerLoginModal merchantName={merchant.name} brandColor={brandColor} onClose={() => setShowLogin(false)} onLogin={(user) => { setCustomer(user); setShowLogin(false); }} />}
    </main>
  )
}
