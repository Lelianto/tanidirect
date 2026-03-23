import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getPulau } from '@/lib/constants/wilayah'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()

    const komoditas = request.nextUrl.searchParams.get('komoditas')
    const wilayah = request.nextUrl.searchParams.get('wilayah')
    const grade = request.nextUrl.searchParams.get('grade')
    const supplierProvinsi = request.nextUrl.searchParams.get('supplier_provinsi')

    let query = supabase
      .from('katalog_komoditas')
      .select('*, poktan:poktan_id(id, nama_poktan, kabupaten, provinsi), catatan_panen:catatan_panen_id(foto_urls, catatan, tanggal_panen, varietas, min_order_kg, kemasan, tersedia_sampai, metode_simpan, sertifikasi)')
      .order('skor_kualitas', { ascending: false })
      .limit(50)

    if (komoditas) query = query.eq('nama', komoditas)
    if (wilayah) query = query.eq('wilayah', wilayah)
    if (grade) query = query.eq('grade', grade)

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let katalog = data || []

    // Zone filter: hide commodities not eligible for cross-island shipping
    if (supplierProvinsi && katalog.length > 0) {
      const supplierPulau = getPulau(supplierProvinsi)

      // Fetch komoditas_config for zone eligibility check
      const { data: configs } = await supabase
        .from('komoditas_config')
        .select('nama, layak_antar_pulau')

      const configMap = new Map<string, boolean>()
      if (configs) {
        for (const c of configs) {
          configMap.set(c.nama.toLowerCase(), c.layak_antar_pulau)
        }
      }

      katalog = katalog.filter((item) => {
        const poktan = item.poktan as { provinsi?: string } | null
        if (!poktan?.provinsi) return true

        const poktanPulau = getPulau(poktan.provinsi)
        if (supplierPulau === poktanPulau) return true

        // Different island — check if commodity is eligible
        const layak = configMap.get(item.nama.toLowerCase())
        // If no config found, allow by default
        return layak !== false
      })
    }

    return NextResponse.json({ success: true, katalog })
  } catch (error) {
    console.error('Katalog error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
