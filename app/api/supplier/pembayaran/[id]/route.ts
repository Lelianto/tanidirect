import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET — Fetch single pembayaran by ID (for supplier detail page)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('pembayaran_escrow')
      .select(`
        *,
        pre_order(id, komoditas, grade, volume_kg, harga_penawaran_per_kg, status, tanggal_dibutuhkan, wilayah_tujuan),
        supplier(id, nama_perusahaan, user_id)
      `)
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Pembayaran tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({ success: true, pembayaran: data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
