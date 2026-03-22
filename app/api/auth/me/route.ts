import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const supabase = createServiceClient()

    // Validate the access token
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profil user tidak ditemukan' }, { status: 404 })
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
    })
  } catch (error) {
    console.error('Auth me error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
