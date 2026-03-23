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

    // Get poktan transactions
    const { data: transaksi } = await supabase
      .from('transaksi')
      .select('id, komoditas, grade, volume_estimasi_kg, status')
      .eq('poktan_id', poktanId!)

    const txIds = (transaksi || []).map(t => t.id)
    if (txIds.length === 0) {
      return NextResponse.json({ success: true, logistik: [], transaksi: [] })
    }

    const { data: logistik, error } = await supabase
      .from('logistik')
      .select('id, transaksi_id, tier, transporter_nama, transporter_hp, kendaraan_plat, titik_asal, titik_tujuan, estimasi_tiba, aktual_tiba, status, biaya_logistik, created_at')
      .in('transaksi_id', txIds)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      logistik: logistik || [],
      transaksi: transaksi || [],
    })
  } catch (error) {
    console.error('Poktan logistik error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
