import { NextRequest, NextResponse } from 'next/server'
import { DIDIT_API_BASE, getDiditHeaders } from '@/lib/didit/config'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      )
    }

    const response = await fetch(
      `${DIDIT_API_BASE}/session/${sessionId}/decision/`,
      {
        method: 'GET',
        headers: getDiditHeaders(),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.detail || 'Failed to retrieve session' },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      session_id: data.session_id,
      status: data.status,
      vendor_data: data.vendor_data,
      features: data.features,
      created_at: data.created_at,
    })
  } catch (error) {
    console.error('Didit session retrieval error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
