import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { queryGroqJSON } from '@/lib/groq/helpers'
import { getCache, setCache } from '@/lib/groq/cache'
import type { DashboardInsightResponse } from '@/types'

export async function POST() {
  try {
    // Check cache first (global key, 1 hour TTL)
    const cached = await getCache('dashboard-insight', 'platform')
    if (cached) return NextResponse.json(cached)

    const supabase = createServiceClient()

    // Fetch 100 latest transactions
    const { data: transaksi } = await supabase
      .from('transaksi')
      .select('status, komoditas, total_nilai')
      .order('created_at', { ascending: false })
      .limit(100)

    // Fetch 30 latest disputes
    const { data: disputes } = await supabase
      .from('disputes')
      .select('status, kategori')
      .order('created_at', { ascending: false })
      .limit(30)

    // Fetch open anomalies
    const { data: anomali } = await supabase
      .from('anomali_log')
      .select('tingkat_risiko, temuan')
      .eq('status_tindak_lanjut', 'open')

    // Fetch aggregate poktan QA scores
    const { data: poktan } = await supabase
      .from('poktan')
      .select('skor_qa')

    // Fetch pending credit applications
    const { data: kredit } = await supabase
      .from('kredit')
      .select('status, jumlah_diajukan')
      .eq('status', 'pending')

    // Fetch open pre-orders
    const { data: preOrders } = await supabase
      .from('pre_order')
      .select('status, komoditas, volume_kg')
      .eq('status', 'open')

    const transaksiList = transaksi || []
    const disputesList = disputes || []
    const anomaliList = anomali || []
    const poktanList = poktan || []
    const kreditList = kredit || []
    const preOrderList = preOrders || []

    // Aggregate stats
    const txByStatus: Record<string, number> = {}
    transaksiList.forEach((t: any) => { txByStatus[t.status] = (txByStatus[t.status] || 0) + 1 })

    const disputeByStatus: Record<string, number> = {}
    disputesList.forEach((d: any) => { disputeByStatus[d.status] = (disputeByStatus[d.status] || 0) + 1 })

    const avgQA = poktanList.length > 0
      ? Math.round(poktanList.reduce((sum, p: any) => sum + (p.skor_qa || 0), 0) / poktanList.length)
      : 0

    const totalNilaiTx = transaksiList.reduce((sum, t: any) => sum + (t.total_nilai || 0), 0)
    const totalKreditPending = kreditList.reduce((sum, k: any) => sum + (k.jumlah_diajukan || 0), 0)
    const totalVolumePO = preOrderList.reduce((sum, p: any) => sum + (p.volume_kg || 0), 0)

    try {
      const prompt = `Kamu adalah analis bisnis AI untuk platform pertanian bernama "Taninesia". PENTING: Nama platform adalah "Taninesia", BUKAN "TaniDirect" atau nama lain. Selalu gunakan nama "Taninesia" saat menyebut platform ini. Berikan executive summary dan insight dari data platform berikut.

Statistik Transaksi (100 terakhir):
${Object.entries(txByStatus).map(([s, c]) => `- ${s}: ${c}`).join('\n')}
- Total nilai: Rp ${totalNilaiTx.toLocaleString('id-ID')}

Disputes (30 terakhir):
${Object.entries(disputeByStatus).map(([s, c]) => `- ${s}: ${c}`).join('\n') || '- Tidak ada dispute'}

Anomali Open: ${anomaliList.length}
${anomaliList.map((a: any) => `- Risiko ${a.tingkat_risiko}`).join('\n') || '- Tidak ada anomali open'}

Rata-rata Skor QA Poktan: ${avgQA}/100 (dari ${poktanList.length} poktan)

Kredit Pending: ${kreditList.length} aplikasi (total Rp ${totalKreditPending.toLocaleString('id-ID')})

Pre-Order Open: ${preOrderList.length} (total ${totalVolumePO.toLocaleString('id-ID')} kg)

Berikan ringkasan eksekutif, insight kunci, peringatan, dan rekomendasi aksi. Gunakan bahasa Indonesia.`

      const result = await queryGroqJSON<DashboardInsightResponse>({
        prompt,
        temperature: 0.5,
        maxTokens: 1500,
        jsonShape: `{
  "ringkasan": "...",
  "insights": [{"judul": "...", "deskripsi": "...", "prioritas": "tinggi|sedang|rendah"}],
  "peringatan": [{"judul": "...", "deskripsi": "..."}],
  "rekomendasiAksi": [{"aksi": "...", "alasan": "...", "prioritas": "tinggi|sedang|rendah"}]
}`,
      })

      await setCache('dashboard-insight', 'platform', result, 1)
      return NextResponse.json(result)
    } catch (aiError) {
      console.error('AI dashboard insight error, using fallback:', aiError)
      return NextResponse.json({
        ringkasan: `Platform memiliki ${transaksiList.length} transaksi terakhir, ${disputesList.length} dispute, ${anomaliList.length} anomali open, rata-rata QA ${avgQA}/100, ${kreditList.length} kredit pending, dan ${preOrderList.length} pre-order open.`,
        insights: [],
        peringatan: [],
        rekomendasiAksi: [],
      })
    }
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
