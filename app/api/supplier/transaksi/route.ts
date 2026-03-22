import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('user_id')
    const supplierIdParam = request.nextUrl.searchParams.get('supplier_id')
    if (!userId && !supplierIdParam) {
      return NextResponse.json({ error: 'user_id atau supplier_id wajib diisi' }, { status: 400 })
    }

    const supabase = createServiceClient()

    let supplierId = supplierIdParam
    if (!supplierId && userId) {
      const { data: supplier } = await supabase.from('supplier').select('id').eq('user_id', userId).single()
      if (!supplier) return NextResponse.json({ error: 'Supplier tidak ditemukan' }, { status: 404 })
      supplierId = supplier.id
    }

    const { data: transaksi, error } = await supabase
      .from('transaksi')
      .select('*, poktan:poktan_id(id, nama_poktan, kabupaten, provinsi)')
      .eq('supplier_id', supplierId!)
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
