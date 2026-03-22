import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()

    const komoditas = request.nextUrl.searchParams.get('komoditas')
    const wilayah = request.nextUrl.searchParams.get('wilayah')
    const grade = request.nextUrl.searchParams.get('grade')

    let query = supabase
      .from('katalog_komoditas')
      .select('*, poktan:poktan_id(id, nama_poktan, kabupaten, provinsi)')
      .order('skor_kualitas', { ascending: false })
      .limit(50)

    if (komoditas) query = query.eq('nama', komoditas)
    if (wilayah) query = query.eq('wilayah', wilayah)
    if (grade) query = query.eq('grade', grade)

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, katalog: data || [] })
  } catch (error) {
    console.error('Katalog error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
