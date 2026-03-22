import { NextResponse } from 'next/server'
import { DIDIT_API_BASE, getDiditHeaders } from '@/lib/didit/config'

export async function GET() {
  try {
    const response = await fetch(`${DIDIT_API_BASE}/workflows/`, {
      method: 'GET',
      headers: getDiditHeaders(),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      return NextResponse.json(
        { error: `Didit API returned ${response.status}`, detail: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Didit workflows fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
