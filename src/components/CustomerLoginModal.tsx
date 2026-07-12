import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X } from 'lucide-react'
import { toast } from 'sonner'

interface Props { merchantName: string; brandColor: string; onClose: () => void; onLogin: (user: any) => void }

export default function CustomerLoginModal({ merchantName, brandColor, onClose, onLogin }: Props) {
  const [step, setStep] = useState<1 | 2>(1)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (step === 2 && countdown > 0) { const timer = setInterval(() => setCountdown(c => c - 1), 1000); return () => clearInterval(timer) }
  }, [step, countdown])

  async function handleRequestOtp(e?: React.FormEvent) {
    e?.preventDefault(); setIsLoading(true)
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`
    try { const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone }); if (error) throw error; setStep(2); setCountdown(60); toast.success('OTP sent to your phone') }
    catch (err: any) { toast.error(err.message || 'Failed to send OTP') } finally { setIsLoading(false) }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault(); setIsLoading(true)
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`
    try { const { data, error } = await supabase.auth.verifyOtp({ phone: formattedPhone, token: otp, type: 'sms' }); if (error) throw error; toast.success('Login successful!'); onLogin(data.user) }
    catch (err: any) { toast.error(err.message || 'Invalid OTP') } finally { setIsLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md sm:rounded-2xl rounded-t-2xl p-6 pb-8 animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"><X className="w-4 h-4 text-slate-600" /></button>
        <h2 className="text-2xl font-bold mb-2 text-slate-900">Login to {merchantName}</h2>
        <p className="text-slate-500 mb-6 text-sm">{step === 1 ? 'Enter your phone number to view the menu and earn rewards.' : `We sent a code to ${phone}`}</p>
        {step === 1 ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <input type="tel" placeholder="Mobile Number (e.g., +919876543210)" required autoFocus className="w-full p-4 border border-slate-200 rounded-xl text-lg outline-none focus:border-slate-900 transition-colors bg-slate-50" value={phone} onChange={e => setPhone(e.target.value)} />
            <button type="submit" disabled={isLoading} className="w-full text-white font-semibold py-4 rounded-full text-lg shadow-lg disabled:opacity-70 active:scale-95 transition-all" style={{ backgroundColor: brandColor }}>{isLoading ? 'Sending...' : 'Get OTP'}</button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <input type="text" placeholder="Enter 6-digit OTP" required autoFocus maxLength={6} className="w-full p-4 border border-slate-200 rounded-xl text-center text-2xl tracking-[0.5em] outline-none focus:border-slate-900 bg-slate-50" value={otp} onChange={e => setOtp(e.target.value.replace(/\\D/g, '').slice(0, 6))} />
            <button type="submit" disabled={isLoading || otp.length !== 6} className="w-full text-white font-semibold py-4 rounded-full text-lg shadow-lg disabled:opacity-70 active:scale-95 transition-all" style={{ backgroundColor: brandColor }}>{isLoading ? 'Verifying...' : 'Verify & Continue'}</button>
            <div className="text-center mt-4 text-sm text-slate-500">{countdown > 0 ? `Resend code in ${countdown}s` : <button type="button" onClick={handleRequestOtp} className="text-slate-900 font-semibold underline">Resend OTP</button>}</div>
          </form>
        )}
      </div>
    </div>
  )
}
