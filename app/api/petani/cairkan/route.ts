import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const BIAYA_ADMIN = 2500

export async function POST(request: NextRequest) {
  try {
    const { petani_id, jumlah, rekening } = await request.json()

    if (!petani_id || !jumlah || !rekening) {
      return NextResponse.json(
        { error: 'petani_id, jumlah, dan rekening wajib diisi' },
        { status: 400 }
      )
    }

    const { metode, provider, nomor, atas_nama } = rekening
    if (!metode || !provider || !nomor || !atas_nama) {
      return NextResponse.json(
        { error: 'rekening harus memiliki metode, provider, nomor, dan atas_nama' },
        { status: 400 }
      )
    }

    if (!['bank', 'ewallet'].includes(metode)) {
      return NextResponse.json(
        { error: 'metode harus "bank" atau "ewallet"' },
        { status: 400 }
      )
    }

    if (Number(jumlah) <= BIAYA_ADMIN) {
      return NextResponse.json(
        { error: `Jumlah pencairan harus lebih dari biaya admin (Rp ${BIAYA_ADMIN})` },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Verify petani exists
    const { data: petani, error: petaniError } = await supabase
      .from('users')
      .select('id, nama_lengkap, role')
      .eq('id', petani_id)
      .single()

    if (petaniError || !petani) {
      return NextResponse.json(
        { error: 'Petani tidak ditemukan' },
        { status: 404 }
      )
    }

    // Upsert rekening — unique constraint is (user_id, metode, nomor)
    const { data: rekeningData, error: rekeningError } = await supabase
      .from('rekening')
      .upsert(
        {
          user_id: petani_id,
          metode,
          provider,
          nomor,
          atas_nama,
          is_primary: true,
        },
        { onConflict: 'user_id,metode,nomor' }
      )
      .select('id')
      .single()

    if (rekeningError || !rekeningData) {
      console.error('Rekening upsert error:', rekeningError)
      return NextResponse.json(
        { error: 'Gagal menyimpan data rekening: ' + (rekeningError?.message || 'unknown') },
        { status: 500 }
      )
    }

    const jumlah_diterima = Number(jumlah) - BIAYA_ADMIN

    // Insert pencairan — uses rekening_id FK, not JSONB
    const { data: pencairan, error: insertError } = await supabase
      .from('pencairan')
      .insert({
        petani_id,
        rekening_id: rekeningData.id,
        jumlah: Number(jumlah),
        biaya_admin: BIAYA_ADMIN,
        jumlah_diterima,
        status: 'diproses',
      })
      .select('id, jumlah_diterima, status, created_at')
      .single()

    if (insertError) {
      console.error('Pencairan insert error:', insertError)
      return NextResponse.json(
        { error: 'Gagal membuat pencairan: ' + insertError.message },
        { status: 500 }
      )
    }

    // Notification for petani
    await supabase.from('notifikasi').insert({
      user_id: petani_id,
      judul: 'Pencairan Diproses',
      pesan: `Pencairan sebesar Rp ${jumlah_diterima.toLocaleString('id-ID')} ke ${provider} (${nomor}) sedang diproses.`,
      tipe: 'pencairan',
      link: '/petani/keuangan',
      is_read: false,
    })

    // Notification for admins
    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')

    if (admins && admins.length > 0) {
      const notifications = admins.map((admin) => ({
        user_id: admin.id,
        judul: 'Pencairan Baru',
        pesan: `${petani.nama_lengkap} mengajukan pencairan Rp ${Number(jumlah).toLocaleString('id-ID')} ke ${provider}.`,
        tipe: 'pencairan',
        link: '/admin/keuangan',
        is_read: false,
      }))
      await supabase.from('notifikasi').insert(notifications)
    }

    return NextResponse.json({
      success: true,
      pencairan_id: pencairan.id,
      jumlah_diterima: pencairan.jumlah_diterima,
      status: pencairan.status,
    })
  } catch (error) {
    console.error('Pencairan error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
