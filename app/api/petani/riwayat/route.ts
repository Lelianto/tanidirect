import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const petaniId = request.nextUrl.searchParams.get('petani_id')
    if (!petaniId) {
      return NextResponse.json({ error: 'petani_id wajib diisi' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const [kontribusiRes, pencairanRes] = await Promise.all([
      supabase.from('kontribusi_petani')
        .select('*, transaksi:transaksi_id(id, komoditas, grade, status, harga_per_kg, poktan_id)')
        .eq('petani_id', petaniId)
        .order('tanggal_bayar', { ascending: false }),
      supabase.from('pencairan')
        .select('*, rekening:rekening_id(metode, provider, nomor, atas_nama)')
        .eq('petani_id', petaniId)
        .order('created_at', { ascending: false }),
    ])

    return NextResponse.json({
      success: true,
      kontribusi: kontribusiRes.data || [],
      pencairan: pencairanRes.data || [],
    })
  } catch (error) {
    console.error('Petani riwayat error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
