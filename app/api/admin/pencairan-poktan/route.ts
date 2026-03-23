import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('pencairan_poktan')
      .select('*, poktan:poktan_id(id, nama_poktan, ketua_id)')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, pencairan: data || [] })
  } catch (error) {
    console.error('Admin pencairan poktan GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { pencairan_id, action, admin_id, catatan } = await request.json()

    if (!pencairan_id || !action || !admin_id) {
      return NextResponse.json(
        { error: 'pencairan_id, action, dan admin_id wajib diisi' },
        { status: 400 }
      )
    }

    if (!['berhasil', 'gagal'].includes(action)) {
      return NextResponse.json(
        { error: 'action harus "berhasil" atau "gagal"' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Get pencairan
    const { data: pencairan, error: fetchError } = await supabase
      .from('pencairan_poktan')
      .select('*, poktan:poktan_id(ketua_id, nama_poktan)')
      .eq('id', pencairan_id)
      .single()

    if (fetchError || !pencairan) {
      return NextResponse.json({ error: 'Pencairan tidak ditemukan' }, { status: 404 })
    }

    if (pencairan.status !== 'diproses') {
      return NextResponse.json(
        { error: 'Hanya pencairan dengan status "diproses" yang dapat diproses' },
        { status: 400 }
      )
    }

    const updateData: Record<string, any> = {
      status: action,
      selesai_at: new Date().toISOString(),
    }
    if (catatan) updateData.catatan = catatan

    const { error: updateError } = await supabase
      .from('pencairan_poktan')
      .update(updateData)
      .eq('id', pencairan_id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Notify poktan ketua
    if (pencairan.poktan?.ketua_id) {
      const isSuccess = action === 'berhasil'
      await supabase.from('notifikasi').insert({
        user_id: pencairan.poktan.ketua_id,
        judul: isSuccess ? 'Pencairan Berhasil' : 'Pencairan Gagal',
        pesan: isSuccess
          ? `Pencairan Fee QA sebesar Rp ${Number(pencairan.jumlah_diterima).toLocaleString('id-ID')} telah berhasil ditransfer.`
          : `Pencairan Fee QA sebesar Rp ${Number(pencairan.jumlah).toLocaleString('id-ID')} gagal diproses.${catatan ? ' Alasan: ' + catatan : ''}`,
        tipe: 'pencairan',
        link: '/poktan/keuangan',
        is_read: false,
      })
    }

    return NextResponse.json({
      success: true,
      message: action === 'berhasil' ? 'Pencairan berhasil diproses' : 'Pencairan ditolak',
    })
  } catch (error) {
    console.error('Admin pencairan poktan PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
