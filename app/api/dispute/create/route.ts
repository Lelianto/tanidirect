import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { transaksi_id, pelapor_id, kategori, deskripsi } = await request.json()

    if (!transaksi_id || !pelapor_id || !kategori || !deskripsi) {
      return NextResponse.json(
        { error: 'transaksi_id, pelapor_id, kategori, dan deskripsi wajib diisi' },
        { status: 400 }
      )
    }

    const validKategori = ['kualitas', 'keterlambatan', 'volume', 'pembayaran', 'pembatalan']
    if (!validKategori.includes(kategori)) {
      return NextResponse.json(
        { error: 'kategori tidak valid' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Get pelapor info
    const { data: pelapor, error: pelaporError } = await supabase
      .from('users')
      .select('id, nama_lengkap, role')
      .eq('id', pelapor_id)
      .single()

    if (pelaporError || !pelapor) {
      return NextResponse.json(
        { error: 'Pelapor tidak ditemukan' },
        { status: 404 }
      )
    }

    // Get transaksi to find terlapor
    const { data: transaksi, error: txError } = await supabase
      .from('transaksi')
      .select('id, poktan_id, supplier_id, status')
      .eq('id', transaksi_id)
      .single()

    if (txError || !transaksi) {
      return NextResponse.json(
        { error: 'Transaksi tidak ditemukan' },
        { status: 404 }
      )
    }

    // Determine terlapor: if pelapor is supplier, terlapor is poktan ketua and vice versa
    let terlapor_id: string | null = null
    let terlapor_nama = ''

    // Find supplier user
    const { data: supplier } = await supabase
      .from('supplier')
      .select('user_id, nama_perusahaan')
      .eq('id', transaksi.supplier_id)
      .single()

    // Find poktan ketua
    const { data: poktan } = await supabase
      .from('poktan')
      .select('ketua_id, nama_poktan')
      .eq('id', transaksi.poktan_id)
      .single()

    if (supplier && supplier.user_id === pelapor_id) {
      // Pelapor is supplier, terlapor is poktan ketua
      if (poktan) {
        terlapor_id = poktan.ketua_id
        const { data: ketuaUser } = await supabase
          .from('users')
          .select('nama_lengkap')
          .eq('id', poktan.ketua_id)
          .single()
        terlapor_nama = ketuaUser?.nama_lengkap || poktan.nama_poktan
      }
    } else if (poktan && poktan.ketua_id === pelapor_id) {
      // Pelapor is poktan, terlapor is supplier
      if (supplier) {
        terlapor_id = supplier.user_id
        terlapor_nama = supplier.nama_perusahaan
      }
    } else {
      // Fallback: get the other party
      if (supplier) {
        terlapor_id = supplier.user_id
        terlapor_nama = supplier.nama_perusahaan
      }
    }

    if (!terlapor_id) {
      return NextResponse.json(
        { error: 'Tidak dapat menentukan pihak terlapor' },
        { status: 400 }
      )
    }

    // SLA: 7 days from now
    const sla_deadline = new Date()
    sla_deadline.setDate(sla_deadline.getDate() + 7)

    const timeline = [{
      id: `tl-${Date.now()}`,
      aksi: 'Sengketa diajukan',
      oleh: pelapor.nama_lengkap,
      catatan: deskripsi,
      created_at: new Date().toISOString(),
    }]

    // Insert dispute
    const { data: dispute, error: insertError } = await supabase
      .from('disputes')
      .insert({
        transaksi_id,
        pelapor_id,
        pelapor_nama: pelapor.nama_lengkap,
        pelapor_role: pelapor.role,
        terlapor_id,
        terlapor_nama,
        kategori,
        deskripsi,
        bukti: [],
        timeline,
        status: 'diajukan',
        sla_deadline: sla_deadline.toISOString(),
      })
      .select('id, sla_deadline')
      .single()

    if (insertError) {
      console.error('Dispute insert error:', insertError)
      return NextResponse.json(
        { error: 'Gagal membuat sengketa: ' + insertError.message },
        { status: 500 }
      )
    }

    // Update transaksi status to 'sengketa'
    await supabase
      .from('transaksi')
      .update({ status: 'sengketa', updated_at: new Date().toISOString() })
      .eq('id', transaksi_id)

    // Notification for admins
    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')

    if (admins && admins.length > 0) {
      const notifications = admins.map((admin) => ({
        user_id: admin.id,
        judul: 'Sengketa Baru',
        pesan: `${pelapor.nama_lengkap} mengajukan sengketa kategori "${kategori}" untuk transaksi.`,
        tipe: 'dispute',
        link: '/admin/disputes',
        is_read: false,
      }))
      await supabase.from('notifikasi').insert(notifications)
    }

    // Notification for terlapor
    await supabase.from('notifikasi').insert({
      user_id: terlapor_id,
      judul: 'Sengketa Diterima',
      pesan: `${pelapor.nama_lengkap} mengajukan sengketa terhadap Anda. Kategori: ${kategori}.`,
      tipe: 'dispute',
      is_read: false,
    })

    return NextResponse.json({
      success: true,
      dispute_id: dispute.id,
      sla_deadline: dispute.sla_deadline,
    })
  } catch (error) {
    console.error('Dispute create error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
