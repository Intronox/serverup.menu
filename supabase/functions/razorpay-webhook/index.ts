import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts'

serve(async (req) => {
  const signature = req.headers.get('x-razorpay-signature')
  const body = await req.text()
  const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') || ''
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(webhookSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signed = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
  const expectedSignature = Array.from(new Uint8Array(signed)).map(b => b.toString(16).padStart(2, '0')).join('')
  if (signature !== expectedSignature) return new Response('Invalid signature', { status: 400 })

  const payload = JSON.parse(body)
  if (payload.event === 'order.paid' || payload.event === 'payment.captured') {
    const payment = payload.payload.payment.entity
    const supabase = createClient(Deno.env.get('SUPABASE_URL') || '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '')
    const { data: orderData } = await supabase.from('orders').select('id, order_status, customer_id, merchant_id, final_payable_amount, reward_consumed').eq('razorpay_order_id', payment.order_id).single()
    if (!orderData || orderData.order_status === 'paid') return new Response('OK', { status: 200 })
    await supabase.from('orders').update({ order_status: 'confirmed', payment_status: 'paid', razorpay_payment_id: payment.id, updated_at: new Date().toISOString() }).eq('id', orderData.id)
    const { data: mcData } = await supabase.from('merchant_customers').select('current_cycle_visits, total_visits').eq('merchant_id', orderData.merchant_id).eq('customer_id', orderData.customer_id).single()
    const newTotalVisits = (mcData?.total_visits || 0) + 1
    const newCycleVisits = orderData.reward_consumed ? 0 : (mcData?.current_cycle_visits || 0) + 1
    await supabase.from('merchant_customers').upsert({ merchant_id: orderData.merchant_id, customer_id: orderData.customer_id, total_visits: newTotalVisits, total_spent: orderData.final_payable_amount, current_cycle_visits: newCycleVisits, updated_at: new Date().toISOString() }, { onConflict: 'merchant_id,customer_id' })
  }
  return new Response('OK', { status: 200 })
})
