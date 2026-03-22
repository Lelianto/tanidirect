import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const poktanId = request.nextUrl.searchParams.get('poktan_id')
    if (!poktanId) {
      return NextResponse.json({ error: 'poktan_id wajib diisi' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Get poktan transactions
    const { data: transaksi } = await supabase
      .from('transaksi')
      .select('id, komoditas, grade, volume_estimasi_kg, status')
      .eq('poktan_id', poktanId)

    const txIds = (transaksi || []).map(t => t.id)
    if (txIds.length === 0) {
      return NextResponse.json({ success: true, logistik: [], transaksi: [] })
    }

    const { data: logistik, error } = await supabase
      .from('logistik')
      .select('*')
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
