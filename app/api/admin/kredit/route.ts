import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, 'admin')
    if (auth instanceof NextResponse) return auth
    const { supabase } = auth

    const { data, error } = await supabase
      .from('kredit')
      .select('*, petani:petani_id(id, nama_lengkap, no_hp), poktan:poktan_id(id, nama_poktan)')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, kredit: data || [] })
  } catch (error) {
    console.error('Admin kredit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, 'admin')
    if (auth instanceof NextResponse) return auth
    const { supabase } = auth

    const body = await request.json()
    const { kredit_id, keputusan, jumlah_disetujui, catatan } = body

    if (!kredit_id || !keputusan) {
      return NextResponse.json({ error: 'kredit_id dan keputusan wajib diisi' }, { status: 400 })
    }

    const status = keputusan === 'setujui' ? 'disetujui' : 'ditolak'

    const updateData: Record<string, unknown> = {
      status,
      tanggal_keputusan: new Date().toISOString(),
      catatan_admin: catatan || null,
    }

    if (keputusan === 'setujui' && jumlah_disetujui) {
      updateData.jumlah_disetujui = Number(jumlah_disetujui)
    }

    const { data, error } = await supabase
      .from('kredit')
      .update(updateData)
      .eq('id', kredit_id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, kredit: data })
  } catch (error) {
    console.error('Admin kredit POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
