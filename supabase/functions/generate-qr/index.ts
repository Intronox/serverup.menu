import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { merchantId } = await req.json()
  if (!merchantId) return new Response(JSON.stringify({ error: 'merchantId required' }), { status: 400, headers: { 'Content-Type': 'application/json' } })

  const supabase = createClient(Deno.env.get('SUPABASE_URL') || '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '')
  const { data: merchant } = await supabase.from('merchants').select('slug, name').eq('id', merchantId).single()
  if (!merchant || !merchant.slug) return new Response(JSON.stringify({ error: 'Merchant not found or no slug' }), { status: 404, headers: { 'Content-Type': 'application/json' } })

  const baseUrl = Deno.env.get('FRONTEND_URL') || 'https://serveup.menu'
  const targetUrl = `${baseUrl}/m/${merchant.slug}`
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(targetUrl)}`
  const qrResponse = await fetch(qrApiUrl)
  if (!qrResponse.ok) return new Response(JSON.stringify({ error: 'Failed to generate QR' }), { status: 500, headers: { 'Content-Type': 'application/json' } })

  const qrBlob = await qrResponse.blob()
  const fileName = `qr-codes/${merchantId}-${Date.now()}.png`
  const { error: uploadError } = await supabase.storage.from('merchant-assets').upload(fileName, qrBlob, { contentType: 'image/png', upsert: true })
  if (uploadError) return new Response(JSON.stringify({ error: uploadError.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })

  const { data: urlData } = supabase.storage.from('merchant-assets').getPublicUrl(fileName)
  return new Response(JSON.stringify({ success: true, url: targetUrl, qrImageUrl: urlData?.publicUrl, svg: `<svg xmlns="http://www.w3.org/2000/svg"><text x="10" y="20">${targetUrl}</text></svg>` }), { status: 200, headers: { 'Content-Type': 'application/json' } })
})
