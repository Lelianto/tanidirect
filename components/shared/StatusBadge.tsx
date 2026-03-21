'use client'

import { Badge } from '@/components/ui/badge'

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  // Transaksi
  draft: { label: 'Draft', className: 'bg-slate-100 text-slate-700 hover:bg-slate-100' },
  menunggu_konfirmasi: { label: 'Menunggu', className: 'bg-amber-100 text-amber-800 hover:bg-amber-100' },
  dikonfirmasi: { label: 'Dikonfirmasi', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  dalam_pengiriman: { label: 'Dikirim', className: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100' },
  tiba_di_gudang: { label: 'Tiba', className: 'bg-teal-100 text-teal-800 hover:bg-teal-100' },
  selesai: { label: 'Selesai', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  dibatalkan: { label: 'Dibatalkan', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
  sengketa: { label: 'Sengketa', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
  // Pre-order
  open: { label: 'Terbuka', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  matched: { label: 'Matched', className: 'bg-purple-100 text-purple-800 hover:bg-purple-100' },
  confirmed: { label: 'Dikonfirmasi', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  fulfilled: { label: 'Terpenuhi', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  cancelled: { label: 'Dibatalkan', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
  // QA
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-800 hover:bg-amber-100' },
  lulus: { label: 'Lulus', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  gagal: { label: 'Gagal', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
  perlu_tinjauan: { label: 'Review', className: 'bg-amber-100 text-amber-800 hover:bg-amber-100' },
  // Risiko
  rendah: { label: 'Rendah', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  sedang: { label: 'Sedang', className: 'bg-amber-100 text-amber-800 hover:bg-amber-100' },
  tinggi: { label: 'Tinggi', className: 'bg-orange-100 text-orange-800 hover:bg-orange-100' },
  kritis: { label: 'Kritis', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
  // Kredit
  disetujui: { label: 'Disetujui', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  ditolak: { label: 'Ditolak', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
  aktif: { label: 'Aktif', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  lunas: { label: 'Lunas', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  // Bayar
  dibayar: { label: 'Dibayar', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  belum_bayar: { label: 'Belum Bayar', className: 'bg-amber-100 text-amber-800 hover:bg-amber-100' },
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || {
    label: status.replace(/_/g, ' '),
    className: 'bg-slate-100 text-slate-700 hover:bg-slate-100',
  }

  return (
    <Badge variant="secondary" className={`${config.className} text-xs font-medium capitalize ${className || ''}`}>
      {config.label}
    </Badge>
  )
}
