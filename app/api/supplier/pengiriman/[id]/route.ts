import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET — Supplier views a single pengiriman by transaksi_id (read-only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: transaksiId } = await params

    const supabase = createServiceClient()

    const { data: pengiriman, error } = await supabase
      .from('pengiriman')
      .select(`
        *,
        transaksi(id, komoditas, grade, volume_estimasi_kg, volume_aktual_kg, status),
        poktan(id, nama_poktan, kabupaten, provinsi)
      `)
      .eq('transaksi_id', transaksiId)
      .single()

    if (error || !pengiriman) {
      return NextResponse.json({ error: 'Pengiriman tidak ditemukan' }, { status: 404 })
    }

    // Fetch events
    const { data: events } = await supabase
      .from('pengiriman_event')
      .select('*, user:users(nama_lengkap, role)')
      .eq('pengiriman_id', pengiriman.id)
      .order('created_at', { ascending: true })

    return NextResponse.json({
      success: true,
      pengiriman: { ...pengiriman, events: events || [] },
    })
  } catch (error) {
    console.error('Supplier pengiriman GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
