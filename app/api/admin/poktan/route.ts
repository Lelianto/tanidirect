import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('poktan')
      .select('*, ketua:ketua_id(id, nama_lengkap, no_hp)')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, poktan: data || [] })
  } catch (error) {
    console.error('Admin poktan error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
