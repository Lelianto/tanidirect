import { NextRequest, NextResponse } from 'next/server'
import { dummyPoktan, dummyTransaksi, dummyQAInspeksi } from '@/lib/dummy'

// Demo endpoint - returns mock anomaly detection results
export async function POST(request: NextRequest) {
  try {
    const { poktanId } = await request.json()

    const poktan = dummyPoktan.find((p) => p.id === poktanId)
    if (!poktan) {
      return NextResponse.json({ error: 'Poktan tidak ditemukan' }, { status: 404 })
    }

    const transaksi = dummyTransaksi.filter((t) => t.poktan_id === poktanId)
    const qaInspeksi = dummyQAInspeksi.filter((qa) => qa.poktan_id === poktanId)

    // Mock anomaly detection
    const anomalies: Array<{
      kategori: string
      deskripsi: string
      tingkatRisiko: string
    }> = []

    // Check volume deviation
    const deviations = transaksi
      .filter((t) => t.volume_aktual_kg && t.volume_estimasi_kg)
      .map((t) => Math.abs((t.volume_aktual_kg! - t.volume_estimasi_kg) / t.volume_estimasi_kg * 100))

    const avgDeviation = deviations.length > 0
      ? deviations.reduce((sum, d) => sum + d, 0) / deviations.length
      : 0

    if (avgDeviation > 15) {
      anomalies.push({
        kategori: 'A02',
        deskripsi: `Deviasi volume rata-rata ${avgDeviation.toFixed(1)}% dalam ${deviations.length} transaksi`,
        tingkatRisiko: avgDeviation > 25 ? 'tinggi' : 'sedang',
      })
    }

    // Check QA score trend
    if (poktan.skor_qa < 70) {
      anomalies.push({
        kategori: 'A04',
        deskripsi: `Skor QA rendah: ${poktan.skor_qa}/100`,
        tingkatRisiko: poktan.skor_qa < 50 ? 'tinggi' : 'sedang',
      })
    }

    return NextResponse.json({
      poktanId,
      namaPoktan: poktan.nama_poktan,
      totalAnomalies: anomalies.length,
      anomalies,
      overallRisk: anomalies.some((a) => a.tingkatRisiko === 'tinggi') ? 'tinggi'
        : anomalies.some((a) => a.tingkatRisiko === 'sedang') ? 'sedang'
        : 'rendah',
      rekomendasi: anomalies.length > 0
        ? 'Perlu investigasi lebih lanjut oleh tim compliance.'
        : 'Tidak ditemukan anomali signifikan.',
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
