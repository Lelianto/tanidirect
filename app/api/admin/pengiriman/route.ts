import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { StatusPengiriman } from '@/types'

const STATUS_ORDER: StatusPengiriman[] = [
  'disiapkan', 'dijemput', 'dalam_perjalanan', 'tiba_di_tujuan', 'diterima',
]

// GET — List all pengiriman for admin
export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get('status')

    const supabase = createServiceClient()

    let query = supabase
      .from('pengiriman')
      .select(`
        *,
        transaksi(id, komoditas, grade, volume_estimasi_kg, status),
        poktan(id, nama_poktan, kabupaten),
        supplier(id, nama_perusahaan)
      `)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('current_status', status)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, pengiriman: data || [] })
  } catch (error) {
    console.error('Admin pengiriman GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — Admin adds event as fallback (same logic as poktan)
export async function POST(request: NextRequest) {
  try {
    const { pengiriman_id, status, catatan, foto_url, lokasi_teks, admin_id } = await request.json()

    if (!pengiriman_id || !status || !admin_id) {
      return NextResponse.json(
        { error: 'pengiriman_id, status, dan admin_id wajib diisi' },
        { status: 400 }
      )
    }

    if (!STATUS_ORDER.includes(status)) {
      return NextResponse.json({ error: `Status tidak valid: ${status}` }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Get current pengiriman
    const { data: pengiriman, error: pError } = await supabase
      .from('pengiriman')
      .select('id, current_status, poktan_id, supplier_id, transaksi_id, poktan(ketua_id), supplier(user_id)')
      .eq('id', pengiriman_id)
      .single()

    if (pError || !pengiriman) {
      return NextResponse.json({ error: 'Pengiriman tidak ditemukan' }, { status: 404 })
    }

    // Forward-only check
    const currentIdx = STATUS_ORDER.indexOf(pengiriman.current_status as StatusPengiriman)
    const newIdx = STATUS_ORDER.indexOf(status)

    if (newIdx <= currentIdx) {
      return NextResponse.json(
        { error: `Tidak bisa mengubah status dari "${pengiriman.current_status}" ke "${status}"` },
        { status: 400 }
      )
    }

    // Insert event
    const { data: event, error: insertError } = await supabase
      .from('pengiriman_event')
      .insert({
        pengiriman_id,
        status,
        catatan: catatan || null,
        foto_url: foto_url || null,
        lokasi_teks: lokasi_teks || null,
        created_by: admin_id,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Notify poktan ketua + supplier
    const ketuaId = (pengiriman.poktan as any)?.ketua_id
    const supplierUserId = (pengiriman.supplier as any)?.user_id

    const statusLabel: Record<string, string> = {
      disiapkan: 'Barang Disiapkan',
      dijemput: 'Barang Dijemput',
      dalam_perjalanan: 'Dalam Perjalanan',
      tiba_di_tujuan: 'Tiba di Tujuan',
      diterima: 'Barang Diterima',
    }

    const notifications = []
    if (ketuaId) {
      notifications.push({
        user_id: ketuaId,
        judul: `Pengiriman diperbarui oleh Admin`,
        pesan: `Status pengiriman diperbarui ke "${statusLabel[status] || status}" oleh admin.`,
        tipe: 'pengiriman',
        link: '/poktan/pengiriman',
        is_read: false,
      })
    }
    if (supplierUserId) {
      notifications.push({
        user_id: supplierUserId,
        judul: `Pengiriman: ${statusLabel[status] || status}`,
        pesan: catatan || `Status pengiriman diperbarui ke "${statusLabel[status] || status}"`,
        tipe: 'pengiriman',
        link: `/supplier/pengiriman/${pengiriman.transaksi_id}`,
        is_read: false,
      })
    }

    if (notifications.length > 0) {
      await supabase.from('notifikasi').insert(notifications)
    }

    return NextResponse.json({ success: true, event })
  } catch (error) {
    console.error('Admin pengiriman POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
