import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Bell, Check, Clock, ArrowLeft } from 'lucide-react'

interface KitchenOrder {
  id: string
  order_number: string
  customer_name: string
  items: { name: string; qty: number }[]
  status: 'pending' | 'confirmed' | 'preparing' | 'ready'
  created_at: string
}

export default function KitchenDisplay() {
  const [orders, setOrders] = useState<KitchenOrder[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const mockOrders: KitchenOrder[] = [
      { id: '1', order_number: 'ORD-001', customer_name: 'Customer #1', items: [{ name: 'Cappuccino', qty: 2 }, { name: 'Croissant', qty: 1 }], status: 'pending', created_at: new Date().toISOString() },
      { id: '2', order_number: 'ORD-002', customer_name: 'Customer #2', items: [{ name: 'Latte', qty: 1 }, { name: 'Muffin', qty: 2 }], status: 'preparing', created_at: new Date(Date.now() - 5 * 60000).toISOString() },
    ]
    setOrders(mockOrders)
  }, [])

  useEffect(() => {
    const channel = supabase.channel('orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        audioRef.current?.play()
        toast.info('New order received!')
        setOrders(prev => [{ id: payload.new.id, order_number: payload.new.order_number, customer_name: 'New Customer', items: [], status: 'pending', created_at: payload.new.created_at }, ...prev])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  function updateOrderStatus(id: string, status: KitchenOrder['status']) {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
  }

  function removeOrder(id: string) {
    setOrders(prev => prev.filter(o => o.id !== id))
  }

  const pendingOrders = orders.filter(o => o.status === 'pending')
  const preparingOrders = orders.filter(o => o.status === 'preparing')
  const readyOrders = orders.filter(o => o.status === 'ready')

  return (
    <div className="min-h-screen bg-slate-100">
      <audio ref={audioRef} preload="auto"><source src="/sounds/kitchen-bell.mp3" type="audio/mpeg" /></audio>
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link to="/dashboard"><Button variant="ghost" size="sm" className="gap-2"><ArrowLeft className="w-4 h-4" /> Back</Button></Link>
          <h1 className="text-xl font-bold text-slate-900">Kitchen Display</h1>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="text-sm px-3 py-1"><Clock className="w-3 h-3 mr-1" />{new Date().toLocaleTimeString()}</Badge>
          <Button size="sm" variant="outline" className="gap-2"><Bell className="w-4 h-4" /> Sound On</Button>
        </div>
      </header>

      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-400" />Pending ({pendingOrders.length})</h2>
          <div className="space-y-4">
            {pendingOrders.map(order => (
              <div key={order.id} className="bg-white border-l-4 border-amber-400 p-5 rounded-xl shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-slate-900">{order.order_number}</h3>
                  <span className="text-xs text-slate-400">{new Date(order.created_at).toLocaleTimeString()}</span>
                </div>
                <p className="text-sm text-slate-500 mb-3">{order.customer_name}</p>
                <div className="space-y-1 mb-4">
                  {order.items.map((item, i) => (<div key={i} className="text-sm text-slate-700">{item.qty}x {item.name}</div>))}
                </div>
                <Button onClick={() => updateOrderStatus(order.id, 'preparing')} className="w-full bg-amber-500 hover:bg-amber-600 text-white" size="sm">Start Preparing</Button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-400" />Preparing ({preparingOrders.length})</h2>
          <div className="space-y-4">
            {preparingOrders.map(order => (
              <div key={order.id} className="bg-white border-l-4 border-blue-400 p-5 rounded-xl shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-slate-900">{order.order_number}</h3>
                  <span className="text-xs text-slate-400">{new Date(order.created_at).toLocaleTimeString()}</span>
                </div>
                <p className="text-sm text-slate-500 mb-3">{order.customer_name}</p>
                <div className="space-y-1 mb-4">
                  {order.items.map((item, i) => (<div key={i} className="text-sm text-slate-700">{item.qty}x {item.name}</div>))}
                </div>
                <Button onClick={() => updateOrderStatus(order.id, 'ready')} className="w-full bg-blue-500 hover:bg-blue-600 text-white" size="sm">Mark Ready</Button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-400" />Ready ({readyOrders.length})</h2>
          <div className="space-y-4">
            {readyOrders.map(order => (
              <div key={order.id} className="bg-white border-l-4 border-emerald-400 p-5 rounded-xl shadow-sm">
                <div className="flex justify-between items-start mb-3"><h3 className="font-bold text-slate-900">{order.order_number}</h3></div>
                <p className="text-sm text-slate-500 mb-3">{order.customer_name}</p>
                <div className="space-y-1 mb-4">
                  {order.items.map((item, i) => (<div key={i} className="text-sm text-slate-700">{item.qty}x {item.name}</div>))}
                </div>
                <Button onClick={() => removeOrder(order.id)} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white gap-2" size="sm"><Check className="w-4 h-4" /> Complete</Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
