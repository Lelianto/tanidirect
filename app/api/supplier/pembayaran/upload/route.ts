import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const pembayaran_id = formData.get('pembayaran_id') as string | null
    const metode_transfer = formData.get('metode_transfer') as string | null
    const catatan_supplier = formData.get('catatan_supplier') as string | null

    if (!file || !pembayaran_id) {
      return NextResponse.json({ error: 'File dan pembayaran_id wajib diisi' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Ukuran file maksimum 5MB' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Format file harus JPG, PNG, atau WebP' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Verify pembayaran exists and is in correct state
    const { data: pembayaran, error: pError } = await supabase
      .from('pembayaran_escrow')
      .select('id, status, supplier_id')
      .eq('id', pembayaran_id)
      .single()

    if (pError || !pembayaran) {
      return NextResponse.json({ error: 'Pembayaran tidak ditemukan' }, { status: 404 })
    }

    if (!['menunggu_pembayaran', 'ditolak'].includes(pembayaran.status)) {
      return NextResponse.json({ error: 'Pembayaran sudah diproses' }, { status: 400 })
    }

    // Upload file
    const ext = file.name.split('.').pop() || 'png'
    const filePath = `bukti-transfer/${pembayaran_id}_${Date.now()}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from('platform-assets')
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json({ error: 'Gagal upload: ' + uploadError.message }, { status: 500 })
    }

    // Update pembayaran
    const { data: updated, error: updateError } = await supabase
      .from('pembayaran_escrow')
      .update({
        bukti_transfer_url: filePath,
        metode_transfer: metode_transfer || 'bank',
        catatan_supplier: catatan_supplier || null,
        status: 'menunggu_verifikasi',
      })
      .eq('id', pembayaran_id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Get supplier user_id for notification to admins
    const { data: supplier } = await supabase
      .from('supplier')
      .select('user_id, nama_perusahaan')
      .eq('id', pembayaran.supplier_id)
      .single()

    // Notify all admins
    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')

    if (admins && admins.length > 0) {
      const notifs = admins.map((admin) => ({
        user_id: admin.id,
        judul: 'Bukti Pembayaran Baru',
        pesan: `${supplier?.nama_perusahaan || 'Supplier'} telah mengirim bukti pembayaran escrow. Silakan verifikasi.`,
        tipe: 'pembayaran',
        link: '/admin/pembayaran',
        is_read: false,
      }))
      await supabase.from('notifikasi').insert(notifs)
    }

    return NextResponse.json({ success: true, pembayaran: updated })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
