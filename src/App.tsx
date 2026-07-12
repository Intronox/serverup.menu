import { Routes, Route } from 'react-router'
import { Toaster } from '@/components/ui/sonner'
import MerchantLandingPage from './pages/MerchantLandingPage'
import HomePage from './pages/HomePage'
import OrderSuccessPage from './pages/OrderSuccessPage'
import MerchantDashboard from './pages/MerchantDashboard'
import KitchenDisplay from './pages/KitchenDisplay'
import SuperAdminPanel from './pages/SuperAdminPanel'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/m/:slug" element={<MerchantLandingPage />} />
        <Route path="/orders/success" element={<OrderSuccessPage />} />
        <Route path="/dashboard" element={<MerchantDashboard />} />
        <Route path="/kitchen" element={<KitchenDisplay />} />
        <Route path="/admin" element={<SuperAdminPanel />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster position="top-center" />
    </>
  )
}
