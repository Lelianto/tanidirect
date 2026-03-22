import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const supabase = createServiceClient()

    const { data: preOrder, error } = await supabase
      .from('pre_order')
      .select('*, supplier:supplier_id(id, nama_perusahaan, rating, wilayah_operasi), poktan:poktan_matched_id(id, nama_poktan, kabupaten, provinsi, skor_qa)')
      .eq('id', id)
      .single()

    if (error || !preOrder) {
      return NextResponse.json({ error: 'Pre-order tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({ success: true, pre_order: preOrder })
  } catch (error) {
    console.error('Pre-order detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
