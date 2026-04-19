import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, 'admin')
    if (auth instanceof NextResponse) return auth
    const { supabase } = auth

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

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, 'admin')
    if (auth instanceof NextResponse) return auth
    const { supabase } = auth

    const body = await request.json()
    const { anomali_id, keputusan, catatan, admin_id } = body

    if (!anomali_id || !keputusan) {
      return NextResponse.json({ error: 'anomali_id dan keputusan wajib diisi' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {
      status_tindak_lanjut: keputusan === 'clear' ? 'selesai' : 'ditangani',
      catatan_admin: catatan || null,
      resolved_at: new Date().toISOString(),
    }

    if (admin_id) {
      updateData.ditangani_oleh = admin_id
    }

    const { data, error } = await supabase
      .from('anomali_log')
      .update(updateData)
      .eq('id', anomali_id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, anomali: data })
  } catch (error) {
    console.error('Admin compliance POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
