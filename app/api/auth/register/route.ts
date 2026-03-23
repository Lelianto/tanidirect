import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      role,
      nama_lengkap,
      no_hp,
      no_ktp,
      provinsi,
      kabupaten,
      kecamatan,
      alamat,
      // Rekening (optional)
      rekening,
      // Petani-specific
      petani,
      // Poktan-specific
      poktan,
      // Supplier-specific
      supplier,
    } = body

    // Validation
    if (!role || !nama_lengkap || !no_hp || !provinsi || !kabupaten) {
      return NextResponse.json(
        { error: 'role, nama_lengkap, no_hp, provinsi, kabupaten wajib diisi' },
        { status: 400 }
      )
    }

    if (!['petani', 'ketua_poktan', 'supplier', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Role tidak valid' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Generate email from phone (Supabase auth requires email or phone)
    // We use phone-based email as a workaround
    const email = `${no_hp.replace(/[^0-9]/g, '')}@taninesia.local`
    const password = no_hp // Use phone as default password (user should change later)

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for now
      user_metadata: { role, nama_lengkap, no_hp },
    })

    if (authError) {
      // Check for duplicate
      if (authError.message?.includes('already been registered') || authError.message?.includes('duplicate')) {
        return NextResponse.json(
          { error: 'Nomor HP sudah terdaftar' },
          { status: 409 }
        )
      }
      console.error('Auth create error:', authError)
      return NextResponse.json(
        { error: 'Gagal membuat akun: ' + authError.message },
        { status: 500 }
      )
    }

    const userId = authData.user.id

    // 2. Insert into public.users
    const { error: userError } = await supabase.from('users').insert({
      id: userId,
      role,
      nama_lengkap,
      no_hp,
      no_ktp: no_ktp || null,
      provinsi,
      kabupaten,
      kecamatan: kecamatan || null,
      alamat: alamat || null,
      is_verified: false,
      is_active: true,
      kyc_status: 'pending',
    })

    if (userError) {
      // Rollback auth user if public.users insert fails
      await supabase.auth.admin.deleteUser(userId)
      console.error('User insert error:', userError)
      return NextResponse.json(
        { error: 'Gagal menyimpan data user: ' + userError.message },
        { status: 500 }
      )
    }

    // 3. Insert rekening if provided
    if (rekening && rekening.provider && rekening.nomor) {
      const { error: rekError } = await supabase.from('rekening').insert({
        user_id: userId,
        metode: rekening.metode || 'bank',
        provider: rekening.provider,
        nomor: rekening.nomor,
        atas_nama: rekening.atas_nama || nama_lengkap,
        is_primary: true,
      })
      if (rekError) {
        console.error('Rekening insert error:', rekError)
        // Non-fatal — user can add later
      }
    }

    // 4. Role-specific inserts
    if (role === 'ketua_poktan' && poktan) {
      const { error: poktanError } = await supabase.from('poktan').insert({
        ketua_id: userId,
        nama_poktan: poktan.nama_poktan,
        kode_poktan: poktan.kode_poktan,
        desa: poktan.desa || poktan.kecamatan || '',
        kecamatan: poktan.kecamatan || '',
        kabupaten: poktan.kabupaten || kabupaten,
        provinsi: poktan.provinsi || provinsi,
        komoditas_utama: poktan.komoditas_utama || [],
        jumlah_anggota: poktan.jumlah_anggota || 0,
        tanggal_sertifikasi: poktan.tanggal_sertifikasi || null,
        status_sertifikasi: poktan.tanggal_sertifikasi ? 'aktif' : 'belum',
      })
      if (poktanError) {
        console.error('Poktan insert error:', poktanError)
      }
    }

    if (role === 'petani' && petani) {
      // For petani, we need a poktan_id to create anggota_poktan
      // If poktan_id is provided, insert anggota
      if (petani.poktan_id) {
        const { error: anggotaError } = await supabase.from('anggota_poktan').insert({
          poktan_id: petani.poktan_id,
          petani_id: userId,
          lahan_ha: petani.lahan_ha || null,
          komoditas: petani.komoditas || [],
          status: 'aktif',
          tanggal_bergabung: petani.tanggal_bergabung || new Date().toISOString(),
        })
        if (anggotaError) {
          console.error('Anggota poktan insert error:', anggotaError)
        }
      }
    }

    if (role === 'supplier' && supplier) {
      const { error: supplierError } = await supabase.from('supplier').insert({
        user_id: userId,
        nama_perusahaan: supplier.nama_perusahaan,
        npwp: supplier.npwp || null,
        jenis_usaha: supplier.jenis_usaha || null,
        kapasitas_bulanan_ton: supplier.kapasitas_bulanan_ton || null,
        wilayah_operasi: supplier.wilayah_operasi || [],
      })
      if (supplierError) {
        console.error('Supplier insert error:', supplierError)
      }
    }

    // 5. Fetch the created user profile
    const { data: profile } = await supabase
      .from('users')
      .select('id, role, nama_lengkap, no_hp, no_ktp, foto_url, provinsi, kabupaten, kecamatan, alamat, is_verified, is_active, kyc_status, created_at')
      .eq('id', userId)
      .single()

    return NextResponse.json({
      success: true,
      user: profile,
      auth: {
        email,
        // Don't return password in production, but for demo convenience:
        hint: 'Password sama dengan nomor HP',
      },
    })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
