import { useSearchParams, Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'

export default function OrderSuccessPage() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('order_id')
  return (
    <div className="min-h-screen bg-slate-50 max-w-md mx-auto w-full flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
        <CheckCircle className="w-10 h-10 text-emerald-600" />
      </div>
      <h1 className="text-3xl font-bold text-slate-900 mb-3">Order Confirmed!</h1>
      <p className="text-slate-500 mb-2 max-w-xs">Your order has been placed successfully. We'll start preparing it right away.</p>
      {orderId && <p className="text-sm text-slate-400 mb-8 font-mono">Order ID: {orderId.slice(0, 8)}</p>}
      <Link to="/" className="w-full max-w-xs">
        <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white py-6 rounded-full text-lg font-semibold shadow-lg">Back to Home</Button>
      </Link>
    </div>
  )
}
