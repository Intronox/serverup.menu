import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 max-w-md mx-auto w-full flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-6 shadow-inner"><span className="text-3xl">404</span></div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Page Not Found</h1>
      <p className="text-slate-500 mb-8 max-w-xs">The page you're looking for doesn't exist.</p>
      <Link to="/"><Button className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-full font-semibold shadow-lg">Go Home</Button></Link>
    </div>
  )
}
