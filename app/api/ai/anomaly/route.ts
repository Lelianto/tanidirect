import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { queryGroqJSON } from '@/lib/groq/helpers'
import { getCache, setCache } from '@/lib/groq/cache'

export async function POST(request: NextRequest) {
  try {
    const { poktanId } = await request.json()

    // Check cache first
    const cached = await getCache('anomaly', poktanId)
    if (cached) return NextResponse.json(cached)

    const supabase = createServiceClient()

    // Fetch poktan profile
    const { data: poktan, error: poktanError } = await supabase
      .from('poktan')
      .select('*')
      .eq('id', poktanId)
      .single()

    if (poktanError || !poktan) {
      return NextResponse.json({ error: 'Poktan tidak ditemukan' }, { status: 404 })
    }

    // Fetch 20 latest transactions
    const { data: transaksi } = await supabase
      .from('transaksi')
      .select('*')
      .eq('poktan_id', poktanId)
      .order('created_at', { ascending: false })
      .limit(20)

    const transaksiList = transaksi || []

    // Fetch 20 latest QA inspections
    const { data: qaInspeksi } = await supabase
      .from('qa_inspeksi')
      .select('*')
      .eq('poktan_id', poktanId)
      .order('created_at', { ascending: false })
      .limit(20)

    const qaList = qaInspeksi || []

    try {
      const prompt = `Kamu adalah sistem deteksi anomali platform pertanian TaniDirect.

Profil Poktan: ${poktan.nama_poktan}
- Skor QA: ${poktan.skor_qa}/100
- Skor Ketepatan: ${poktan.skor_ketepatan}%
- Total Transaksi: ${poktan.total_transaksi}
- QA Certified: ${poktan.is_qa_certified ? 'Ya' : 'Tidak'}

Transaksi Terakhir (${transaksiList.length}):
${transaksiList.map((t: any) => `- ${t.komoditas} | Vol estimasi: ${t.volume_estimasi_kg}kg, aktual: ${t.volume_aktual_kg || '?'}kg | Harga: ${t.harga_per_kg}/kg | Status: ${t.status}`).join('\n') || '- Tidak ada data'}

Inspeksi QA Terakhir (${qaList.length}):
${qaList.map((q: any) => `- Grade: ${q.grade_hasil || '?'} | Skor: ${q.skor_kualitas || '?'} | Status: ${q.status} | Supplier review: ${q.supplier_review_status || '-'}`).join('\n') || '- Tidak ada data'}

Deteksi pola anomali:
1. Deviasi volume (estimasi vs aktual)
2. Penurunan kualitas QA
3. Harga tidak wajar
4. Transaksi sengketa berulang

Untuk setiap anomali, beri kategori (A01-A05), deskripsi, dan tingkat risiko.`

      const result = await queryGroqJSON<{
        totalAnomalies: number
        anomalies: Array<{
          kategori: string
          deskripsi: string
          tingkatRisiko: string
        }>
        overallRisk: string
        rekomendasi: string
      }>({
        prompt,
        temperature: 0.3,
        maxTokens: 1200,
        jsonShape: `{
  "totalAnomalies": 0,
  "anomalies": [{"kategori": "A01", "deskripsi": "...", "tingkatRisiko": "tinggi|sedang|rendah"}],
  "overallRisk": "tinggi|sedang|rendah",
  "rekomendasi": "..."
}`,
      })

      // Log high-risk anomalies
      const highRiskAnomalies = result.anomalies.filter((a) => a.tingkatRisiko === 'tinggi')
      if (highRiskAnomalies.length > 0) {
        await supabase.from('anomali_log').insert({
          poktan_id: poktanId,
          tingkat_risiko: 'tinggi',
          temuan: { anomalies: highRiskAnomalies, source: 'ai_detection' },
          rekomendasi: result.rekomendasi,
          status_tindak_lanjut: 'open',
          scanned_at: new Date().toISOString(),
        })
      }

      const response = {
        poktanId,
        namaPoktan: poktan.nama_poktan,
        totalAnomalies: result.totalAnomalies,
        anomalies: result.anomalies,
        overallRisk: result.overallRisk,
        rekomendasi: result.rekomendasi,
      }
      await setCache('anomaly', poktanId, response, 6)

      return NextResponse.json(response)
    } catch (aiError) {
      console.error('AI anomaly detection error, using fallback:', aiError)
      return fallbackAnomaly(poktanId, poktan, transaksiList)
    }
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function fallbackAnomaly(poktanId: string, poktan: any, transaksi: any[]) {
  const anomalies: Array<{ kategori: string; deskripsi: string; tingkatRisiko: string }> = []

  const deviations = transaksi
    .filter((t: any) => t.volume_aktual_kg && t.volume_estimasi_kg)
    .map((t: any) => Math.abs((t.volume_aktual_kg - t.volume_estimasi_kg) / t.volume_estimasi_kg * 100))

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
}
