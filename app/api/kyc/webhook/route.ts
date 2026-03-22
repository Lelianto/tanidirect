// DIDIT_DISABLED: akan diaktifkan kembali setelah bug selesai
// Webhook endpoint untuk Didit third-party KYC.

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

function shortenFloats(data: unknown): unknown {
  if (Array.isArray(data)) return data.map(shortenFloats)
  if (data !== null && typeof data === 'object') {
    return Object.fromEntries(
      Object.entries(data as Record<string, unknown>).map(([k, v]) => [k, shortenFloats(v)])
    )
  }
  if (typeof data === 'number' && !Number.isInteger(data) && data % 1 === 0) {
    return Math.trunc(data)
  }
  return data
}

function sortKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(sortKeys)
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj as Record<string, unknown>)
      .sort()
      .reduce((r: Record<string, unknown>, k) => {
        r[k] = sortKeys((obj as Record<string, unknown>)[k])
        return r
      }, {})
  }
  return obj
}

function verifySignatureV2(
  jsonBody: unknown,
  signature: string,
  timestamp: string,
  secret: string
): boolean {
  const currentTime = Math.floor(Date.now() / 1000)
  const incomingTime = parseInt(timestamp, 10)
  if (Math.abs(currentTime - incomingTime) > 300) return false

  const processed = shortenFloats(jsonBody)
  const canonical = JSON.stringify(sortKeys(processed))
  const hmac = crypto.createHmac('sha256', secret)
  const expected = hmac.update(canonical, 'utf8').digest('hex')

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'utf8'),
      Buffer.from(signature, 'utf8')
    )
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.DIDIT_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('DIDIT_WEBHOOK_SECRET is not configured')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const body = await request.json()
    const signatureV2 = request.headers.get('x-signature-v2')
    const timestamp = request.headers.get('x-timestamp')

    if (!signatureV2 || !timestamp) {
      return NextResponse.json({ error: 'Missing signature headers' }, { status: 401 })
    }

    if (!verifySignatureV2(body, signatureV2, timestamp, webhookSecret)) {
      console.warn('Didit webhook signature verification failed')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const { session_id, status, vendor_data, webhook_type } = body

    console.log(`[Didit Webhook] type=${webhook_type} session=${session_id} status=${status} user=${vendor_data}`)

    // In production: update user KYC status in database based on status
    // status values: 'Approved', 'Declined', 'In Review', 'In Progress', 'Not Started', 'Abandoned'
    switch (status) {
      case 'Approved':
        // Update user's KYC to approved, upgrade trust level
        console.log(`[KYC] User ${vendor_data} verification APPROVED`)
        break
      case 'Declined':
        // Update user's KYC to rejected
        console.log(`[KYC] User ${vendor_data} verification DECLINED`)
        break
      case 'In Review':
        // Mark as pending manual review
        console.log(`[KYC] User ${vendor_data} verification IN REVIEW`)
        break
      default:
        console.log(`[KYC] User ${vendor_data} status: ${status}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Didit webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
