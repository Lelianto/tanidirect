import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const BIAYA_ADMIN = 2500

export async function POST(request: NextRequest) {
  try {
    const { poktan_id, jumlah, rekening } = await request.json()

    if (!poktan_id || !jumlah || !rekening) {
      return NextResponse.json(
        { error: 'poktan_id, jumlah, dan rekening wajib diisi' },
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

    // Verify poktan exists and get ketua info
    const { data: poktan, error: poktanError } = await supabase
      .from('poktan')
      .select('id, nama_poktan, ketua_id')
      .eq('id', poktan_id)
      .single()

    if (poktanError || !poktan) {
      return NextResponse.json({ error: 'Poktan tidak ditemukan' }, { status: 404 })
    }

    // Calculate saldo: total fee_dibayar - total pencairan_poktan (diproses + berhasil)
    const { data: qaList } = await supabase
      .from('qa_inspeksi')
      .select('fee_dibayar')
      .eq('poktan_id', poktan_id)

    const totalFee = (qaList || []).reduce((sum, qa) => sum + (Number(qa.fee_dibayar) || 0), 0)

    const { data: pencairanList } = await supabase
      .from('pencairan_poktan')
      .select('jumlah')
      .eq('poktan_id', poktan_id)
      .in('status', ['diproses', 'berhasil'])

    const totalCaired = (pencairanList || []).reduce((sum, p) => sum + (Number(p.jumlah) || 0), 0)
    const saldo = totalFee - totalCaired

    if (Number(jumlah) > saldo) {
      return NextResponse.json(
        { error: `Saldo tidak cukup. Saldo tersedia: Rp ${saldo.toLocaleString('id-ID')}` },
        { status: 400 }
      )
    }

    // Upsert rekening
    const { data: rekeningData, error: rekeningError } = await supabase
      .from('rekening')
      .upsert(
        {
          user_id: poktan.ketua_id,
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

    // Insert pencairan_poktan
    const { data: pencairan, error: insertError } = await supabase
      .from('pencairan_poktan')
      .insert({
        poktan_id,
        rekening_id: rekeningData.id,
        jumlah: Number(jumlah),
        biaya_admin: BIAYA_ADMIN,
        jumlah_diterima,
        status: 'diproses',
      })
      .select('id, jumlah_diterima, status, created_at')
      .single()

    if (insertError) {
      console.error('Pencairan poktan insert error:', insertError)
      return NextResponse.json(
        { error: 'Gagal membuat pencairan: ' + insertError.message },
        { status: 500 }
      )
    }

    // Notify poktan ketua
    await supabase.from('notifikasi').insert({
      user_id: poktan.ketua_id,
      judul: 'Pencairan Fee QA Diproses',
      pesan: `Pencairan sebesar Rp ${jumlah_diterima.toLocaleString('id-ID')} ke ${provider} (${nomor}) sedang diproses.`,
      tipe: 'pencairan',
      link: '/poktan/keuangan',
      is_read: false,
    })

    // Notify admins
    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')

    if (admins && admins.length > 0) {
      const notifications = admins.map((admin) => ({
        user_id: admin.id,
        judul: 'Pencairan Poktan Baru',
        pesan: `${poktan.nama_poktan} mengajukan pencairan Fee QA Rp ${Number(jumlah).toLocaleString('id-ID')} ke ${provider}.`,
        tipe: 'pencairan',
        link: '/admin/pencairan-poktan',
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
    console.error('Pencairan poktan error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const poktan_id = searchParams.get('poktan_id')

    if (!poktan_id) {
      return NextResponse.json({ error: 'poktan_id required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('pencairan_poktan')
      .select('*')
      .eq('poktan_id', poktan_id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate saldo
    const { data: qaList } = await supabase
      .from('qa_inspeksi')
      .select('fee_dibayar')
      .eq('poktan_id', poktan_id)

    const totalFee = (qaList || []).reduce((sum, qa) => sum + (Number(qa.fee_dibayar) || 0), 0)
    const totalCaired = (data || [])
      .filter((p) => ['diproses', 'berhasil'].includes(p.status))
      .reduce((sum, p) => sum + (Number(p.jumlah) || 0), 0)

    return NextResponse.json({
      success: true,
      pencairan: data || [],
      saldo: totalFee - totalCaired,
      total_fee: totalFee,
    })
  } catch (error) {
    console.error('Pencairan poktan GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
