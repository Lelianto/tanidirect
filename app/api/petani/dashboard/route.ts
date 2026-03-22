import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const petaniId = request.nextUrl.searchParams.get('petani_id') || request.nextUrl.searchParams.get('user_id')
    if (!petaniId) {
      return NextResponse.json({ error: 'petani_id atau user_id wajib diisi' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const [kontribusiRes, pencairanRes, anggotaRes] = await Promise.all([
      supabase.from('kontribusi_petani')
        .select('*, transaksi:transaksi_id(id, komoditas, grade, status, harga_per_kg)')
        .eq('petani_id', petaniId)
        .order('tanggal_bayar', { ascending: false }),
      supabase.from('pencairan')
        .select('*, rekening:rekening_id(metode, provider, nomor, atas_nama)')
        .eq('petani_id', petaniId)
        .order('created_at', { ascending: false }),
      supabase.from('anggota_poktan')
        .select('*, poktan:poktan_id(id, nama_poktan)')
        .eq('petani_id', petaniId)
        .single(),
    ])

    const kontribusi = kontribusiRes.data || []
    const pencairan = pencairanRes.data || []

    const stats = {
      totalKontribusi: kontribusi.length,
      totalVolume: kontribusi.reduce((sum, k) => sum + (Number(k.volume_kg) || 0), 0),
      totalPendapatan: kontribusi.reduce((sum, k) => sum + (Number(k.harga_diterima) || 0), 0),
      saldoPending: kontribusi
        .filter(k => k.status_bayar === 'pending')
        .reduce((sum, k) => sum + (Number(k.harga_diterima) || 0), 0),
      totalPencairan: pencairan.reduce((sum, p) => sum + (Number(p.jumlah_diterima) || 0), 0),
    }

    return NextResponse.json({
      success: true,
      kontribusi,
      pencairan,
      anggota_poktan: anggotaRes.data,
      stats,
    })
  } catch (error) {
    console.error('Petani dashboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
