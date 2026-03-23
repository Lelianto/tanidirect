import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { queryGroqJSON } from '@/lib/groq/helpers'
import { getCache, setCache } from '@/lib/groq/cache'

export async function POST(request: NextRequest) {
  try {
    const { preOrderId } = await request.json()

    // Check cache first
    const cached = await getCache('matching', preOrderId)
    if (cached) return NextResponse.json(cached)

    const supabase = createServiceClient()

    // Fetch pre-order
    const { data: preOrder, error: poError } = await supabase
      .from('pre_order')
      .select('*')
      .eq('id', preOrderId)
      .single()

    if (poError || !preOrder) {
      return NextResponse.json({ error: 'Pre-order tidak ditemukan' }, { status: 404 })
    }

    // Fetch candidate poktan matching komoditas
    const { data: allPoktan } = await supabase
      .from('poktan')
      .select('id, nama_poktan, kabupaten, provinsi, komoditas_utama, jumlah_anggota, skor_qa, skor_ketepatan, skor_volume, is_qa_certified')

    const candidates = (allPoktan || [])
      .filter((p: any) => {
        const komoditas = Array.isArray(p.komoditas_utama) ? p.komoditas_utama : []
        return komoditas.some((k: string) => k.toLowerCase().includes(preOrder.komoditas.toLowerCase()))
      })
      .slice(0, 15)

    if (candidates.length === 0) {
      return NextResponse.json({
        ranking: [],
        rekomendasiUtama: 'Tidak ada poktan yang cocok ditemukan.',
        catatan: null,
      })
    }

    try {
      const prompt = `Kamu adalah sistem matching platform pertanian TaniDirect.

Data Pre-Order:
- Komoditas: ${preOrder.komoditas}
- Grade: ${preOrder.grade || '-'}
- Volume: ${preOrder.volume_kg} kg
- Wilayah tujuan: ${preOrder.wilayah_tujuan}
- Wilayah asal preferensi: ${preOrder.wilayah_asal || '-'}
- Tanggal dibutuhkan: ${preOrder.tanggal_dibutuhkan}

Kandidat Poktan:
${candidates.map((p: any, i: number) => `${i + 1}. ${p.nama_poktan} — Kab. ${p.kabupaten}, Prov. ${p.provinsi}, Skor QA: ${p.skor_qa}, Ketepatan: ${p.skor_ketepatan}%, Anggota: ${p.jumlah_anggota}, QA Certified: ${p.is_qa_certified}`).join('\n')}

Ranking poktan berdasarkan kesesuaian dengan PO. Pertimbangkan: kedekatan wilayah, skor QA, ketepatan, kapasitas (jumlah anggota), sertifikasi. Beri alasan spesifik per poktan dan catatan risiko jika ada.`

      const result = await queryGroqJSON<{
        ranking: Array<{
          poktanId: string
          namaPoktan: string
          skorKesesuaian: number
          alasan: string
          catatanRisiko: string | null
        }>
        rekomendasiUtama: string
        catatan: string | null
      }>({
        prompt,
        temperature: 0.3,
        maxTokens: 1500,
        jsonShape: `{
  "ranking": [{"poktanId": "...", "namaPoktan": "...", "skorKesesuaian": 85, "alasan": "...", "catatanRisiko": null}],
  "rekomendasiUtama": "...",
  "catatan": "..."
}`,
      })

      // Map AI poktanId back to real IDs
      const ranking = result.ranking.map((r, idx) => ({
        ...r,
        poktanId: candidates[idx]?.id || r.poktanId,
        namaPoktan: candidates[idx]?.nama_poktan || r.namaPoktan,
      }))

      const response = {
        ranking,
        rekomendasiUtama: result.rekomendasiUtama,
        catatan: result.catatan,
      }
      await setCache('matching', preOrderId, response, 24)

      return NextResponse.json(response)
    } catch (aiError) {
      console.error('AI matching error, using fallback:', aiError)
      return fallbackMatching(preOrder, candidates)
    }
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function fallbackMatching(preOrder: any, candidates: any[]) {
  const ranked = candidates
    .map((p: any) => {
      let skor = 50
      if (p.provinsi === (preOrder.wilayah_asal || preOrder.wilayah_tujuan)) skor += 20
      skor += (p.skor_qa / 100) * 15
      skor += (p.skor_ketepatan / 100) * 10
      if (p.is_qa_certified) skor += 5

      return {
        poktanId: p.id,
        namaPoktan: p.nama_poktan,
        skorKesesuaian: Math.min(Math.round(skor), 100),
        alasan: `Skor QA ${p.skor_qa}, ketepatan ${p.skor_ketepatan}%, ${p.jumlah_anggota} anggota, wilayah ${p.kabupaten}`,
        catatanRisiko: p.skor_qa < 70 ? 'Skor QA di bawah rata-rata platform' : null,
      }
    })
    .sort((a, b) => b.skorKesesuaian - a.skorKesesuaian)

  return NextResponse.json({
    ranking: ranked,
    rekomendasiUtama: ranked.length > 0
      ? `${ranked[0].namaPoktan} adalah pilihan terbaik dengan skor kesesuaian ${ranked[0].skorKesesuaian}%.`
      : 'Tidak ada poktan yang cocok ditemukan.',
    catatan: ranked.length > 1
      ? `${ranked.length} poktan kandidat ditemukan untuk komoditas ${preOrder.komoditas}.`
      : null,
  })
}
