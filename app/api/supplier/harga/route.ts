import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const komoditas = request.nextUrl.searchParams.get('komoditas')
    const wilayah = request.nextUrl.searchParams.get('wilayah')

    const supabase = createServiceClient()

    // Get harga historis
    let histQuery = supabase
      .from('harga_historis')
      .select('*')
      .order('minggu', { ascending: false })
      .limit(100)

    if (komoditas) histQuery = histQuery.eq('komoditas', komoditas)
    if (wilayah) histQuery = histQuery.eq('wilayah', wilayah)

    const { data: historis, error: histError } = await histQuery

    if (histError) {
      return NextResponse.json({ error: histError.message }, { status: 500 })
    }

    // Get prediksi harga
    let predQuery = supabase
      .from('prediksi_harga')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (komoditas) predQuery = predQuery.eq('komoditas', komoditas)
    if (wilayah) predQuery = predQuery.eq('wilayah', wilayah)

    const { data: prediksi } = await predQuery

    return NextResponse.json({
      success: true,
      historis: historis || [],
      prediksi: prediksi || [],
    })
  } catch (error) {
    console.error('Harga error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
