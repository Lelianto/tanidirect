'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthStore } from '@/store'
import { ShieldCheck, Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'

type VerificationStatus = 'idle' | 'loading' | 'verifying' | 'approved' | 'declined' | 'error'

interface DiditVerificationProps {
  onComplete?: (status: string, sessionId: string) => void
}

export function DiditVerification({ onComplete }: DiditVerificationProps) {
  const user = useAuthStore((s) => s.user)
  const [status, setStatus] = useState<VerificationStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [sessionId, setSessionId] = useState('')

  const startVerification = useCallback(async () => {
    if (!user) return

    setStatus('loading')
    setErrorMsg('')

    try {
      // 1. Create session via backend
      const res = await fetch('/api/kyc/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userName: user.nama_lengkap,
          userRole: user.role,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Gagal membuat sesi verifikasi')
      }

      const { verification_url, session_id } = await res.json()
      setSessionId(session_id)

      // 2. Import and initialize Didit SDK
      const { DiditSdk } = await import('@didit-protocol/sdk-web')

      DiditSdk.shared.onComplete = (result: { type: string; session?: { sessionId: string; status: string }; error?: { message: string } }) => {
        if (result.type === 'completed') {
          const s = result.session?.status
          if (s === 'Approved') {
            setStatus('approved')
          } else if (s === 'Declined') {
            setStatus('declined')
          } else {
            setStatus('idle')
          }
          onComplete?.(s || 'unknown', result.session?.sessionId || session_id)
        } else if (result.type === 'cancelled') {
          setStatus('idle')
        } else if (result.type === 'failed') {
          setStatus('error')
          setErrorMsg(result.error?.message || 'Verifikasi gagal')
        }
      }

      DiditSdk.shared.onStateChange = (state: string) => {
        if (state === 'ready') {
          setStatus('verifying')
        } else if (state === 'error') {
          setStatus('error')
        }
      }

      // 3. Start verification
      DiditSdk.shared.startVerification({
        url: verification_url,
        configuration: {
          showCloseButton: true,
          showExitConfirmation: true,
          closeModalOnComplete: true,
        },
      })

      setStatus('verifying')
    } catch (error) {
      setStatus('error')
      setErrorMsg(error instanceof Error ? error.message : 'Terjadi kesalahan')
    }
  }, [user, onComplete])

  const statusConfig = {
    idle: {
      icon: <ShieldCheck className="h-8 w-8 text-tani-green" />,
      title: 'Verifikasi Identitas',
      description: 'Verifikasi identitas Anda untuk meningkatkan level kepercayaan dan mengakses fitur lengkap platform.',
      buttonText: 'Mulai Verifikasi KYC',
      buttonDisabled: false,
    },
    loading: {
      icon: <Loader2 className="h-8 w-8 text-tani-green animate-spin" />,
      title: 'Menyiapkan Verifikasi...',
      description: 'Mohon tunggu, kami sedang menyiapkan sesi verifikasi Anda.',
      buttonText: 'Menyiapkan...',
      buttonDisabled: true,
    },
    verifying: {
      icon: <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />,
      title: 'Verifikasi Sedang Berlangsung',
      description: 'Silakan selesaikan proses verifikasi di jendela yang muncul.',
      buttonText: 'Verifikasi Berlangsung...',
      buttonDisabled: true,
    },
    approved: {
      icon: <CheckCircle2 className="h-8 w-8 text-green-600" />,
      title: 'Verifikasi Berhasil!',
      description: 'Identitas Anda telah diverifikasi. Level kepercayaan Anda akan segera diperbarui.',
      buttonText: 'Verifikasi Ulang',
      buttonDisabled: false,
    },
    declined: {
      icon: <XCircle className="h-8 w-8 text-red-600" />,
      title: 'Verifikasi Ditolak',
      description: 'Verifikasi identitas Anda tidak berhasil. Pastikan dokumen yang diunggah jelas dan valid.',
      buttonText: 'Coba Lagi',
      buttonDisabled: false,
    },
    error: {
      icon: <AlertTriangle className="h-8 w-8 text-amber-600" />,
      title: 'Terjadi Kesalahan',
      description: errorMsg || 'Silakan coba lagi atau hubungi customer support.',
      buttonText: 'Coba Lagi',
      buttonDisabled: false,
    },
  }

  const config = statusConfig[status]

  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          {config.icon}
          <div>
            <h3 className="font-semibold text-base font-[family-name:var(--font-heading)]">
              {config.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              {config.description}
            </p>
          </div>

          {sessionId && status === 'approved' && (
            <div className="bg-green-50 rounded-lg p-3 w-full">
              <p className="text-xs text-green-700">
                Session ID: <span className="font-mono">{sessionId}</span>
              </p>
            </div>
          )}

          <Button
            className={`w-full max-w-xs ${
              status === 'approved'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-tani-green hover:bg-tani-green/90'
            }`}
            disabled={config.buttonDisabled}
            onClick={startVerification}
          >
            {status === 'loading' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {status !== 'loading' && <ShieldCheck className="h-4 w-4 mr-2" />}
            {config.buttonText}
          </Button>

          <p className="text-xs text-muted-foreground">
            Powered by <span className="font-medium">Didit</span> — Verifikasi identitas aman & terenkripsi
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
