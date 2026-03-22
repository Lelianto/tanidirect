// DIDIT_DISABLED: akan diaktifkan kembali setelah bug selesai
// Endpoint ini menggunakan Didit third-party KYC yang sedang non-aktif.
// Manual KYC flow menggunakan /api/kyc/upload dan /api/kyc/review.

import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'Didit KYC sementara non-aktif. Gunakan manual KYC flow di /register/kyc' },
    { status: 503 }
  )
}

/*
import { NextRequest, NextResponse } from 'next/server'
import { DIDIT_API_BASE, getDiditHeaders } from '@/lib/didit/config'

let cachedWorkflowId: string | null = null

async function getWorkflowId(): Promise<string | null> {
  const envId = process.env.DIDIT_WORKFLOW_ID
  if (envId) return envId
  if (cachedWorkflowId) return cachedWorkflowId

  try {
    const res = await fetch(`${DIDIT_API_BASE}/workflows/`, {
      method: 'GET',
      headers: getDiditHeaders(),
    })
    if (!res.ok) return null
    const data = await res.json()
    const workflows = Array.isArray(data) ? data : data.results
    if (Array.isArray(workflows) && workflows.length > 0) {
      const kycWorkflow = workflows.find((w: { workflow_type: string }) => w.workflow_type === 'kyc')
      const defaultWorkflow = workflows.find((w: { is_default: boolean }) => w.is_default)
      const picked = kycWorkflow || defaultWorkflow || workflows[0]
      cachedWorkflowId = picked.uuid || picked.workflow_id || picked.id
      return cachedWorkflowId
    }
  } catch (err) {
    console.error('Error fetching workflows:', err)
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const { userId, userName, userRole } = await request.json()
    if (!userId || !userName) {
      return NextResponse.json({ error: 'userId and userName are required' }, { status: 400 })
    }

    const workflowId = await getWorkflowId()
    if (!workflowId) {
      return NextResponse.json({ error: 'No workflow found.' }, { status: 500 })
    }

    const response = await fetch(`${DIDIT_API_BASE}/session/`, {
      method: 'POST',
      headers: getDiditHeaders(),
      body: JSON.stringify({
        workflow_id: workflowId,
        vendor_data: userId,
        metadata: JSON.stringify({ user_name: userName, user_role: userRole, platform: 'taninesia' }),
        language: 'id',
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.detail || 'Failed to create verification session' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json({
      session_id: data.session_id,
      session_token: data.session_token,
      verification_url: data.url,
      status: data.status,
    })
  } catch (error) {
    console.error('Didit session creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
*/
