import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET — List all pembayaran for admin verification
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const supabase = createServiceClient()

    let query = supabase
      .from('pembayaran_escrow')
      .select(`
        *,
        pre_order(id, komoditas, grade, volume_kg, harga_penawaran_per_kg, status, tanggal_dibutuhkan, wilayah_tujuan),
        supplier(id, nama_perusahaan, user_id, user:users(nama_lengkap, no_hp))
      `)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, pembayaran: data || [] })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — Verify or reject pembayaran
export async function PATCH(request: NextRequest) {
  try {
    const { pembayaran_id, action, admin_id, admin_catatan } = await request.json()

    if (!pembayaran_id || !action || !admin_id) {
      return NextResponse.json(
        { error: 'pembayaran_id, action, dan admin_id wajib diisi' },
        { status: 400 }
      )
    }

    if (!['terverifikasi', 'ditolak'].includes(action)) {
      return NextResponse.json({ error: 'action harus "terverifikasi" atau "ditolak"' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Get pembayaran
    const { data: pembayaran, error: pError } = await supabase
      .from('pembayaran_escrow')
      .select('*, supplier(user_id, nama_perusahaan, deposit_escrow)')
      .eq('id', pembayaran_id)
      .single()

    if (pError || !pembayaran) {
      return NextResponse.json({ error: 'Pembayaran tidak ditemukan' }, { status: 404 })
    }

    if (pembayaran.status !== 'menunggu_verifikasi') {
      return NextResponse.json({ error: 'Pembayaran tidak dalam status menunggu verifikasi' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {
      status: action,
      admin_id,
      admin_catatan: admin_catatan || null,
    }

    if (action === 'terverifikasi') {
      updateData.verified_at = new Date().toISOString()
    } else {
      updateData.rejected_at = new Date().toISOString()
    }

    const { data: updated, error: updateError } = await supabase
      .from('pembayaran_escrow')
      .update(updateData)
      .eq('id', pembayaran_id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // If verified, update supplier's deposit_escrow balance
    if (action === 'terverifikasi') {
      const currentDeposit = Number(pembayaran.supplier?.deposit_escrow) || 0
      const newDeposit = currentDeposit + Number(pembayaran.jumlah)

      await supabase
        .from('supplier')
        .update({ deposit_escrow: newDeposit })
        .eq('id', pembayaran.supplier_id)

      // Update pre-order deposit_dibayar
      await supabase
        .from('pre_order')
        .update({ deposit_dibayar: Number(pembayaran.jumlah) })
        .eq('id', pembayaran.pre_order_id)
    }

    // Notify supplier
    const supplierUserId = pembayaran.supplier?.user_id
    if (supplierUserId) {
      const isVerified = action === 'terverifikasi'
      await supabase.from('notifikasi').insert({
        user_id: supplierUserId,
        judul: isVerified ? 'Pembayaran Terverifikasi' : 'Pembayaran Ditolak',
        pesan: isVerified
          ? `Pembayaran escrow Anda sebesar Rp ${Number(pembayaran.jumlah).toLocaleString('id-ID')} telah diverifikasi.`
          : `Pembayaran escrow Anda ditolak. ${admin_catatan ? 'Alasan: ' + admin_catatan : 'Silakan upload ulang bukti transfer.'}`,
        tipe: 'pembayaran',
        link: '/supplier/pembayaran',
        is_read: false,
      })
    }

    return NextResponse.json({ success: true, pembayaran: updated })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
