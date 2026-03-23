import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const roleFilter = request.nextUrl.searchParams.get('role') // 'petani' | 'ketua_poktan'

    // Fetch users with role petani or ketua_poktan
    const query = supabase
      .from('users')
      .select('*')
      .in('role', roleFilter ? [roleFilter] : ['petani', 'ketua_poktan'])
      .order('created_at', { ascending: false })

    const { data: users, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ success: true, users: [] })
    }

    const userIds = users.map((u) => u.id)

    // Fetch KYC submissions for these users
    const { data: kycSubmissions } = await supabase
      .from('kyc_submissions')
      .select('*, documents:kyc_submission_documents(*)')
      .in('user_id', userIds)
      .order('layer', { ascending: true })

    // Fetch KYC documents (KTP, selfie)
    const { data: kycDocuments } = await supabase
      .from('kyc_documents')
      .select('*')
      .in('user_id', userIds)

    // Fetch poktan membership for petani (anggota_poktan)
    const { data: memberships } = await supabase
      .from('anggota_poktan')
      .select('*, poktan:poktan_id(id, nama_poktan, kode_poktan, kabupaten, provinsi)')
      .in('petani_id', userIds)

    // Fetch poktan data for ketua_poktan
    const { data: poktanData } = await supabase
      .from('poktan')
      .select('*')
      .in('ketua_id', userIds)

    // Map data per user
    const kycSubMap = new Map<string, NonNullable<typeof kycSubmissions>>()
    const kycDocMap = new Map<string, NonNullable<typeof kycDocuments>>()
    const membershipMap = new Map<string, NonNullable<typeof memberships>>()
    type PoktanRow = NonNullable<typeof poktanData>[number]
    const poktanMap = new Map<string, PoktanRow>()

    for (const sub of kycSubmissions || []) {
      const arr = kycSubMap.get(sub.user_id) || []
      arr.push(sub)
      kycSubMap.set(sub.user_id, arr)
    }
    for (const doc of kycDocuments || []) {
      const arr = kycDocMap.get(doc.user_id) || []
      arr.push(doc)
      kycDocMap.set(doc.user_id, arr)
    }
    for (const m of memberships || []) {
      const arr = membershipMap.get(m.petani_id) || []
      arr.push(m)
      membershipMap.set(m.petani_id, arr)
    }
    for (const p of poktanData || []) {
      poktanMap.set(p.ketua_id, p)
    }

    const enriched = users.map((u) => ({
      ...u,
      kyc_submissions: kycSubMap.get(u.id) || [],
      kyc_documents: kycDocMap.get(u.id) || [],
      poktan_membership: membershipMap.get(u.id) || [],
      poktan_ketua: poktanMap.get(u.id) || null,
    }))

    return NextResponse.json({ success: true, users: enriched })
  } catch (error) {
    console.error('Admin akun error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, action, ...fields } = body

    if (!user_id || !action) {
      return NextResponse.json({ error: 'user_id dan action wajib diisi' }, { status: 400 })
    }

    const supabase = createServiceClient()

    if (action === 'toggle_active') {
      const { data: user } = await supabase
        .from('users')
        .select('is_active')
        .eq('id', user_id)
        .single()

      if (!user) {
        return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
      }

      const { error } = await supabase
        .from('users')
        .update({ is_active: !user.is_active })
        .eq('id', user_id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: user.is_active ? 'Akun dinonaktifkan' : 'Akun diaktifkan kembali',
      })
    }

    if (action === 'toggle_verified') {
      const { data: user } = await supabase
        .from('users')
        .select('is_verified')
        .eq('id', user_id)
        .single()

      if (!user) {
        return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
      }

      const { error } = await supabase
        .from('users')
        .update({ is_verified: !user.is_verified })
        .eq('id', user_id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: user.is_verified ? 'Verifikasi dicabut' : 'Akun diverifikasi',
      })
    }

    if (action === 'update_profile') {
      const allowedFields = ['nama_lengkap', 'no_hp', 'provinsi', 'kabupaten', 'kecamatan', 'alamat']
      const updateData: Record<string, unknown> = {}
      for (const key of allowedFields) {
        if (fields[key] !== undefined) {
          updateData[key] = fields[key]
        }
      }

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ error: 'Tidak ada field yang diupdate' }, { status: 400 })
      }

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user_id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: 'Profil berhasil diupdate' })
    }

    return NextResponse.json({ error: 'Action tidak dikenali' }, { status: 400 })
  } catch (error) {
    console.error('Admin akun PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
