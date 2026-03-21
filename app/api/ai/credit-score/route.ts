import { NextRequest, NextResponse } from 'next/server'
import { dummyUsers, dummyTransaksi, dummyKontribusi, dummyKredit, dummyPoktan, dummyAnggotaPoktan } from '@/lib/dummy'

// Demo endpoint - returns mock AI credit score
// In production, this would call Groq API with petani data context
export async function POST(request: NextRequest) {
  try {
    const { petaniId } = await request.json()

    const petani = dummyUsers.find((u) => u.id === petaniId)
    if (!petani) {
      return NextResponse.json({ error: 'Petani tidak ditemukan' }, { status: 404 })
    }

    const kontribusi = dummyKontribusi.filter((k) => k.petani_id === petaniId)
    const totalTransaksi = kontribusi.length
    const totalVolume = kontribusi.reduce((sum, k) => sum + k.volume_kg, 0)
    const totalPendapatan = kontribusi.reduce((sum, k) => sum + (k.harga_diterima || 0), 0)
    const kreditHistory = dummyKredit.filter((k) => k.petani_id === petaniId)

    // Mock AI scoring logic
    let skor = 50
    if (totalTransaksi >= 3) skor += 15
    if (totalVolume >= 1000) skor += 10
    if (totalPendapatan >= 20000000) skor += 10
    if (petani.is_verified) skor += 5
    if (kreditHistory.some((k) => k.status === 'lunas')) skor += 10

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
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
