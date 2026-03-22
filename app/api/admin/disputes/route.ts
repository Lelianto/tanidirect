import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('disputes')
      .select('*, transaksi:transaksi_id(id, komoditas, grade, status)')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, disputes: data || [] })
  } catch (error) {
    console.error('Admin disputes error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
