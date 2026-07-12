import { useState } from 'react'
import type { Product, CartItem, Variant } from '@/types'

interface ItemCardProps {
  product: Product
  cartItem?: CartItem
  onUpdateCart: (product: Product, quantity: number, variant?: Variant) => void
  brandColor: string
}

export default function ItemCard({ product, cartItem, onUpdateCart, brandColor }: ItemCardProps) {
  const [selectedVariant, setSelectedVariant] = useState<Variant | undefined>(product.attributes?.variants?.[0])
  const currentPrice = selectedVariant?.price_override ?? product.base_price
  const quantity = cartItem?.quantity || 0

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex gap-4 active:bg-slate-50 transition-all hover:shadow-md">
      <div className="w-24 h-24 flex-shrink-0 bg-slate-100 rounded-xl overflow-hidden relative">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs font-medium">{product.name.charAt(0)}</div>
        )}
      </div>
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          {product.attributes?.dietary && (
            <div className="mb-1"><span className={`inline-block w-3 h-3 rounded-full border-2 ${product.attributes.dietary === 'veg' ? 'border-emerald-600 bg-emerald-100' : 'border-red-600 bg-red-100'}`} /></div>
          )}
          <h3 className="font-bold text-slate-900 truncate">{product.name}</h3>
          {product.description && <p className="text-sm text-slate-500 line-clamp-2 mt-1 leading-snug">{product.description}</p>}
          {product.attributes?.variants && product.attributes.variants.length > 0 && (
            <select className="mt-2 text-xs bg-slate-50 border border-slate-200 rounded-lg p-1 px-2 outline-none focus:border-slate-400"
              value={selectedVariant?.name}
              onChange={(e) => setSelectedVariant(product.attributes?.variants?.find(v => v.name === e.target.value))}>
              {product.attributes.variants.map(v => <option key={v.name} value={v.name}>{v.name} {v.price_override ? `(INR ${v.price_override})` : ''}</option>)}
            </select>
          )}
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="font-bold text-slate-900">INR {currentPrice.toFixed(2)}</span>
          <div className="h-9 relative w-24">
            {quantity === 0 ? (
              <button onClick={() => onUpdateCart(product, 1, selectedVariant)} className="absolute inset-0 w-full h-full rounded-full text-white font-semibold text-sm shadow-sm active:scale-95 transition-transform" style={{ backgroundColor: brandColor }}>ADD +</button>
            ) : (
              <div className="absolute inset-0 w-full h-full bg-white border flex items-center justify-between rounded-full overflow-hidden" style={{ borderColor: brandColor }}>
                <button onClick={() => onUpdateCart(product, Math.max(0, quantity - 1), selectedVariant)} className="w-1/3 h-full flex items-center justify-center text-lg active:bg-slate-100" style={{ color: brandColor }}>−</button>
                <span className="w-1/3 text-center font-bold text-sm">{quantity}</span>
                <button onClick={() => onUpdateCart(product, quantity + 1, selectedVariant)} className="w-1/3 h-full flex items-center justify-center text-lg active:bg-slate-100" style={{ color: brandColor }}>+</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
