import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { BarChart3, Users, ShoppingBag, TrendingUp, QrCode, Download, Plus, Settings } from 'lucide-react'
import type { DashboardKPIs, RevenueTrend, PeakHour, MerchantCustomer } from '@/types'

export default function MerchantDashboard() {
  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState<DashboardKPIs>({ totalRevenue: 0, totalOrders: 0, aov: 0, uniqueCustomers: 0 })
  const [trends, setTrends] = useState<RevenueTrend[]>([])
  const [peakHours, setPeakHours] = useState<PeakHour[]>([])
  const [customers, setCustomers] = useState<MerchantCustomer[]>([])
  const [range, setRange] = useState<7 | 30>(30)
  const merchantId = 'demo-merchant-id'

  useEffect(() => { loadDashboardData() }, [range])

  async function loadDashboardData() {
    setLoading(true)
    try {
      const { data: kpiData } = await supabase.rpc('get_dashboard_kpis', { p_merchant_id: merchantId, p_days: range } as any)
      const kpi = kpiData as any
      if (kpi) setKpis({ totalRevenue: kpi.total_revenue || 0, totalOrders: kpi.total_orders || 0, aov: kpi.aov || 0, uniqueCustomers: kpi.unique_customers || 0 })
      const { data: trendData } = await supabase.rpc('get_revenue_trends', { p_merchant_id: merchantId, p_days: range } as any)
      if (trendData) setTrends(trendData as any)
      const { data: peakData } = await supabase.rpc('get_peak_hours', { p_merchant_id: merchantId, p_days: range } as any)
      if (peakData) setPeakHours(peakData as any)
      const { data: custData } = await supabase.from('merchant_customers').select(`total_visits, total_spent, current_cycle_visits, customers(phone_number), loyalty_rules(visit_threshold)`).eq('merchant_id', merchantId).order('total_spent', { ascending: false }).limit(50)
      if (custData) setCustomers(custData.map((c: any) => ({ phone_number: c.customers?.phone_number || '', total_visits: c.total_visits, total_spent: c.total_spent, current_cycle_visits: c.current_cycle_visits, visit_threshold: c.loyalty_rules?.visit_threshold || 5 })))
    } catch (err: any) {
      toast.error('Failed to load dashboard data')
      setKpis({ totalRevenue: 45280, totalOrders: 186, aov: 243.4, uniqueCustomers: 94 })
      setTrends([{ date: 'Jul 01', revenue: 1200 }, { date: 'Jul 05', revenue: 2100 }, { date: 'Jul 10', revenue: 1800 }, { date: 'Jul 15', revenue: 3200 }])
      setPeakHours([{ hour: '8 AM', volume: 12 }, { hour: '12 PM', volume: 45 }, { hour: '4 PM', volume: 28 }, { hour: '8 PM', volume: 35 }])
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-xl font-bold text-slate-900">ServeUp</Link>
          <span className="text-slate-400">/</span>
          <h1 className="text-lg font-semibold text-slate-700">Merchant Dashboard</h1>
        </div>
        <div className="flex gap-2">
          <Link to="/kitchen"><Button variant="outline" size="sm">Kitchen Display</Button></Link>
          <Link to="/admin"><Button variant="outline" size="sm">Admin</Button></Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-3 mb-8">
          <Button variant="outline" size="sm" className="gap-2"><QrCode className="w-4 h-4" /> Generate QR</Button>
          <Button variant="outline" size="sm" className="gap-2"><Download className="w-4 h-4" /> Download QR</Button>
          <Button variant="outline" size="sm" className="gap-2"><Plus className="w-4 h-4" /> Add Product</Button>
          <Button variant="outline" size="sm" className="gap-2"><Settings className="w-4 h-4" /> Settings</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[{ label: 'Total Revenue', value: `INR ${kpis.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'bg-emerald-100 text-emerald-600' }, { label: 'Total Orders', value: kpis.totalOrders.toString(), icon: ShoppingBag, color: 'bg-blue-100 text-blue-600' }, { label: 'Avg Order Value', value: `INR ${kpis.aov.toFixed(2)}`, icon: BarChart3, color: 'bg-purple-100 text-purple-600' }, { label: 'Unique Customers', value: kpis.uniqueCustomers.toString(), icon: Users, color: 'bg-amber-100 text-amber-600' }].map((kpi, i) => (
            <Card key={i} className="border-0 shadow-sm"><CardContent className="p-5">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${kpi.color}`}><kpi.icon className="w-5 h-5" /></div>
              <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
              <p className="text-sm text-slate-500 mt-1">{kpi.label}</p>
            </CardContent></Card>
          ))}
        </div>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList><TabsTrigger value="analytics">Analytics</TabsTrigger><TabsTrigger value="customers">Customers</TabsTrigger><TabsTrigger value="orders">Orders</TabsTrigger></TabsList>
          <TabsContent value="analytics" className="space-y-6">
            <div className="flex gap-2">
              <Button variant={range === 7 ? 'default' : 'outline'} size="sm" onClick={() => setRange(7)}>Last 7 Days</Button>
              <Button variant={range === 30 ? 'default' : 'outline'} size="sm" onClick={() => setRange(30)}>Last 30 Days</Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-sm"><CardHeader><CardTitle className="text-lg">Revenue Trajectory</CardTitle></CardHeader><CardContent>
                {loading ? <Skeleton className="h-[250px] w-full" /> : (
                  <div className="h-[250px] flex items-end gap-2">
                    {trends.map((t, i) => { const max = Math.max(...trends.map(x => x.revenue), 1); const height = (t.revenue / max) * 100; return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1"><div className="w-full bg-slate-900 rounded-t-md transition-all" style={{ height: `${height}%` }} /><span className="text-xs text-slate-500">{t.date}</span></div>
                    )})}
                  </div>
                )}
              </CardContent></Card>
              <Card className="border-0 shadow-sm"><CardHeader><CardTitle className="text-lg">Peak Operational Hours</CardTitle></CardHeader><CardContent>
                {loading ? <Skeleton className="h-[250px] w-full" /> : (
                  <div className="h-[250px] flex items-end gap-3">
                    {peakHours.map((p, i) => { const max = Math.max(...peakHours.map(x => x.volume), 1); const height = (p.volume / max) * 100; return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1"><div className="w-full bg-emerald-500 rounded-t-md transition-all" style={{ height: `${height}%` }} /><span className="text-xs text-slate-500">{p.hour}</span></div>
                    )})}
                  </div>
                )}
              </CardContent></Card>
            </div>
          </TabsContent>
          <TabsContent value="customers">
            <Card className="border-0 shadow-sm"><CardHeader><CardTitle className="text-lg">Customer Directory</CardTitle></CardHeader><CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-200"><th className="text-left py-3 px-4 font-semibold text-slate-700">Phone</th><th className="text-left py-3 px-4 font-semibold text-slate-700">Visits</th><th className="text-left py-3 px-4 font-semibold text-slate-700">Total Spent</th><th className="text-left py-3 px-4 font-semibold text-slate-700">Loyalty Progress</th></tr></thead>
                  <tbody>{customers.map((c, i) => (<tr key={i} className="border-b border-slate-100 hover:bg-slate-50"><td className="py-3 px-4 font-mono text-slate-600">{c.phone_number}</td><td className="py-3 px-4">{c.total_visits}</td><td className="py-3 px-4 font-semibold">INR {c.total_spent.toFixed(2)}</td><td className="py-3 px-4"><div className="flex items-center gap-2"><div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, ((c.current_cycle_visits || 0) / (c.visit_threshold || 5)) * 100)}%` }} /></div><span className="text-xs text-slate-500">{c.current_cycle_visits || 0}/{c.visit_threshold || 5}</span></div></td></tr>))}</tbody>
                </table>
              </div>
            </CardContent></Card>
          </TabsContent>
          <TabsContent value="orders">
            <Card className="border-0 shadow-sm p-12 text-center"><ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-4" /><p className="text-slate-500">Orders will appear here</p></Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
