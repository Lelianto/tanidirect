import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('komoditas_config')
      .select('*')
      .order('nama', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, komoditas_config: data || [] })
  } catch (error) {
    console.error('Komoditas config GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nama, kategori, zona, daya_tahan_hari, susut_persen, perlu_cold_chain, layak_antar_pulau, harga_petani_ref, harga_jakarta_ref, biaya_kapal_ref, catatan } = body

    if (!nama) {
      return NextResponse.json({ error: 'Nama komoditas wajib diisi' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('komoditas_config')
      .insert({
        nama,
        kategori: kategori || null,
        zona: zona || 'antar_pulau',
        daya_tahan_hari: daya_tahan_hari ?? 30,
        susut_persen: susut_persen ?? 5,
        perlu_cold_chain: perlu_cold_chain ?? false,
        layak_antar_pulau: layak_antar_pulau ?? true,
        harga_petani_ref: harga_petani_ref || null,
        harga_jakarta_ref: harga_jakarta_ref || null,
        biaya_kapal_ref: biaya_kapal_ref || null,
        catatan: catatan || null,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Komoditas dengan nama ini sudah ada' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, komoditas_config: data })
  } catch (error) {
    console.error('Komoditas config POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...fields } = body

    if (!id) {
      return NextResponse.json({ error: 'id wajib diisi' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const allowedFields = ['nama', 'kategori', 'zona', 'daya_tahan_hari', 'susut_persen', 'perlu_cold_chain', 'layak_antar_pulau', 'harga_petani_ref', 'harga_jakarta_ref', 'biaya_kapal_ref', 'catatan']
    const updateData: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (fields[key] !== undefined) {
        updateData[key] = fields[key]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Tidak ada field yang diupdate' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('komoditas_config')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Komoditas dengan nama ini sudah ada' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, komoditas_config: data })
  } catch (error) {
    console.error('Komoditas config PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'id wajib diisi' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { error } = await supabase
      .from('komoditas_config')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Berhasil dihapus' })
  } catch (error) {
    console.error('Komoditas config DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
