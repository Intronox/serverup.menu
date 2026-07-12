import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { QrCode, TrendingUp, Shield, Zap, MessageSquare, BarChart3 } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <header className="bg-slate-900 text-white">
        <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">ServeUp</h1>
          <div className="flex gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" className="text-white hover:bg-slate-800">Dashboard</Button>
            </Link>
            <Link to="/kitchen">
              <Button variant="ghost" className="text-white hover:bg-slate-800">Kitchen</Button>
            </Link>
            <Link to="/admin">
              <Button variant="ghost" className="text-white hover:bg-slate-800">Admin</Button>
            </Link>
          </div>
        </nav>
        <div className="max-w-6xl mx-auto px-6 py-24 text-center">
          <h2 className="text-5xl font-bold mb-6 leading-tight">
            Smart Ordering &<br />
            <span className="text-emerald-400">Loyalty Platform</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10">
            QR-based digital menus, WhatsApp-integrated loyalty, and real-time kitchen displays 
            for modern cafes, gyms, and retail businesses.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/m/demo-cafe">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white px-8">
                View Demo Menu
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800 px-8">
                Merchant Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <h3 className="text-3xl font-bold text-center text-slate-900 mb-14">
            Everything You Need to Run Your Business
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: QrCode, title: 'QR Code Menus', desc: 'Generate branded QR codes that customers scan to view your digital menu instantly.' },
              { icon: MessageSquare, title: 'WhatsApp Loyalty', desc: 'Automatic visit tracking and reward notifications via WhatsApp.' },
              { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Track revenue, peak hours, customer behavior, and loyalty metrics.' },
              { icon: Zap, title: 'Real-time Orders', desc: 'Kitchen display system with live order updates and audio alerts.' },
              { icon: Shield, title: 'Secure Payments', desc: 'Razorpay integration with UPI, cards, and net banking support.' },
              { icon: TrendingUp, title: 'Business Growth', desc: 'Subscription management and super-admin tools for multi-tenant operations.' },
            ].map((f, i) => (
              <Card key={i} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-5">
                    <f.icon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 text-center text-sm">
        <p>ServeUp Architecture  2026. Built with Supabase + React + Tailwind.</p>
      </footer>
    </div>
  )
}
