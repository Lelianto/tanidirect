import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { no_hp, password } = await request.json()

    if (!no_hp) {
      return NextResponse.json(
        { error: 'Nomor HP wajib diisi' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Derive email from phone (same format as register)
    const email = `${no_hp.replace(/[^0-9]/g, '')}@taninesia.local`
    const loginPassword = password || no_hp // Default password = phone number

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: loginPassword,
    })

    if (authError) {
      return NextResponse.json(
        { error: 'Login gagal. Periksa nomor HP dan password Anda.' },
        { status: 401 }
      )
    }

    // Fetch user profile from public.users
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profil user tidak ditemukan' },
        { status: 404 }
      )
    }

    // Fetch rekening
    const { data: rekening } = await supabase
      .from('rekening')
      .select('*')
      .eq('user_id', profile.id)
      .eq('is_primary', true)
      .maybeSingle()

    // Fetch SOP agreements
    const { data: sopAgreements } = await supabase
      .from('sop_agreements')
      .select('sop_key, agreed_at')
      .eq('user_id', profile.id)

    // Role-specific data
    let roleData = null

    if (profile.role === 'ketua_poktan') {
      const { data } = await supabase
        .from('poktan')
        .select('*')
        .eq('ketua_id', profile.id)
        .maybeSingle()
      roleData = data
    } else if (profile.role === 'supplier') {
      const { data } = await supabase
        .from('supplier')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle()
      roleData = data
    } else if (profile.role === 'petani') {
      const { data } = await supabase
        .from('anggota_poktan')
        .select('*, poktan:poktan_id(*)')
        .eq('petani_id', profile.id)
        .maybeSingle()
      roleData = data
    }

    return NextResponse.json({
      success: true,
      user: {
        ...profile,
        rekening: rekening || null,
      },
      roleData,
      sopAgreements: sopAgreements || [],
      session: {
        access_token: authData.session?.access_token,
        refresh_token: authData.session?.refresh_token,
        expires_at: authData.session?.expires_at,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
