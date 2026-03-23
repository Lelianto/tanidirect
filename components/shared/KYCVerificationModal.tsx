'use client'

import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ShieldAlert, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/store'
import type { KYCStatus } from '@/types'

interface KYCVerificationModalProps {
  open: boolean
  onDismiss: () => void
}

const KYC_STATUS_INFO: Record<string, { label: string; description: string; color: string }> = {
  pending: {
    label: 'Menunggu Verifikasi',
    description: 'Silakan lengkapi dokumen identitas Anda untuk memulai proses verifikasi.',
    color: 'text-amber-600',
  },
  docs_incomplete: {
    label: 'Dokumen Belum Lengkap',
    description: 'Beberapa dokumen masih kurang. Silakan lengkapi di halaman Status KYC.',
    color: 'text-amber-600',
  },
  docs_submitted: {
    label: 'Dokumen Sedang Ditinjau',
    description: 'Dokumen Anda sedang dalam proses review oleh tim kami. Harap tunggu.',
    color: 'text-blue-600',
  },
  docs_revision: {
    label: 'Perlu Revisi Dokumen',
    description: 'Ada dokumen yang perlu diperbaiki. Silakan cek catatan reviewer di halaman Status KYC.',
    color: 'text-orange-600',
  },
  layer1_passed: {
    label: 'Layer 1 Terverifikasi',
    description: 'Verifikasi layer 1 berhasil. Lanjutkan ke layer berikutnya untuk akses penuh.',
    color: 'text-tani-green',
  },
  layer1_failed: {
    label: 'Verifikasi Layer 1 Gagal',
    description: 'Verifikasi layer 1 tidak berhasil. Silakan ajukan ulang dengan dokumen yang valid.',
    color: 'text-red-600',
  },
  suspended: {
    label: 'Akun Disuspend',
    description: 'Akun Anda sedang dalam penangguhan. Hubungi admin untuk informasi lebih lanjut.',
    color: 'text-red-600',
  },
}

export function KYCVerificationModal({ open, onDismiss }: KYCVerificationModalProps) {
  const router = useRouter()
  const { user, role } = useAuthStore()

  const kycStatus = (user?.kyc_status || 'pending') as KYCStatus
  const statusInfo = KYC_STATUS_INFO[kycStatus] || KYC_STATUS_INFO.pending

  const kycPath = role === 'ketua_poktan' ? '/poktan/kyc'
    : role === 'supplier' ? '/supplier/kyc'
    : role === 'petani' ? '/petani/kyc'
    : '/kyc'

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onDismiss() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            Verifikasi Identitas Diperlukan
          </DialogTitle>
          <DialogDescription className="sr-only">
            Anda perlu menyelesaikan verifikasi KYC untuk mengakses semua fitur platform.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 space-y-2">
            <p className={`text-sm font-semibold ${statusInfo.color}`}>
              {statusInfo.label}
            </p>
            <p className="text-sm text-gray-600">
              {statusInfo.description}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-2">
              Fitur yang memerlukan verifikasi:
            </p>
            <ul className="text-xs text-gray-600 space-y-1">
              {role === 'ketua_poktan' && (
                <>
                  <li>- Catatan Panen & QA Inspeksi</li>
                  <li>- Keuangan & Permintaan Supplier</li>
                  <li>- Pengiriman</li>
                </>
              )}
              {role === 'supplier' && (
                <>
                  <li>- Pre-Order & Pembayaran</li>
                  <li>- Review QA & Transaksi</li>
                  <li>- Pengiriman</li>
                </>
              )}
              {role === 'petani' && (
                <li>- Riwayat Transaksi</li>
              )}
            </ul>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onDismiss}
            >
              Nanti Saja
            </Button>
            <Button
              className="flex-1 bg-tani-green hover:bg-tani-green/90"
              onClick={() => {
                onDismiss()
                router.push(kycPath)
              }}
            >
              Verifikasi Sekarang
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
