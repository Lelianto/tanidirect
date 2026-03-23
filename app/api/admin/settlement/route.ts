import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { transaksi_id, admin_id } = await request.json()

    if (!transaksi_id || !admin_id) {
      return NextResponse.json(
        { error: 'transaksi_id dan admin_id wajib diisi' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // 1. Fetch transaksi with poktan
    const { data: tx, error: txError } = await supabase
      .from('transaksi')
      .select('*, poktan:poktan_id(id, ketua_id, nama_poktan), supplier:supplier_id(id, user_id, nama_perusahaan)')
      .eq('id', transaksi_id)
      .single()

    if (txError || !tx) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 })
    }

    if (tx.status !== 'selesai') {
      return NextResponse.json(
        { error: 'Transaksi harus berstatus "selesai" untuk di-settle' },
        { status: 400 }
      )
    }

    if (tx.settled_at) {
      return NextResponse.json(
        { error: 'Transaksi sudah di-settle sebelumnya' },
        { status: 400 }
      )
    }

    // 2. Calculate values
    const volume = Number(tx.volume_aktual_kg) || Number(tx.volume_estimasi_kg)
    const harga = Number(tx.harga_per_kg)
    const total_nilai = volume * harga
    const komisi_platform = total_nilai * 0.02

    // 3. Get fee QA from qa_inspeksi
    const { data: qaList } = await supabase
      .from('qa_inspeksi')
      .select('fee_dibayar')
      .eq('transaksi_id', transaksi_id)

    const fee_qa = (qaList || []).reduce((sum, qa) => sum + (Number(qa.fee_dibayar) || 0), 0)

    const dana_petani = total_nilai - komisi_platform - fee_qa

    // 4. Create kontribusi_petani records
    // Get anggota poktan to distribute proportionally
    const { data: anggota } = await supabase
      .from('anggota_poktan')
      .select('petani_id, lahan_ha')
      .eq('poktan_id', tx.poktan_id)
      .eq('status', 'aktif')

    if (anggota && anggota.length > 0) {
      // Distribute proportionally by lahan_ha, or equally if no lahan data
      const totalLahan = anggota.reduce((sum, a) => sum + (Number(a.lahan_ha) || 1), 0)

      const kontribusiRecords = anggota.map((a) => {
        const proporsi = (Number(a.lahan_ha) || 1) / totalLahan
        const volumePetani = volume * proporsi
        const hargaDiterima = dana_petani * proporsi

        return {
          transaksi_id: transaksi_id,
          petani_id: a.petani_id,
          volume_kg: Math.round(volumePetani * 100) / 100,
          harga_diterima: Math.round(hargaDiterima),
          status_bayar: 'belum',
        }
      })

      const { error: kontribusiError } = await supabase
        .from('kontribusi_petani')
        .insert(kontribusiRecords)

      if (kontribusiError) {
        console.error('Kontribusi petani insert error:', kontribusiError)
        return NextResponse.json(
          { error: 'Gagal membuat kontribusi petani: ' + kontribusiError.message },
          { status: 500 }
        )
      }
    }

    // 5. Update transaksi as settled
    const { error: updateError } = await supabase
      .from('transaksi')
      .update({
        settled_at: new Date().toISOString(),
        settled_by: admin_id,
        total_nilai: total_nilai,
        komisi_platform: komisi_platform,
      })
      .eq('id', transaksi_id)

    if (updateError) {
      console.error('Settlement update error:', updateError)
      return NextResponse.json(
        { error: 'Gagal mengupdate settlement: ' + updateError.message },
        { status: 500 }
      )
    }

    // 6. Notifications
    const notifications = []

    // Notify supplier
    if (tx.supplier?.user_id) {
      notifications.push({
        user_id: tx.supplier.user_id,
        judul: 'Settlement Selesai',
        pesan: `Transaksi ${tx.komoditas} telah di-settle. Total nilai: Rp ${total_nilai.toLocaleString('id-ID')}, Komisi platform: Rp ${komisi_platform.toLocaleString('id-ID')}.`,
        tipe: 'settlement',
        link: '/supplier/transaksi',
        is_read: false,
      })
    }

    // Notify poktan ketua
    if (tx.poktan?.ketua_id) {
      notifications.push({
        user_id: tx.poktan.ketua_id,
        judul: 'Settlement Selesai',
        pesan: `Transaksi ${tx.komoditas} telah di-settle. Fee QA: Rp ${fee_qa.toLocaleString('id-ID')} telah dikreditkan.`,
        tipe: 'settlement',
        link: '/poktan/keuangan',
        is_read: false,
      })
    }

    if (notifications.length > 0) {
      await supabase.from('notifikasi').insert(notifications)
    }

    return NextResponse.json({
      success: true,
      settlement: {
        transaksi_id,
        total_nilai,
        komisi_platform,
        fee_qa,
        dana_petani,
        jumlah_petani: anggota?.length || 0,
      },
    })
  } catch (error) {
    console.error('Settlement error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const transaksi_id = searchParams.get('transaksi_id')

    if (!transaksi_id) {
      return NextResponse.json({ error: 'transaksi_id required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Get transaksi
    const { data: tx } = await supabase
      .from('transaksi')
      .select('*')
      .eq('id', transaksi_id)
      .single()

    if (!tx) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 })
    }

    // Get fee QA
    const { data: qaList } = await supabase
      .from('qa_inspeksi')
      .select('fee_dibayar')
      .eq('transaksi_id', transaksi_id)

    const fee_qa = (qaList || []).reduce((sum, qa) => sum + (Number(qa.fee_dibayar) || 0), 0)

    const volume = Number(tx.volume_aktual_kg) || Number(tx.volume_estimasi_kg)
    const total_nilai = volume * Number(tx.harga_per_kg)
    const komisi_platform = total_nilai * 0.02
    const dana_petani = total_nilai - komisi_platform - fee_qa

    // Get kontribusi petani
    const { data: kontribusi } = await supabase
      .from('kontribusi_petani')
      .select('*, petani:petani_id(nama_lengkap)')
      .eq('transaksi_id', transaksi_id)

    return NextResponse.json({
      success: true,
      breakdown: {
        total_nilai,
        komisi_platform,
        fee_qa,
        dana_petani,
        settled_at: tx.settled_at,
        settled_by: tx.settled_by,
      },
      kontribusi: kontribusi || [],
    })
  } catch (error) {
    console.error('Settlement GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
