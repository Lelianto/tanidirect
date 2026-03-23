import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { StatusPengiriman } from '@/types'

const STATUS_ORDER: StatusPengiriman[] = [
  'disiapkan', 'dijemput', 'dalam_perjalanan', 'tiba_di_tujuan', 'diterima',
]

// GET — List pengiriman for poktan
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

    const { data, error } = await supabase
      .from('pengiriman')
      .select(`
        *,
        transaksi(id, komoditas, grade, volume_estimasi_kg, volume_aktual_kg, status),
        poktan(id, nama_poktan),
        supplier(id, nama_perusahaan, user:users(nama_lengkap))
      `)
      .eq('poktan_id', poktanId!)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch events for all pengiriman
    const pengirimanIds = (data || []).map(p => p.id)
    let events: Record<string, unknown[]> = {}

    if (pengirimanIds.length > 0) {
      const { data: allEvents } = await supabase
        .from('pengiriman_event')
        .select('*, user:users(nama_lengkap, role)')
        .in('pengiriman_id', pengirimanIds)
        .order('created_at', { ascending: true })

      // Group events by pengiriman_id
      for (const ev of allEvents || []) {
        const pid = ev.pengiriman_id as string
        if (!events[pid]) events[pid] = []
        events[pid].push(ev)
      }
    }

    const result = (data || []).map(p => ({
      ...p,
      events: events[p.id] || [],
    }))

    return NextResponse.json({ success: true, pengiriman: result })
  } catch (error) {
    console.error('Poktan pengiriman GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — Add event to pengiriman (poktan updates shipment status)
export async function POST(request: NextRequest) {
  try {
    const { pengiriman_id, status, catatan, foto_url, lokasi_teks, user_id } = await request.json()

    if (!pengiriman_id || !status || !user_id) {
      return NextResponse.json(
        { error: 'pengiriman_id, status, dan user_id wajib diisi' },
        { status: 400 }
      )
    }

    if (!STATUS_ORDER.includes(status)) {
      return NextResponse.json({ error: `Status tidak valid: ${status}` }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Get current pengiriman with ownership info
    const { data: pengiriman, error: pError } = await supabase
      .from('pengiriman')
      .select('id, current_status, poktan_id, supplier_id, transaksi_id, poktan(ketua_id), supplier(user_id)')
      .eq('id', pengiriman_id)
      .single()

    if (pError || !pengiriman) {
      return NextResponse.json({ error: 'Pengiriman tidak ditemukan' }, { status: 404 })
    }

    // Verify ownership — only poktan ketua can update
    if ((pengiriman.poktan as any)?.ketua_id !== user_id) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 })
    }

    // Enforce forward-only status transition
    const currentIdx = STATUS_ORDER.indexOf(pengiriman.current_status as StatusPengiriman)
    const newIdx = STATUS_ORDER.indexOf(status)

    if (newIdx <= currentIdx) {
      return NextResponse.json(
        { error: `Tidak bisa mengubah status dari "${pengiriman.current_status}" ke "${status}". Status hanya bisa maju.` },
        { status: 400 }
      )
    }

    // Insert event (trigger will sync status + timestamps)
    const { data: event, error: insertError } = await supabase
      .from('pengiriman_event')
      .insert({
        pengiriman_id,
        status,
        catatan: catatan || null,
        foto_url: foto_url || null,
        lokasi_teks: lokasi_teks || null,
        created_by: user_id,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Notify supplier about status update
    const supplierUserId = (pengiriman.supplier as any)?.user_id
    if (supplierUserId) {
      const statusLabel: Record<string, string> = {
        disiapkan: 'Barang Disiapkan',
        dijemput: 'Barang Dijemput',
        dalam_perjalanan: 'Dalam Perjalanan',
        tiba_di_tujuan: 'Tiba di Tujuan',
        diterima: 'Barang Diterima',
      }
      await supabase.from('notifikasi').insert({
        user_id: supplierUserId,
        judul: `Pengiriman: ${statusLabel[status] || status}`,
        pesan: catatan || `Status pengiriman diperbarui ke "${statusLabel[status] || status}"`,
        tipe: 'pengiriman',
        link: `/supplier/pengiriman/${pengiriman.transaksi_id}`,
        is_read: false,
      })
    }

    return NextResponse.json({ success: true, event })
  } catch (error) {
    console.error('Poktan pengiriman POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — Update pengiriman info (pengirim details, alamat)
export async function PATCH(request: NextRequest) {
  try {
    const { pengiriman_id, user_id, pengirim_nama, pengirim_telepon, kendaraan_info, catatan_alamat } = await request.json()

    if (!pengiriman_id || !user_id) {
      return NextResponse.json({ error: 'pengiriman_id dan user_id wajib diisi' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Verify ownership
    const { data: pengiriman } = await supabase
      .from('pengiriman')
      .select('id, poktan(ketua_id)')
      .eq('id', pengiriman_id)
      .single()

    if (!pengiriman || (pengiriman.poktan as any)?.ketua_id !== user_id) {
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 })
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (pengirim_nama !== undefined) updateData.pengirim_nama = pengirim_nama
    if (pengirim_telepon !== undefined) updateData.pengirim_telepon = pengirim_telepon
    if (kendaraan_info !== undefined) updateData.kendaraan_info = kendaraan_info
    if (catatan_alamat !== undefined) updateData.catatan_alamat = catatan_alamat

    const { data, error } = await supabase
      .from('pengiriman')
      .update(updateData)
      .eq('id', pengiriman_id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, pengiriman: data })
  } catch (error) {
    console.error('Poktan pengiriman PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
