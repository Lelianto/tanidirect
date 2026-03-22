import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supplierId = request.nextUrl.searchParams.get('supplier_id')
    if (!supplierId) {
      return NextResponse.json({ error: 'supplier_id wajib diisi' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: transaksi, error } = await supabase
      .from('transaksi')
      .select('*, poktan:poktan_id(id, nama_poktan, kabupaten, provinsi)')
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, transaksi: transaksi || [] })
  } catch (error) {
    console.error('Supplier transaksi error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
