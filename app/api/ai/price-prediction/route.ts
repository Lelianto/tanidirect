import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { queryGroqJSON } from '@/lib/groq/helpers'

export async function POST(request: NextRequest) {
  try {
    const { komoditas, wilayah } = await request.json()
    const supabase = createServiceClient()

    // Check cached prediction
    const { data: cached } = await supabase
      .from('prediksi_harga')
      .select('*')
      .eq('komoditas', komoditas)
      .eq('wilayah', wilayah)
      .gte('valid_hingga', new Date().toISOString().split('T')[0])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (cached) {
      return NextResponse.json(cached)
    }

    // Fetch 12 weeks of historical data
    const twelveWeeksAgo = new Date()
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84)

    const { data: historis } = await supabase
      .from('harga_historis')
      .select('*')
      .eq('komoditas', komoditas)
      .eq('wilayah', wilayah)
      .gte('minggu', twelveWeeksAgo.toISOString().split('T')[0])
      .order('minggu', { ascending: false })

    const historisList = historis || []

    if (historisList.length === 0) {
      return NextResponse.json({
        error: `Tidak ada data historis untuk ${komoditas} di ${wilayah}`,
      }, { status: 404 })
    }

    try {
      const prompt = `Kamu adalah analis harga komoditas pertanian Indonesia.

Data Harga Historis ${komoditas} di wilayah ${wilayah} (12 minggu terakhir):
${historisList.map((h: any) => `- Minggu ${h.minggu}: Rp ${h.harga_per_kg}/kg${h.volume_total_kg ? ` (vol: ${h.volume_total_kg} kg)` : ''}`).join('\n')}

Analisis tren harga dan buat prediksi untuk 2 minggu dan 4 minggu ke depan. Sertakan estimasi min, max, dan median. Identifikasi faktor penentu dan berikan catatan penting.`

      const result = await queryGroqJSON<{
        tren: string
        estimasi_2_minggu: { min: number; max: number; median: number }
        estimasi_4_minggu: { min: number; max: number; median: number }
        faktor_penentu: string[]
        catatan_penting: string
      }>({
        prompt,
        temperature: 0.3,
        maxTokens: 1000,
        jsonShape: `{
  "tren": "naik|turun|stabil",
  "estimasi_2_minggu": {"min": 0, "max": 0, "median": 0},
  "estimasi_4_minggu": {"min": 0, "max": 0, "median": 0},
  "faktor_penentu": ["..."],
  "catatan_penting": "..."
}`,
      })

      const validHingga = new Date()
      validHingga.setDate(validHingga.getDate() + 7)

      const prediksi = {
        id: `pred-${Date.now()}`,
        komoditas,
        wilayah,
        tren: result.tren,
        estimasi_2_minggu: result.estimasi_2_minggu,
        estimasi_4_minggu: result.estimasi_4_minggu,
        faktor_penentu: result.faktor_penentu,
        catatan_penting: result.catatan_penting,
        valid_hingga: validHingga.toISOString().split('T')[0],
        created_at: new Date().toISOString(),
      }

      // Cache result
      await supabase.from('prediksi_harga').insert(prediksi).select()

      return NextResponse.json(prediksi)
    } catch (aiError) {
      console.error('AI price prediction error, using fallback:', aiError)
      return fallbackPrediction(komoditas, wilayah, historisList)
    }
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function fallbackPrediction(komoditas: string, wilayah: string, historis: any[]) {
  const recentPrice = historis[0]?.harga_per_kg || 10000
  const olderPrice = historis[Math.min(4, historis.length - 1)]?.harga_per_kg || recentPrice
  const priceDiff = recentPrice - olderPrice
  const tren = priceDiff > 500 ? 'naik' : priceDiff < -500 ? 'turun' : 'stabil'

  const variance = recentPrice * 0.1

  return NextResponse.json({
    id: `pred-${Date.now()}`,
    komoditas,
    wilayah,
    tren,
    estimasi_2_minggu: {
      min: Math.round(recentPrice - variance * 0.5),
      max: Math.round(recentPrice + variance),
      median: Math.round(recentPrice + (priceDiff > 0 ? variance * 0.3 : -variance * 0.2)),
    },
    estimasi_4_minggu: {
      min: Math.round(recentPrice - variance),
      max: Math.round(recentPrice + variance * 1.5),
      median: Math.round(recentPrice + (priceDiff > 0 ? variance * 0.5 : -variance * 0.3)),
    },
    faktor_penentu: [
      tren === 'naik' ? 'Permintaan meningkat' : 'Panen raya di beberapa daerah',
      'Kondisi cuaca',
      'Biaya logistik',
    ],
    catatan_penting: `Prediksi berdasarkan data ${historis.length} minggu terakhir. Gunakan sebagai referensi, bukan jaminan harga.`,
    valid_hingga: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    created_at: new Date().toISOString(),
  })
}
