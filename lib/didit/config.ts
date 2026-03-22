// Didit KYC Configuration
// API keys are stored in .env.local (server-side only)
// DIDIT_API_KEY, DIDIT_APP_ID, DIDIT_WEBHOOK_SECRET, DIDIT_WORKFLOW_ID

export const DIDIT_API_BASE = 'https://verification.didit.me/v3'

export function getDiditHeaders() {
  const apiKey = process.env.DIDIT_API_KEY
  if (!apiKey) throw new Error('DIDIT_API_KEY is not configured')
  return {
    'x-api-key': apiKey,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
}
