import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('user_id')
    const poktanIdParam = request.nextUrl.searchParams.get('poktan_id')
    if (!userId && !poktanIdParam) {
      return NextResponse.json({ error: 'user_id atau poktan_id wajib diisi' }, { status: 400 })
    }

    const supabase = createServiceClient()

    let poktanId = poktanIdParam
    if (!poktanId && userId) {
      const { data: poktan } = await supabase.from('poktan').select('id').eq('ketua_id', userId).single()
      if (!poktan) return NextResponse.json({ error: 'Poktan tidak ditemukan' }, { status: 404 })
      poktanId = poktan.id
    }

    const { data: anggota, error } = await supabase
      .from('anggota_poktan')
      .select('*, petani:petani_id(id, nama_lengkap, no_hp, provinsi, kabupaten, kecamatan, is_verified, foto_url)')
      .eq('poktan_id', poktanId!)
      .order('tanggal_bergabung', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get kontribusi for each petani
    const petaniIds = (anggota || []).map(a => a.petani_id)
    let kontribusi: unknown[] = []
    if (petaniIds.length > 0) {
      const { data } = await supabase
        .from('kontribusi_petani')
        .select('*')
        .in('petani_id', petaniIds)
      kontribusi = data || []
    }

    return NextResponse.json({
      success: true,
      anggota: anggota || [],
      kontribusi,
    })
  } catch (error) {
    console.error('Poktan anggota error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
