import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('disputes')
      .select('*, transaksi:transaksi_id(id, komoditas, grade, status)')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, disputes: data || [] })
  } catch (error) {
    console.error('Admin disputes error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { dispute_id, keputusan, resolusi, kompensasi } = body

    if (!dispute_id || !keputusan) {
      return NextResponse.json({ error: 'dispute_id dan keputusan wajib diisi' }, { status: 400 })
    }

    // Determine new status based on decision
    let newStatus: string
    if (keputusan === 'kompensasi' || keputusan === 'tolak') {
      newStatus = 'selesai'
    } else {
      newStatus = keputusan // 'mediasi' or 'eskalasi'
    }

    // First get current dispute for timeline
    const { data: current } = await supabase
      .from('disputes')
      .select('timeline')
      .eq('id', dispute_id)
      .single()

    const existingTimeline = (current?.timeline as unknown[]) || []
    const newTimelineEntry = {
      id: `tl-${Date.now()}`,
      aksi: `Keputusan: ${keputusan}`,
      oleh: 'Admin',
      catatan: resolusi || null,
      created_at: new Date().toISOString(),
    }

    const updateData: Record<string, unknown> = {
      status: newStatus,
      resolusi: resolusi || null,
      kompensasi: kompensasi || 0,
      timeline: [...existingTimeline, newTimelineEntry],
    }

    const { data, error } = await supabase
      .from('disputes')
      .update(updateData)
      .eq('id', dispute_id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, dispute: data })
  } catch (error) {
    console.error('Admin disputes POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
