import { NextRequest, NextResponse } from 'next/server'
import { dummyHargaHistoris, dummyPrediksiHarga } from '@/lib/dummy'

// Demo endpoint - returns mock price prediction
export async function POST(request: NextRequest) {
  try {
    const { komoditas, wilayah } = await request.json()

    // Check cached prediction
    const cached = dummyPrediksiHarga.find(
      (p) => p.komoditas === komoditas && p.wilayah === wilayah
    )
    if (cached) {
      return NextResponse.json(cached)
    }

    // Generate mock prediction from historical data
    const historis = dummyHargaHistoris
      .filter((h) => h.komoditas === komoditas && h.wilayah === wilayah)
      .sort((a, b) => new Date(b.minggu).getTime() - new Date(a.minggu).getTime())

    if (historis.length === 0) {
      return NextResponse.json({
        error: `Tidak ada data historis untuk ${komoditas} di ${wilayah}`,
      }, { status: 404 })
    }

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
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
