import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServiceClient()

    const { data: anomali, error } = await supabase
      .from('anomali_log')
      .select('*, poktan:poktan_id(id, nama_poktan, kabupaten, provinsi)')
      .order('scanned_at', { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, anomali: anomali || [] })
  } catch (error) {
    console.error('Admin compliance error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
