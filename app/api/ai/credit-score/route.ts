import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { queryGroqJSON } from '@/lib/groq/helpers'
import { getCache, setCache } from '@/lib/groq/cache'

export async function POST(request: NextRequest) {
  try {
    const { petaniId } = await request.json()

    // Check cache first
    const cached = await getCache('credit-score', petaniId)
    if (cached) return NextResponse.json(cached)

    const supabase = createServiceClient()

    // Fetch petani profile
    const { data: petani, error: petaniError } = await supabase
      .from('users')
      .select('*')
      .eq('id', petaniId)
      .single()

    if (petaniError || !petani) {
      return NextResponse.json({ error: 'Petani tidak ditemukan' }, { status: 404 })
    }

    // Fetch kontribusi with transaksi
    const { data: kontribusi } = await supabase
      .from('kontribusi_petani')
      .select('*, transaksi:transaksi_id(*)')
      .eq('petani_id', petaniId)

    const kontribusiList = kontribusi || []
    const totalTransaksi = kontribusiList.length
    const totalVolume = kontribusiList.reduce((sum, k: any) => sum + (k.volume_kg || 0), 0)
    const totalPendapatan = kontribusiList.reduce((sum, k: any) => sum + (k.harga_diterima || 0), 0)

    // Fetch kredit history
    const { data: kreditHistory } = await supabase
      .from('kredit')
      .select('*')
      .eq('petani_id', petaniId)

    const kreditList = kreditHistory || []
    const kreditLunas = kreditList.filter((k: any) => k.status === 'lunas').length
    const kreditAktif = kreditList.filter((k: any) => k.status === 'aktif').length
    const kreditDitolak = kreditList.filter((k: any) => k.status === 'ditolak').length

    // Fetch poktan membership
    const { data: anggota } = await supabase
      .from('anggota_poktan')
      .select('*, poktan:poktan_id(nama_poktan, skor_qa, is_qa_certified)')
      .eq('petani_id', petaniId)

    const anggotaList = anggota || []

    try {
      const prompt = `Kamu adalah analis kredit AI platform pertanian TaniDirect.

Profil Petani:
- Nama: ${petani.nama_lengkap}
- Provinsi: ${petani.provinsi}, Kabupaten: ${petani.kabupaten}
- Terverifikasi: ${petani.is_verified ? 'Ya' : 'Tidak'}

Statistik Transaksi:
- Total kontribusi: ${totalTransaksi} kali
- Total volume: ${totalVolume} kg
- Total pendapatan: ${formatRupiah(totalPendapatan)}

Riwayat Kredit:
- Lunas: ${kreditLunas}, Aktif: ${kreditAktif}, Ditolak: ${kreditDitolak}

Keanggotaan Poktan:
${anggotaList.map((a: any) => `- ${a.poktan?.nama_poktan || 'N/A'} (Skor QA: ${a.poktan?.skor_qa || 0}, Certified: ${a.poktan?.is_qa_certified ? 'Ya' : 'Tidak'})`).join('\n') || '- Belum tergabung'}

Analisis kelayakan kredit petani ini. Berikan skor 0-100, kategori, batas kredit yang direkomendasikan, faktor positif, faktor risiko, dan rekomendasi.`

      const result = await queryGroqJSON<{
        skor: number
        kategori: string
        batasKreditRp: number
        faktorPositif: string[]
        faktorRisiko: string[]
        rekomendasi: string
      }>({
        prompt,
        temperature: 0.3,
        maxTokens: 1000,
        jsonShape: `{
  "skor": 75,
  "kategori": "Baik",
  "batasKreditRp": 7500000,
  "faktorPositif": ["..."],
  "faktorRisiko": ["..."],
  "rekomendasi": "..."
}`,
      })

      await setCache('credit-score', petaniId, result, 168) // 7 days
      return NextResponse.json(result)
    } catch (aiError) {
      console.error('AI credit score error, using fallback:', aiError)
      return fallbackCreditScore(petani, totalTransaksi, totalVolume, totalPendapatan, kreditList)
    }
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function formatRupiah(value: number): string {
  return `Rp ${value.toLocaleString('id-ID')}`
}

function fallbackCreditScore(petani: any, totalTransaksi: number, totalVolume: number, totalPendapatan: number, kreditList: any[]) {
  let skor = 50
  if (totalTransaksi >= 3) skor += 15
  if (totalVolume >= 1000) skor += 10
  if (totalPendapatan >= 20000000) skor += 10
  if (petani.is_verified) skor += 5
  if (kreditList.some((k: any) => k.status === 'lunas')) skor += 10

  const kategori = skor >= 80 ? 'Sangat Baik'
    : skor >= 65 ? 'Baik'
    : skor >= 50 ? 'Cukup'
    : 'Perlu Perhatian'

  const batasKredit = skor >= 80 ? 10000000
    : skor >= 65 ? 7500000
    : skor >= 50 ? 5000000
    : 2000000

  return NextResponse.json({
    skor,
    kategori,
    batasKreditRp: batasKredit,
    faktorPositif: [
      totalTransaksi >= 3 ? `${totalTransaksi} transaksi selesai` : null,
      petani.is_verified ? 'Akun terverifikasi' : null,
      totalPendapatan >= 20000000 ? 'Pendapatan kumulatif baik' : null,
    ].filter(Boolean),
    faktorRisiko: [
      totalTransaksi < 3 ? 'Riwayat transaksi masih sedikit' : null,
      !petani.is_verified ? 'Akun belum terverifikasi' : null,
    ].filter(Boolean),
    rekomendasi: kategori === 'Sangat Baik' || kategori === 'Baik'
      ? 'Direkomendasikan untuk disetujui dengan batas kredit penuh.'
      : 'Pertimbangkan persetujuan dengan batas kredit lebih rendah dan tenor lebih pendek.',
  })
}
