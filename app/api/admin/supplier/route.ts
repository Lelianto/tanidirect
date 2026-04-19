import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, 'admin')
    if (auth instanceof NextResponse) return auth
    const { supabase } = auth

    const { data, error } = await supabase
      .from('supplier')
      .select('*, user:user_id(id, nama_lengkap, no_hp, is_verified, kyc_status)')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, suppliers: data || [] })
  } catch (error) {
    console.error('Admin supplier error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
