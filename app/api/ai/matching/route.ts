import { NextRequest, NextResponse } from 'next/server'
import { dummyPreOrders, dummyPoktan } from '@/lib/dummy'

// Demo endpoint - returns mock AI matching results
export async function POST(request: NextRequest) {
  try {
    const { preOrderId } = await request.json()

    const preOrder = dummyPreOrders.find((po) => po.id === preOrderId)
    if (!preOrder) {
      return NextResponse.json({ error: 'Pre-order tidak ditemukan' }, { status: 404 })
    }

    // Mock matching: filter poktan by komoditas match
    const candidates = dummyPoktan
      .filter((p) => p.komoditas_utama.includes(preOrder.komoditas))
      .map((p) => {
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
      ranking: candidates,
      rekomendasiUtama: candidates.length > 0
        ? `${candidates[0].namaPoktan} adalah pilihan terbaik dengan skor kesesuaian ${candidates[0].skorKesesuaian}%.`
        : 'Tidak ada poktan yang cocok ditemukan.',
      catatan: candidates.length > 1
        ? `${candidates.length} poktan kandidat ditemukan untuk komoditas ${preOrder.komoditas}.`
        : null,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
