import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// POST — Process refund for a verified payment (when pre-order is cancelled)
export async function POST(request: NextRequest) {
  try {
    const { pembayaran_id, admin_id, refund_catatan } = await request.json()

    if (!pembayaran_id || !admin_id) {
      return NextResponse.json(
        { error: 'pembayaran_id dan admin_id wajib diisi' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Get pembayaran with supplier info
    const { data: pembayaran, error: pError } = await supabase
      .from('pembayaran_escrow')
      .select('*, supplier(user_id, nama_perusahaan, deposit_escrow)')
      .eq('id', pembayaran_id)
      .single()

    if (pError || !pembayaran) {
      return NextResponse.json({ error: 'Pembayaran tidak ditemukan' }, { status: 404 })
    }

    if (pembayaran.status !== 'terverifikasi') {
      return NextResponse.json(
        { error: 'Hanya pembayaran yang terverifikasi bisa di-refund' },
        { status: 400 }
      )
    }

    // Update pembayaran status to refunded
    const { error: updateError } = await supabase
      .from('pembayaran_escrow')
      .update({
        status: 'refunded',
        refunded_at: new Date().toISOString(),
        refund_catatan: refund_catatan || 'Pre-order dibatalkan, dana dikembalikan.',
        admin_id,
      })
      .eq('id', pembayaran_id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Deduct from supplier's deposit_escrow balance
    const currentDeposit = Number(pembayaran.supplier?.deposit_escrow) || 0
    const refundAmount = Number(pembayaran.jumlah)
    const newDeposit = Math.max(0, currentDeposit - refundAmount)

    await supabase
      .from('supplier')
      .update({ deposit_escrow: newDeposit })
      .eq('id', pembayaran.supplier_id)

    // Reset pre-order deposit_dibayar
    await supabase
      .from('pre_order')
      .update({ deposit_dibayar: 0 })
      .eq('id', pembayaran.pre_order_id)

    // Notify supplier about refund
    const supplierUserId = pembayaran.supplier?.user_id
    if (supplierUserId) {
      await supabase.from('notifikasi').insert({
        user_id: supplierUserId,
        judul: 'Refund Pembayaran Diproses',
        pesan: `Pembayaran escrow Anda sebesar Rp ${refundAmount.toLocaleString('id-ID')} akan dikembalikan karena pre-order dibatalkan.${refund_catatan ? ' Catatan: ' + refund_catatan : ''}`,
        tipe: 'pembayaran',
        link: '/supplier/pembayaran',
        is_read: false,
      })
    }

    return NextResponse.json({
      success: true,
      refund_amount: refundAmount,
      message: `Refund Rp ${refundAmount.toLocaleString('id-ID')} berhasil diproses.`,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
