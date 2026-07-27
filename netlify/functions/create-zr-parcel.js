const { createClient } = require('@supabase/supabase-js')

const WILAYAS = [
  'Adrar','Chlef','Laghouat','Oum El Bouaghi','Batna','Bejaia','Biskra','Bechar',
  'Blida','Bouira','Tamanrasset','Tebessa','Tlemcen','Tiaret','Tizi Ouzou','Alger',
  'Djelfa','Jijel','Setif','Saida','Skikda','Sidi Bel Abbes','Annaba','Guelma',
  'Constantine','Medea','Mostaganem','MSila','Mascara','Ouargla','Oran','El Bayadh',
  'Illizi','Bordj Bou Arreridj','Boumerdes','El Tarf','Tindouf','Tissemsilt','El Oued',
  'Khenchela','Souk Ahras','Tipaza','Mila','Ain Defla','Naama','Ain Temouchent',
  'Ghardaia','Relizane','Timimoun','Bordj Badji Mokhtar','Ouled Djellal','Beni Abbes',
  'In Salah','In Guezzam','Touggourt','Djanet','El MGhair','El Meniaa',
]

function mapWilayaToNumber(name) {
  if (!name) return null
  const idx = WILAYAS.findIndex(
    (w) => w.toLowerCase() === String(name).trim().toLowerCase(),
  )
  return idx >= 0 ? idx + 1 : null
}

function buildItemsSummary(items) {
  if (!Array.isArray(items) || items.length === 0) return ''
  return items
    .map((it) => {
      const name = it.name || 'Produit'
      const size = it.size ? `/${it.size}` : ''
      const color = it.color ? `/${it.color}` : ''
      const qty = it.quantity || 1
      return `${name} (${size}${color}) x${qty}`
    })
    .join(', ')
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
    body: JSON.stringify(body),
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' }, body: '' }
  }
  if (event.httpMethod !== 'POST') {
    return json(405, { success: false, error: 'Method not allowed' })
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return json(500, { success: false, error: 'Supabase server credentials not configured' })
  }

  let orderId
  try {
    const payload = JSON.parse(event.body || '{}')
    orderId = payload.orderId
  } catch (err) {
    return json(400, { success: false, error: 'Invalid JSON body' })
  }

  if (!orderId) {
    return json(400, { success: false, error: 'orderId is required' })
  }

  const zrToken = process.env.ZR_API_TOKEN
  const zrKey = process.env.ZR_API_KEY
  if (!zrToken || !zrKey) {
    return json(500, { success: false, error: 'ZR API credentials not configured' })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // 1. Read the order (bypasses RLS via service role key)
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (orderErr || !order) {
    return json(404, { success: false, error: 'Order not found' })
  }

  // 2. Map wilaya to its official number
  const wilayaNumber = mapWilayaToNumber(order.wilaya)
  if (!wilayaNumber) {
    return json(400, { success: false, error: `Unknown wilaya: ${order.wilaya}` })
  }
  const idWilaya = String(wilayaNumber).padStart(2, '0')

  // 3. Build items summary
  const tProduit = buildItemsSummary(order.items)

  // 4. Build the ZR parcel payload
  const colisBody = {
    Colis: [
      {
        Tracking: order.id,
        TypeLivraison: order.delivery_type === 'agency' ? '0' : '1',
        TypeColis: '0',
        Confrimee: '1',
        Client: order.customer_name,
        MobileA: order.customer_phone,
        MobileB: order.customer_phone_2 || '',
        Adresse: order.address || order.commune,
        IDWilaya: idWilaya,
        Commune: order.commune,
        Total: String(order.total),
        Note: '',
        TProduit: tProduit,
        id_Externe: order.id,
        Source: 'Be Princess Collection',
      },
    ],
  }

  // 5. POST to ZR API
  let zrRes
  try {
    zrRes = await fetch('https://procolis.com/api_v1/add_colis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        token: zrToken,
        key: zrKey,
      },
      body: JSON.stringify(colisBody),
    })
  } catch (err) {
    return json(502, { success: false, error: `ZR API request failed: ${err.message}` })
  }

  let zrData
  try {
    zrData = await zrRes.json()
  } catch (err) {
    return json(502, { success: false, error: 'ZR API returned a non-JSON response' })
  }

  if (!zrRes.ok) {
    const msg = zrData?.error || zrData?.message || `ZR API error (${zrRes.status})`
    return json(502, { success: false, error: msg, raw: zrData })
  }

  // Extract tracking number from the response. ZR/procolis commonly returns
  // either { tracking: "..." } or an array under Result/Colis.
  let trackingNumber = null
  if (zrData?.tracking) {
    trackingNumber = zrData.tracking
  } else if (Array.isArray(zrData?.Result) && zrData.Result[0]?.Tracking) {
    trackingNumber = zrData.Result[0].Tracking
  } else if (Array.isArray(zrData?.Colis) && zrData.Colis[0]?.Tracking) {
    trackingNumber = zrData.Colis[0].Tracking
  } else if (zrData?.Tracking) {
    trackingNumber = zrData.Tracking
  }

  // 6. Insert delivery slip
  const { error: slipErr } = await supabase.from('delivery_slips').insert({
    order_id: order.id,
    tracking_number: trackingNumber,
    service: 'zr',
    raw_response: zrData,
  })

  if (slipErr) {
    return json(500, { success: false, error: `Failed to store delivery slip: ${slipErr.message}` })
  }

  // 7. Update order status to confirmed
  const { error: updateErr } = await supabase
    .from('orders')
    .update({ status: 'confirmed' })
    .eq('id', order.id)

  if (updateErr) {
    return json(500, { success: false, error: `Failed to update order status: ${updateErr.message}` })
  }

  return json(200, { success: true, tracking_number: trackingNumber })
}
