'use client'

import { AlertTriangle, ArrowRight, Clock, FileWarning, ShieldAlert, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface KYCStatusBannerProps {
  kycStatus: string
  onAction?: () => void
}

const STATUS_CONFIG: Record<string, {
  color: string
  icon: React.ReactNode
  message: string
  cta?: string
  href?: string
} | null> = {
  pending: {
    color: 'bg-gray-50 border-gray-200 text-gray-800',
    icon: <ShieldCheck className="h-5 w-5 text-gray-500" />,
    message: 'Lengkapi verifikasi identitas untuk bisa bertransaksi',
    cta: 'Mulai Verifikasi',
    href: '/register/kyc',
  },
  docs_incomplete: {
    color: 'bg-amber-50 border-amber-200 text-amber-800',
    icon: <FileWarning className="h-5 w-5 text-amber-600" />,
    message: 'Upload dokumen belum lengkap',
    cta: 'Lanjutkan Upload',
    href: '/register/kyc',
  },
  docs_submitted: {
    color: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: <Clock className="h-5 w-5 text-blue-600" />,
    message: 'Dokumen sedang direview — maks. 3 hari kerja',
  },
  docs_revision: {
    color: 'bg-amber-50 border-amber-200 text-amber-800',
    icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
    message: 'Dokumen perlu diperbaiki — lihat catatan dari tim kami',
    cta: 'Perbaiki Sekarang',
    href: '/register/kyc',
  },
  layer1_failed: {
    color: 'bg-red-50 border-red-200 text-red-800',
    icon: <ShieldAlert className="h-5 w-5 text-red-600" />,
    message: 'Verifikasi gagal — hubungi support',
  },
  layer1_passed: null,
  fully_verified: null,
}

export function KYCStatusBanner({ kycStatus, onAction }: KYCStatusBannerProps) {
  const config = STATUS_CONFIG[kycStatus]
  if (!config) return null

  return (
    <div className={`rounded-xl border p-4 ${config.color}`}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">{config.icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{config.message}</p>
        </div>
        {config.cta && config.href && (
          <Link href={config.href}>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 text-xs"
              onClick={onAction}
            >
              {config.cta}
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}
