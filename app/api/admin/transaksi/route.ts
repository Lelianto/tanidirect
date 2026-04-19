import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, 'admin')
    if (auth instanceof NextResponse) return auth
    const { supabase } = auth

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
