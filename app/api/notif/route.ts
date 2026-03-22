import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('user_id')
    if (!userId) {
      return NextResponse.json({ error: 'user_id wajib diisi' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('notifikasi')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, notifications: data || [] })
  } catch (error) {
    console.error('Notif error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { notification_id, user_id, mark_all_read } = await request.json()
    const supabase = createServiceClient()

    if (mark_all_read && user_id) {
      await supabase.from('notifikasi').update({ is_read: true }).eq('user_id', user_id).eq('is_read', false)
    } else if (notification_id) {
      await supabase.from('notifikasi').update({ is_read: true }).eq('id', notification_id)
    } else {
      return NextResponse.json({ error: 'notification_id atau mark_all_read + user_id wajib diisi' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Notif patch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
