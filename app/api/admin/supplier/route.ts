import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('supplier')
      .select('*, user:user_id(id, nama_lengkap, no_hp, is_verified, kyc_status)')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, suppliers: data || [] })
  } catch (error) {
    console.error('Admin supplier error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
