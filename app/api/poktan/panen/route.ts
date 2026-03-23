import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('user_id')
    const statusFilter = request.nextUrl.searchParams.get('status')
    if (!userId) {
      return NextResponse.json({ error: 'user_id wajib diisi' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: poktan } = await supabase
      .from('poktan')
      .select('id')
      .eq('ketua_id', userId)
      .single()

    if (!poktan) {
      return NextResponse.json({ error: 'Poktan tidak ditemukan' }, { status: 404 })
    }

    let query = supabase
      .from('catatan_panen')
      .select('*, kontribusi:kontribusi_panen(*, petani:petani_id(id, nama_lengkap))')
      .eq('poktan_id', poktan.id)
      .order('created_at', { ascending: false })

    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Stats
    const all = data || []
    const totalVolume = all.reduce((s, r) => s + Number(r.volume_panen_kg), 0)
    const volumeTersedia = all
      .filter((r) => r.status === 'tersedia')
      .reduce((s, r) => s + Number(r.volume_panen_kg) - Number(r.volume_terjual_kg), 0)
    const listingAktif = all.filter((r) => r.status === 'tersedia').length

    return NextResponse.json({
      success: true,
      catatan_panen: all,
      stats: { total: all.length, totalVolume, volumeTersedia, listingAktif },
    })
  } catch (error) {
    console.error('Poktan panen GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, komoditas, grade, volume_panen_kg, tanggal_panen, foto_urls, catatan, kontribusi,
      varietas, min_order_kg, kemasan, tersedia_sampai, metode_simpan, sertifikasi } = body

    if (!user_id || !komoditas || !volume_panen_kg || !tanggal_panen) {
      return NextResponse.json({ error: 'Field wajib: user_id, komoditas, volume_panen_kg, tanggal_panen' }, { status: 400 })
    }

    // Validasi foto: minimal 1, maksimal 3
    if (!foto_urls || !Array.isArray(foto_urls) || foto_urls.length === 0) {
      return NextResponse.json({ error: 'Minimal 1 foto produk wajib dilampirkan' }, { status: 400 })
    }
    if (foto_urls.length > 3) {
      return NextResponse.json({ error: 'Maksimal 3 foto produk' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Validasi komoditas harus ada di komoditas_config
    const { data: configMatch } = await supabase
      .from('komoditas_config')
      .select('id')
      .eq('nama', komoditas)
      .maybeSingle()

    if (!configMatch) {
      return NextResponse.json({ error: `Komoditas "${komoditas}" tidak terdaftar dalam konfigurasi. Hubungi admin untuk menambahkan.` }, { status: 400 })
    }

    const { data: poktan } = await supabase
      .from('poktan')
      .select('id')
      .eq('ketua_id', user_id)
      .single()

    if (!poktan) {
      return NextResponse.json({ error: 'Poktan tidak ditemukan' }, { status: 404 })
    }

    const { data: record, error } = await supabase
      .from('catatan_panen')
      .insert({
        poktan_id: poktan.id,
        pencatat_id: user_id,
        komoditas,
        grade: grade || 'B',
        volume_panen_kg,
        tanggal_panen,
        foto_urls: foto_urls,
        catatan: catatan || null,
        varietas: varietas || null,
        min_order_kg: min_order_kg || null,
        kemasan: kemasan || null,
        tersedia_sampai: tersedia_sampai || null,
        metode_simpan: metode_simpan || null,
        sertifikasi: sertifikasi || null,
        status: 'draft',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Insert kontribusi if provided
    if (kontribusi && Array.isArray(kontribusi) && kontribusi.length > 0) {
      const rows = kontribusi.map((k: { petani_id: string; volume_kg: number }) => ({
        catatan_panen_id: record.id,
        petani_id: k.petani_id,
        volume_kg: k.volume_kg,
      }))

      await supabase.from('kontribusi_panen').insert(rows)
    }

    return NextResponse.json({ success: true, catatan_panen: record })
  } catch (error) {
    console.error('Poktan panen POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
