import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('poktan')
      .select('*, ketua:ketua_id(id, nama_lengkap, no_hp), anggota:anggota_poktan(id, status, petani:petani_id(id, nama_lengkap, no_hp))')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, poktan: data || [] })
  } catch (error) {
    console.error('Admin poktan error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { id, ...fields } = body

    if (!id) {
      return NextResponse.json({ error: 'id wajib diisi' }, { status: 400 })
    }

    const allowedFields = [
      'nama_poktan', 'kode_poktan', 'desa', 'kecamatan', 'kabupaten', 'provinsi',
      'komoditas_utama', 'jumlah_anggota', 'status_sertifikasi', 'is_qa_certified',
      'tanggal_sertifikasi', 'latitude', 'longitude',
    ]

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
      .from('poktan')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, poktan: data })
  } catch (error) {
    console.error('Admin poktan PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
