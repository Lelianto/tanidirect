import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth
    const { user, supabase } = auth

    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')

    if (!path) {
      return NextResponse.json(
        { error: 'Parameter "path" wajib diisi' },
        { status: 400 }
      )
    }

    // Sanitize: block path traversal attempts
    if (path.includes('..') || path.startsWith('/')) {
      return NextResponse.json(
        { error: 'Path tidak valid' },
        { status: 400 }
      )
    }

    // Non-admin users can only access their own KYC documents
    if (user.role !== 'admin' && !path.startsWith(`${user.id}/`)) {
      return NextResponse.json(
        { error: 'Akses ditolak: Anda hanya bisa mengakses dokumen sendiri' },
        { status: 403 }
      )
    }

    // Generate signed URL (expires in 60 minutes)
    const { data, error } = await supabase.storage
      .from('kyc-documents')
      .createSignedUrl(path, 3600)

    if (error) {
      return NextResponse.json(
        { error: 'Gagal membuat signed URL: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ signedUrl: data.signedUrl })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
