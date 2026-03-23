import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('catatan_panen')
      .select('*, kontribusi:kontribusi_panen(*, petani:petani_id(id, nama_lengkap, no_hp)), poktan:poktan_id(id, nama_poktan, kabupaten, provinsi)')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Catatan panen tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({ success: true, catatan_panen: data })
  } catch (error) {
    console.error('Panen detail GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action, user_id, ...fields } = body

    if (!user_id) {
      return NextResponse.json({ error: 'user_id wajib diisi' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Fetch current record
    const { data: record } = await supabase
      .from('catatan_panen')
      .select('*, poktan:poktan_id(id, nama_poktan, kabupaten, provinsi, skor_qa)')
      .eq('id', id)
      .single()

    if (!record) {
      return NextResponse.json({ error: 'Catatan panen tidak ditemukan' }, { status: 404 })
    }

    // Status transition: draft → tersedia (publish)
    if (action === 'publish') {
      if (record.status !== 'draft') {
        return NextResponse.json({ error: 'Hanya draft yang bisa dipublish' }, { status: 400 })
      }

      const harga = fields.harga_per_kg || record.harga_per_kg
      if (!harga) {
        return NextResponse.json({ error: 'Harga per kg wajib diisi untuk publish' }, { status: 400 })
      }

      // Update catatan_panen to tersedia
      const { error: updateErr } = await supabase
        .from('catatan_panen')
        .update({
          status: 'tersedia',
          harga_per_kg: harga,
          published_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 })
      }

      // Upsert katalog_komoditas
      const poktan = record.poktan as Record<string, unknown>
      const volumeTersedia = Number(record.volume_panen_kg) - Number(record.volume_terjual_kg)

      // Compute skor fields for radar chart compatibility
      const skorQA = poktan.skor_qa || 0
      const skorKetepatan = poktan.skor_ketepatan || 0
      // Volume score: scale based on volume (1000kg = 50, 5000kg+ = 100)
      const skorVolume = Math.min(100, Math.round((volumeTersedia / 5000) * 100))
      // Harga score: placeholder — can be refined with harga_historis comparison
      const skorHarga = 50

      // Fetch avg harga for margin calculation
      const { data: avgRow } = await supabase
        .from('harga_historis')
        .select('harga_per_kg')
        .eq('komoditas', record.komoditas)
        .order('minggu', { ascending: false })
        .limit(1)
        .maybeSingle()

      const hargaPasar = avgRow?.harga_per_kg || harga
      const marginPersen = hargaPasar > 0
        ? Math.round(((hargaPasar - harga) / hargaPasar) * 100)
        : 0

      const { error: katalogErr } = await supabase
        .from('katalog_komoditas')
        .upsert(
          {
            catatan_panen_id: id,
            poktan_id: poktan.id,
            nama: record.komoditas,
            grade: record.grade,
            harga_per_kg: harga,
            volume_tersedia_kg: volumeTersedia,
            wilayah: poktan.kabupaten,
            jadwal_panen: record.tanggal_panen,
            skor_kualitas: skorQA,
            skor_ketepatan: skorKetepatan,
            skor_volume: skorVolume,
            skor_harga: skorHarga,
            margin_persen: Math.max(0, marginPersen),
            foto_url: record.foto_urls?.[0] || null,
            varietas: record.varietas || null,
            min_order_kg: record.min_order_kg || null,
            kemasan: record.kemasan || null,
            tersedia_sampai: record.tersedia_sampai || null,
            metode_simpan: record.metode_simpan || null,
            sertifikasi: record.sertifikasi || null,
          },
          { onConflict: 'catatan_panen_id' }
        )

      if (katalogErr) {
        console.error('Katalog upsert error:', katalogErr)
      }

      return NextResponse.json({ success: true, message: 'Berhasil dipublish ke katalog' })
    }

    // Status transition: tersedia → terjual/expired
    if (action === 'terjual' || action === 'expired') {
      if (record.status !== 'tersedia') {
        return NextResponse.json({ error: 'Status harus tersedia' }, { status: 400 })
      }

      const { error: updateErr } = await supabase
        .from('catatan_panen')
        .update({ status: action })
        .eq('id', id)

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 })
      }

      // Remove from katalog
      await supabase
        .from('katalog_komoditas')
        .delete()
        .eq('catatan_panen_id', id)

      return NextResponse.json({ success: true, message: `Status diubah ke ${action}` })
    }

    // Edit fields (draft only)
    if (record.status !== 'draft') {
      return NextResponse.json({ error: 'Hanya draft yang bisa diedit' }, { status: 400 })
    }

    const allowedFields = ['komoditas', 'grade', 'volume_panen_kg', 'tanggal_panen', 'harga_per_kg', 'foto_urls', 'catatan',
      'varietas', 'min_order_kg', 'kemasan', 'tersedia_sampai', 'metode_simpan', 'sertifikasi']
    const updateData: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (fields[key] !== undefined) {
        updateData[key] = fields[key]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Tidak ada field yang diupdate' }, { status: 400 })
    }

    const { error: updateErr } = await supabase
      .from('catatan_panen')
      .update(updateData)
      .eq('id', id)

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Berhasil diupdate' })
  } catch (error) {
    console.error('Panen detail PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = request.nextUrl.searchParams.get('user_id')
    if (!userId) {
      return NextResponse.json({ error: 'user_id wajib diisi' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: record } = await supabase
      .from('catatan_panen')
      .select('id, status')
      .eq('id', id)
      .single()

    if (!record) {
      return NextResponse.json({ error: 'Catatan panen tidak ditemukan' }, { status: 404 })
    }

    if (record.status !== 'draft') {
      return NextResponse.json({ error: 'Hanya draft yang bisa dihapus' }, { status: 400 })
    }

    const { error } = await supabase
      .from('catatan_panen')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Berhasil dihapus' })
  } catch (error) {
    console.error('Panen detail DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
