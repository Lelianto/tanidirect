import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types'

export interface AuthUser {
  id: string
  role: UserRole
  nama_lengkap: string
  no_hp: string
  is_verified: boolean
  is_active: boolean
  kyc_status: string
}

interface AuthResult {
  user: AuthUser
  supabase: ReturnType<typeof createServiceClient>
}

/**
 * Validates the Bearer token and returns the authenticated user profile.
 * Returns a NextResponse error if authentication fails.
 */
export async function requireAuth(
  request: NextRequest
): Promise<AuthResult | NextResponse> {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 })
  }

  const supabase = createServiceClient()

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser(token)

  if (authError || !authUser) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    )
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select(
      'id, role, nama_lengkap, no_hp, is_verified, is_active, kyc_status'
    )
    .eq('id', authUser.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json(
      { error: 'Profil user tidak ditemukan' },
      { status: 404 }
    )
  }

  return { user: profile as AuthUser, supabase }
}

/**
 * Validates auth + checks that the user has one of the allowed roles.
 * Usage:
 *   const auth = await requireRole(request, 'admin')
 *   if (auth instanceof NextResponse) return auth
 *   const { user, supabase } = auth
 */
export async function requireRole(
  request: NextRequest,
  ...roles: UserRole[]
): Promise<AuthResult | NextResponse> {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth

  if (!roles.includes(auth.user.role)) {
    return NextResponse.json(
      { error: 'Akses ditolak: role tidak memiliki izin' },
      { status: 403 }
    )
  }

  return auth
}
