import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('transaksi')
      .select('*, poktan:poktan_id(id, nama_poktan), supplier:supplier_id(id, nama_perusahaan)')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, transaksi: data || [] })
  } catch (error) {
    console.error('Admin transaksi error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
