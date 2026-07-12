import type { CartItem } from '@/types'

interface Props { cart: CartItem[]; brandColor: string; onCheckout: () => void }

export default function FloatingCart({ cart, brandColor, onCheckout }: Props) {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
  if (totalItems === 0) return null
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2 pointer-events-none animate-in slide-in-from-bottom-10">
      <div className="pointer-events-auto max-w-md mx-auto rounded-2xl shadow-2xl p-4 flex items-center justify-between text-white" style={{ backgroundColor: brandColor }}>
        <div className="flex flex-col">
          <span className="text-sm font-medium opacity-90">{totalItems} ITEM{totalItems !== 1 ? 'S' : ''}</span>
          <span className="text-xl font-bold">INR {totalPrice.toFixed(2)}</span>
        </div>
        <button onClick={onCheckout} className="bg-white px-6 py-3 rounded-full font-bold shadow-sm active:scale-95 transition-transform" style={{ color: brandColor }}>View Order →</button>
      </div>
    </div>
  )
}
