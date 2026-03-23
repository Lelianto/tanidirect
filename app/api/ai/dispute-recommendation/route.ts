import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { queryGroqJSON } from '@/lib/groq/helpers'
import { getCache, setCache } from '@/lib/groq/cache'
import type { DisputeRecommendationResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { disputeId } = await request.json()

    // Check cache first
    const cached = await getCache('dispute-recommendation', disputeId)
    if (cached) return NextResponse.json(cached)

    const supabase = createServiceClient()

    // Fetch dispute with transaksi
    const { data: dispute, error: disputeError } = await supabase
      .from('disputes')
      .select('*, transaksi:transaksi_id(*)')
      .eq('id', disputeId)
      .single()

    if (disputeError || !dispute) {
      return NextResponse.json({ error: 'Dispute tidak ditemukan' }, { status: 404 })
    }

    // Fetch evidence
    const { data: evidence } = await supabase
      .from('dispute_evidence')
      .select('id, tipe, deskripsi, uploaded_by')
      .eq('dispute_id', disputeId)

    // Fetch timeline
    const { data: timeline } = await supabase
      .from('dispute_timeline')
      .select('id, aksi, oleh, catatan, created_at')
      .eq('dispute_id', disputeId)
      .order('created_at', { ascending: true })

    // Fetch QA inspection for this transaction
    const { data: qaInspeksi } = await supabase
      .from('qa_inspeksi')
      .select('id, grade_hasil, skor_kualitas, status, supplier_review_status')
      .eq('transaksi_id', dispute.transaksi_id)
      .limit(1)

    // Fetch 5 similar resolved disputes as precedent
    const { data: preseden } = await supabase
      .from('disputes')
      .select('id, kategori, resolusi, kompensasi, status')
      .eq('kategori', dispute.kategori)
      .eq('status', 'selesai')
      .neq('id', disputeId)
      .order('updated_at', { ascending: false })
      .limit(5)

    const evidenceList = evidence || []
    const timelineList = timeline || []
    const qaList = qaInspeksi || []
    const presedenList = preseden || []

    try {
      const prompt = `Kamu adalah mediator sengketa AI untuk platform pertanian bernama "Taninesia".

Detail Dispute:
- ID: ${dispute.id}
- Kategori: ${dispute.kategori}
- Status: ${dispute.status}
- Pelapor: ${dispute.pelapor_nama} (${dispute.pelapor_role})
- Terlapor: ${dispute.terlapor_nama}
- Deskripsi: ${dispute.deskripsi}
- SLA Deadline: ${dispute.sla_deadline}

Transaksi Terkait:
- Komoditas: ${dispute.transaksi?.komoditas || '-'}
- Volume: ${dispute.transaksi?.volume_estimasi_kg || 0} kg (estimasi), ${dispute.transaksi?.volume_aktual_kg || '?'} kg (aktual)
- Harga: Rp ${dispute.transaksi?.harga_per_kg || 0}/kg
- Total Nilai: Rp ${dispute.transaksi?.total_nilai || 0}
- Status Transaksi: ${dispute.transaksi?.status || '-'}

Bukti (${evidenceList.length}):
${evidenceList.map((e: any) => `- [${e.tipe}] ${e.deskripsi} (oleh: ${e.uploaded_by})`).join('\n') || '- Tidak ada bukti'}

Timeline (${timelineList.length} aksi):
${timelineList.map((t: any) => `- ${t.aksi} oleh ${t.oleh}${t.catatan ? `: ${t.catatan}` : ''}`).join('\n') || '- Tidak ada timeline'}

Data QA Inspeksi:
${qaList.length > 0 ? qaList.map((q: any) => `- Grade: ${q.grade_hasil || '?'}, Skor: ${q.skor_kualitas || '?'}, Status: ${q.status}, Supplier Review: ${q.supplier_review_status || '-'}`).join('\n') : '- Tidak ada data QA'}

Preseden (${presedenList.length} kasus serupa yang sudah selesai):
${presedenList.map((p: any) => `- ${p.id}: resolusi="${p.resolusi || '-'}", kompensasi=Rp ${p.kompensasi || 0}`).join('\n') || '- Tidak ada preseden'}

Berikan rekomendasi resolusi berdasarkan data di atas. Pertimbangkan preseden kasus serupa.`

      const result = await queryGroqJSON<DisputeRecommendationResponse>({
        prompt,
        temperature: 0.5,
        maxTokens: 1200,
        jsonShape: `{
  "rekomendasiResolusi": "kompensasi|tolak|mediasi|eskalasi",
  "kompensasiSaran": 0,
  "alasan": "...",
  "preseden": ["referensi kasus serupa..."],
  "tingkatKepercayaan": "tinggi|sedang|rendah"
}`,
      })

      await setCache('dispute-recommendation', disputeId, result, 24)
      return NextResponse.json(result)
    } catch (aiError) {
      console.error('AI dispute recommendation error, using fallback:', aiError)
      return fallbackRecommendation(dispute, qaList)
    }
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function fallbackRecommendation(dispute: any, qaList: any[]) {
  const skorQA = qaList[0]?.skor_kualitas || 0
  const isKualitas = dispute.kategori === 'kualitas'
  const totalNilai = dispute.transaksi?.total_nilai || 0

  let rekomendasiResolusi: 'kompensasi' | 'tolak' | 'mediasi' | 'eskalasi' = 'mediasi'
  let kompensasiSaran = 0

  if (isKualitas && skorQA < 60) {
    rekomendasiResolusi = 'kompensasi'
    kompensasiSaran = Math.round(totalNilai * 0.3)
  }

  return NextResponse.json({
    rekomendasiResolusi,
    kompensasiSaran,
    alasan: isKualitas && skorQA < 60
      ? `Skor QA rendah (${skorQA}) menunjukkan masalah kualitas. Kompensasi 30% dari nilai transaksi direkomendasikan.`
      : 'Data belum cukup untuk keputusan otomatis. Mediasi direkomendasikan untuk memperoleh informasi lebih lanjut.',
    preseden: [],
    tingkatKepercayaan: 'rendah' as const,
  })
}
