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
  // KYC
  belum: { label: 'Belum', className: 'bg-slate-100 text-slate-700 hover:bg-slate-100' },
  approved: { label: 'Disetujui', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  rejected: { label: 'Ditolak', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
  revisi: { label: 'Revisi', className: 'bg-amber-100 text-amber-800 hover:bg-amber-100' },
  // Trust Level
  unverified: { label: 'Unverified', className: 'bg-slate-100 text-slate-700 hover:bg-slate-100' },
  verified: { label: 'Verified', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  bronze: { label: 'Bronze', className: 'bg-orange-100 text-orange-800 hover:bg-orange-100' },
  silver: { label: 'Silver', className: 'bg-gray-200 text-gray-800 hover:bg-gray-200' },
  gold: { label: 'Gold', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
  platinum: { label: 'Platinum', className: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100' },
  // Dispute
  diajukan: { label: 'Diajukan', className: 'bg-amber-100 text-amber-800 hover:bg-amber-100' },
  investigasi: { label: 'Investigasi', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  mediasi: { label: 'Mediasi', className: 'bg-purple-100 text-purple-800 hover:bg-purple-100' },
  eskalasi: { label: 'Eskalasi', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
  // Onboarding
  in_progress: { label: 'Berjalan', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  tercapai: { label: 'Tercapai', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  // Dispute Category
  kualitas: { label: 'Kualitas', className: 'bg-orange-100 text-orange-800 hover:bg-orange-100' },
  keterlambatan: { label: 'Keterlambatan', className: 'bg-amber-100 text-amber-800 hover:bg-amber-100' },
  volume: { label: 'Volume', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  pembayaran: { label: 'Pembayaran', className: 'bg-purple-100 text-purple-800 hover:bg-purple-100' },
  pembatalan: { label: 'Pembatalan', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
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
