import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServiceClient()

    const { data: logs, error } = await supabase
      .from('kyc_audit_log')
      .select('*, user:users!kyc_audit_log_user_id_fkey(nama_lengkap, role), admin:users!kyc_audit_log_admin_id_fkey(nama_lengkap)')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      // Fallback: try without foreign key hints
      const { data: logsSimple, error: simpleError } = await supabase
        .from('kyc_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (simpleError) {
        console.error('Audit log fetch error:', simpleError)
        return NextResponse.json(
          { error: 'Gagal mengambil audit log: ' + simpleError.message },
          { status: 500 }
        )
      }

      // Enrich with user names
      const userIds = [...new Set((logsSimple || []).flatMap((l) => [l.user_id, l.admin_id].filter(Boolean)))]

      let usersMap = new Map<string, { nama_lengkap: string; role: string }>()
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, nama_lengkap, role')
          .in('id', userIds)

        if (users) {
          usersMap = new Map(users.map((u) => [u.id, { nama_lengkap: u.nama_lengkap, role: u.role }]))
        }
      }

      const enrichedLogs = (logsSimple || []).map((log) => ({
        ...log,
        user_nama: usersMap.get(log.user_id)?.nama_lengkap || '-',
        user_role: usersMap.get(log.user_id)?.role || '-',
        admin_nama: log.admin_id ? usersMap.get(log.admin_id)?.nama_lengkap || 'Admin' : '-',
      }))

      return NextResponse.json({ success: true, logs: enrichedLogs })
    }

    const enrichedLogs = (logs || []).map((log) => ({
      id: log.id,
      user_id: log.user_id,
      admin_id: log.admin_id,
      action: log.action,
      notes: log.notes,
      created_at: log.created_at,
      user_nama: log.user?.nama_lengkap || '-',
      user_role: log.user?.role || '-',
      admin_nama: log.admin?.nama_lengkap || '-',
    }))

    return NextResponse.json({ success: true, logs: enrichedLogs })
  } catch (error) {
    console.error('Audit log error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
