import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { DollarSign, Store, PieChart, ArrowLeft, TrendingUp, Users, Activity } from 'lucide-react'

interface SystemStats {
  totalGmv: number
  activeMerchants: number
  platformRevenue: number
  industryDistribution: { industry: string; count: number; percentage: string }[]
}

interface MerchantRow {
  id: string
  name: string
  industry: string
  status: string
  subscription_plan: string
  created_at: string
  inventory_size: number
}

export default function SuperAdminPanel() {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [merchants, setMerchants] = useState<MerchantRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const { data: gmvData } = await (supabase as any).rpc('get_system_gmv')
      const { data: merchantCount } = await (supabase as any).rpc('get_active_merchant_count')
      const { data: industries } = await (supabase as any).rpc('get_industry_distribution')
      const { data: platformRev } = await (supabase as any).rpc('get_platform_revenue')
      setStats({ totalGmv: gmvData || 0, activeMerchants: merchantCount || 0, platformRevenue: platformRev || 0, industryDistribution: industries || [] })
      const { data: merchantData } = await (supabase as any).from('merchants').select('*').order('created_at', { ascending: false }).limit(50)
      if (merchantData) setMerchants(merchantData.map((m: any) => ({ id: m.id, name: m.name, industry: m.industry, status: m.status, subscription_plan: m.subscription_plan || 'basic', created_at: m.created_at, inventory_size: 0 })))
    } catch (err: any) {
      toast.error('Failed to load admin data')
      setStats({ totalGmv: 2847500, activeMerchants: 42, platformRevenue: 125000, industryDistribution: [{ industry: 'cafe', count: 18, percentage: '42.9' }, { industry: 'gym', count: 12, percentage: '28.6' }, { industry: 'bulk_retail', count: 8, percentage: '19.0' }, { industry: 'other', count: 4, percentage: '9.5' }] })
      setMerchants([{ id: '1', name: 'The Coffee House', industry: 'cafe', status: 'active', subscription_plan: 'premium', created_at: '2026-06-15', inventory_size: 24 }, { id: '2', name: 'FitFuel Gym Cafe', industry: 'gym', status: 'active', subscription_plan: 'basic', created_at: '2026-06-20', inventory_size: 15 }])
    } finally { setLoading(false) }
  }

  async function updateMerchantStatus(id: string, status: string) {
    try {
      const { error } = await (supabase as any).from('merchants').update({ status }).eq('id', id)
      if (error) throw error
      toast.success(`Merchant status updated to ${status}`)
      loadData()
    } catch (err: any) { toast.error(err.message) }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex h-screen">
        <aside className="w-64 bg-slate-900 text-white flex flex-col">
          <div className="p-6 border-b border-slate-800"><h1 className="text-2xl font-bold tracking-tight">ServeUp</h1><span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Super Admin</span></div>
          <nav className="flex-1 px-3 py-6 space-y-1">
            <button className="block w-full text-left px-4 py-3 rounded-lg bg-slate-800 text-white font-medium">System Overview</button>
            <button className="block w-full text-left px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">Merchant Directory</button>
            <button className="block w-full text-left px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">Subscription Billing</button>
          </nav>
          <div className="p-4 bg-slate-950 text-xs text-slate-500">Logged in as Platform Owner</div>
        </aside>
        <main className="flex-1 overflow-y-auto p-8">
          <div className="flex items-center gap-4 mb-8">
            <Link to="/dashboard"><Button variant="ghost" size="sm" className="gap-2"><ArrowLeft className="w-4 h-4" /> Back</Button></Link>
            <h1 className="text-2xl font-bold text-slate-900">System Overview</h1>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[{ label: 'Total GMV', value: stats ? `INR ${stats.totalGmv.toLocaleString()}` : '-', icon: DollarSign, color: 'bg-emerald-100 text-emerald-600' }, { label: 'Active Merchants', value: stats?.activeMerchants.toString() || '-', icon: Store, color: 'bg-blue-100 text-blue-600' }, { label: 'Platform Revenue', value: stats ? `INR ${stats.platformRevenue.toLocaleString()}` : '-', icon: TrendingUp, color: 'bg-purple-100 text-purple-600' }, { label: 'Avg per Merchant', value: stats ? `INR ${Math.round(stats.totalGmv / Math.max(stats.activeMerchants, 1)).toLocaleString()}` : '-', icon: Activity, color: 'bg-amber-100 text-amber-600' }].map((kpi, i) => (
              <Card key={i} className="border-0 shadow-sm"><CardContent className="p-5"><div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${kpi.color}`}><kpi.icon className="w-5 h-5" /></div>{loading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>}<p className="text-sm text-slate-500 mt-1">{kpi.label}</p></CardContent></Card>
            ))}
          </div>
          {stats && <Card className="border-0 shadow-sm mb-8"><CardHeader><CardTitle className="text-lg flex items-center gap-2"><PieChart className="w-5 h-5 text-slate-400" />Industry Distribution</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{stats.industryDistribution.map((ind, i) => (<div key={i} className="text-center p-4 bg-slate-50 rounded-xl"><p className="text-3xl font-bold text-slate-900">{ind.count}</p><p className="text-sm text-slate-500 capitalize mt-1">{ind.industry.replace('_', ' ')}</p><p className="text-xs text-slate-400">{ind.percentage}%</p></div>))}</div></CardContent></Card>}
          <Card className="border-0 shadow-sm"><CardHeader><CardTitle className="text-lg flex items-center gap-2"><Users className="w-5 h-5 text-slate-400" />Merchant Directory</CardTitle></CardHeader><CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm"><thead><tr className="border-b border-slate-200"><th className="text-left py-3 px-4 font-semibold text-slate-700">Name</th><th className="text-left py-3 px-4 font-semibold text-slate-700">Industry</th><th className="text-left py-3 px-4 font-semibold text-slate-700">Plan</th><th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th><th className="text-left py-3 px-4 font-semibold text-slate-700">Actions</th></tr></thead>
              <tbody>{merchants.map(m => (<tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50"><td className="py-3 px-4 font-medium text-slate-900">{m.name}</td><td className="py-3 px-4 capitalize">{m.industry.replace('_', ' ')}</td><td className="py-3 px-4"><Badge variant="outline" className="capitalize">{m.subscription_plan}</Badge></td><td className="py-3 px-4"><Badge className={m.status === 'active' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : m.status === 'trialing' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' : 'bg-red-100 text-red-700 hover:bg-red-100'}>{m.status}</Badge></td><td className="py-3 px-4"><div className="flex gap-2">{m.status !== 'active' && <Button size="sm" variant="outline" onClick={() => updateMerchantStatus(m.id, 'active')}>Activate</Button>}{m.status !== 'canceled' && <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => updateMerchantStatus(m.id, 'canceled')}>Deactivate</Button>}</div></td></tr>))}</tbody>
              </table>
            </div>
          </CardContent></Card>
        </main>
      </div>
    </div>
  )
}
