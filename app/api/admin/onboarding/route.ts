import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, 'admin')
    if (auth instanceof NextResponse) return auth
    const { supabase } = auth

    const [milestonesRes, checklistRes] = await Promise.all([
      supabase.from('onboarding_milestones').select('id, phase, nama, deskripsi, target, current, unit, status, created_at').order('phase', { ascending: true }),
      supabase.from('onboarding_checklist').select('id, kategori, item, is_done, pic').order('kategori', { ascending: true }),
    ])

    if (milestonesRes.error) {
      return NextResponse.json({ error: milestonesRes.error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      milestones: milestonesRes.data || [],
      checklist: checklistRes.data || [],
    })
  } catch (error) {
    console.error('Admin onboarding error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
