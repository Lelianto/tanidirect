import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')

    if (!path) {
      return NextResponse.json(
        { error: 'Parameter "path" wajib diisi' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Generate signed URL (expires in 60 minutes)
    const { data, error } = await supabase.storage
      .from('kyc-documents')
      .createSignedUrl(path, 3600)

    if (error) {
      console.error('Signed URL error:', error)
      return NextResponse.json(
        { error: 'Gagal membuat signed URL: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ signedUrl: data.signedUrl })
  } catch (error) {
    console.error('Signed URL error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
