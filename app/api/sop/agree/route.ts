import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { user_id, sop_key } = await request.json()

    if (!user_id || !sop_key) {
      return NextResponse.json(
        { error: 'user_id dan sop_key wajib diisi' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, nama_lengkap, role')
      .eq('id', user_id)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    // Upsert SOP agreement (idempotent)
    const { error: sopError } = await supabase
      .from('sop_agreements')
      .upsert(
        {
          user_id,
          sop_key,
          agreed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,sop_key' }
      )

    if (sopError) {
      console.error('SOP agreement error:', sopError)
      return NextResponse.json(
        { error: 'Gagal menyimpan persetujuan SOP: ' + sopError.message },
        { status: 500 }
      )
    }

    // Insert audit notification
    await supabase.from('notifikasi').insert({
      user_id,
      judul: 'SOP Disetujui',
      pesan: `Anda telah menyetujui ${sop_key}`,
      tipe: 'sop_agreement',
      is_read: false,
    })

    return NextResponse.json({
      success: true,
      sop_key,
      agreed_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('SOP agree error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET: Check SOP agreements for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id wajib diisi' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('sop_agreements')
      .select('sop_key, agreed_at')
      .eq('user_id', userId)

    if (error) {
      return NextResponse.json(
        { error: 'Gagal mengambil data SOP: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      agreements: data || [],
    })
  } catch (error) {
    console.error('SOP get error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
