'use client'

import { useState, useEffect, useCallback } from 'react'
import { TopBar } from '@/components/shared/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { useAuthStore } from '@/store'
import { formatRupiah } from '@/lib/utils/currency'
import { toast } from 'sonner'
import {
  Wallet, Clock, CheckCircle, XCircle, Eye, Loader2,
  Building2, AlertCircle, Image as ImageIcon, Receipt, RotateCcw,
} from 'lucide-react'
import type { StatusPembayaran } from '@/types'

interface PembayaranAdmin {
  id: string
  pre_order_id: string
  supplier_id: string
  jenis_pembayaran: 'deposit' | 'full'
  jumlah: number
  total_nilai_po: number
  metode_transfer?: string
  bukti_transfer_url?: string
  catatan_supplier?: string
  status: StatusPembayaran
  admin_catatan?: string
  verified_at?: string
  rejected_at?: string
  refunded_at?: string
  refund_catatan?: string
  created_at: string
  pre_order?: {
    id: string
    komoditas: string
    grade: string
    volume_kg: number
    harga_penawaran_per_kg: number
    status: string
    tanggal_dibutuhkan: string
    wilayah_tujuan: string
  }
  supplier?: {
    id: string
    nama_perusahaan: string
    user_id: string
    user?: { nama_lengkap: string; no_hp: string }
  }
}

const STATUS_CONFIG: Record<StatusPembayaran, { label: string; color: string; icon: React.ReactNode }> = {
  menunggu_pembayaran: { label: 'Menunggu Pembayaran', color: 'bg-gray-100 text-gray-800', icon: <Clock className="h-3 w-3" /> },
  menunggu_verifikasi: { label: 'Menunggu Verifikasi', color: 'bg-amber-100 text-amber-800', icon: <Eye className="h-3 w-3" /> },
  terverifikasi: { label: 'Terverifikasi', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3" /> },
  ditolak: { label: 'Ditolak', color: 'bg-red-100 text-red-800', icon: <XCircle className="h-3 w-3" /> },
  refunded: { label: 'Refunded', color: 'bg-purple-100 text-purple-800', icon: <RotateCcw className="h-3 w-3" /> },
}

const TAB_MAP = [
  { value: 'pending', label: 'Perlu Verifikasi', statuses: ['menunggu_verifikasi'] as StatusPembayaran[] },
  { value: 'semua', label: 'Semua', statuses: null },
  { value: 'verified', label: 'Terverifikasi', statuses: ['terverifikasi'] as StatusPembayaran[] },
  { value: 'rejected', label: 'Ditolak', statuses: ['ditolak'] as StatusPembayaran[] },
  { value: 'refunded', label: 'Refunded', statuses: ['refunded'] as StatusPembayaran[] },
]

export default function AdminPembayaranPage() {
  const adminUser = useAuthStore((s) => s.user)
  const [pembayaran, setPembayaran] = useState<PembayaranAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState<PembayaranAdmin | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [refundDialogOpen, setRefundDialogOpen] = useState(false)
  const [adminCatatan, setAdminCatatan] = useState('')
  const [processing, setProcessing] = useState(false)
  const [imageDialogOpen, setImageDialogOpen] = useState(false)

  const fetchPembayaran = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/pembayaran')
      if (res.ok) {
        const data = await res.json()
        setPembayaran(data.pembayaran || [])
      }
    } catch {
      toast.error('Gagal memuat data pembayaran')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPembayaran()
  }, [fetchPembayaran])

  async function handleVerify() {
    if (!selectedPayment || !adminUser) return
    setProcessing(true)
    try {
      const res = await fetch('/api/admin/pembayaran', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pembayaran_id: selectedPayment.id,
          action: 'terverifikasi',
          admin_id: adminUser.id,
          admin_catatan: adminCatatan || undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Gagal memverifikasi')
      }
      toast.success('Pembayaran berhasil diverifikasi')
      setDialogOpen(false)
      setSelectedPayment(null)
      setAdminCatatan('')
      fetchPembayaran()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal memverifikasi')
    } finally {
      setProcessing(false)
    }
  }

  async function handleReject() {
    if (!selectedPayment || !adminUser) return
    if (!adminCatatan.trim()) {
      toast.error('Alasan penolakan wajib diisi')
      return
    }
    setProcessing(true)
    try {
      const res = await fetch('/api/admin/pembayaran', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pembayaran_id: selectedPayment.id,
          action: 'ditolak',
          admin_id: adminUser.id,
          admin_catatan: adminCatatan,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Gagal menolak')
      }
      toast.success('Pembayaran ditolak')
      setRejectDialogOpen(false)
      setSelectedPayment(null)
      setAdminCatatan('')
      fetchPembayaran()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menolak')
    } finally {
      setProcessing(false)
    }
  }

  async function handleRefund() {
    if (!selectedPayment || !adminUser) return
    setProcessing(true)
    try {
      const res = await fetch('/api/admin/pembayaran/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pembayaran_id: selectedPayment.id,
          admin_id: adminUser.id,
          refund_catatan: adminCatatan || undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Gagal memproses refund')
      }
      const data = await res.json()
      toast.success(data.message || 'Refund berhasil diproses')
      setRefundDialogOpen(false)
      setSelectedPayment(null)
      setAdminCatatan('')
      fetchPembayaran()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal memproses refund')
    } finally {
      setProcessing(false)
    }
  }

  const pendingCount = pembayaran.filter((p) => p.status === 'menunggu_verifikasi').length
  const totalVerified = pembayaran
    .filter((p) => p.status === 'terverifikasi')
    .reduce((sum, p) => sum + Number(p.jumlah), 0)

  return (
    <>
      <TopBar title="Verifikasi Pembayaran" />
      <div className="p-4 lg:p-6 space-y-4 max-w-4xl">
        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <Card className="shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span className="text-xs text-muted-foreground">Perlu Verifikasi</span>
              </div>
              <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="h-4 w-4 text-tani-green" />
                <span className="text-xs text-muted-foreground">Total Terverifikasi</span>
              </div>
              <p className="text-2xl font-bold text-tani-green">{formatRupiah(totalVerified)}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm col-span-2 lg:col-span-1">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Receipt className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">Total Transaksi</span>
              </div>
              <p className="text-2xl font-bold">{pembayaran.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="w-full overflow-x-auto flex justify-start h-auto p-1 bg-muted/50">
            {TAB_MAP.map((tab) => {
              const count = tab.statuses
                ? pembayaran.filter((p) => tab.statuses!.includes(p.status)).length
                : pembayaran.length
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="text-xs px-3 py-1.5 whitespace-nowrap data-[state=active]:bg-white"
                >
                  {tab.label}
                  {count > 0 && (
                    <span className="ml-1.5 bg-tani-green/10 text-tani-green text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {count}
                    </span>
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>

          {TAB_MAP.map((tab) => {
            const filtered = tab.statuses
              ? pembayaran.filter((p) => tab.statuses!.includes(p.status))
              : pembayaran

            return (
              <TabsContent key={tab.value} value={tab.value} className="space-y-3 mt-3">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Receipt className="h-10 w-10 mb-3 opacity-40" />
                    <p className="text-sm font-medium">Tidak ada data</p>
                  </div>
                ) : (
                  filtered.map((p) => {
                    const statusCfg = STATUS_CONFIG[p.status]
                    return (
                      <Card key={p.id} className="shadow-sm">
                        <CardContent className="p-4 space-y-3">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-sm">
                                {p.supplier?.nama_perusahaan || 'Supplier'}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {p.supplier?.user?.nama_lengkap} - {p.supplier?.user?.no_hp}
                              </p>
                            </div>
                            <Badge className={`${statusCfg.color} text-[10px] px-2 py-0.5 gap-1`}>
                              {statusCfg.icon}
                              {statusCfg.label}
                            </Badge>
                          </div>

                          <Separator />

                          {/* Details */}
                          <div className="grid grid-cols-2 gap-y-2 text-sm">
                            <div>
                              <p className="text-xs text-muted-foreground">Pre-Order</p>
                              <p className="font-medium">
                                {p.pre_order?.komoditas} Grade {p.pre_order?.grade}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Jenis</p>
                              <p className="font-medium capitalize">
                                {p.jenis_pembayaran === 'deposit' ? 'Deposit 10%' : 'Bayar Full 100%'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Jumlah Dibayar</p>
                              <p className="font-bold text-tani-green">{formatRupiah(p.jumlah)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Total Nilai PO</p>
                              <p className="font-medium">{formatRupiah(p.total_nilai_po)}</p>
                            </div>
                            {p.metode_transfer && (
                              <div>
                                <p className="text-xs text-muted-foreground">Metode</p>
                                <p className="font-medium capitalize">
                                  {p.metode_transfer === 'bank' ? 'Transfer Bank' : 'QRIS'}
                                </p>
                              </div>
                            )}
                            <div>
                              <p className="text-xs text-muted-foreground">Tanggal</p>
                              <p className="font-medium">
                                {new Date(p.created_at).toLocaleDateString('id-ID', {
                                  day: 'numeric', month: 'short', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>

                          {p.catatan_supplier && (
                            <div className="bg-muted/50 rounded-lg p-3">
                              <p className="text-xs text-muted-foreground mb-0.5">Catatan Supplier:</p>
                              <p className="text-xs">{p.catatan_supplier}</p>
                            </div>
                          )}

                          {p.admin_catatan && (
                            <div className={`rounded-lg p-3 ${p.status === 'ditolak' ? 'bg-red-50' : p.status === 'refunded' ? 'bg-purple-50' : 'bg-green-50'}`}>
                              <p className="text-xs text-muted-foreground mb-0.5">Catatan Admin:</p>
                              <p className="text-xs">{p.admin_catatan}</p>
                            </div>
                          )}

                          {/* Refund info */}
                          {p.status === 'refunded' && (
                            <div className="bg-purple-50 rounded-lg p-3 flex items-start gap-2">
                              <RotateCcw className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs font-medium text-purple-800">
                                  Dana {formatRupiah(p.jumlah)} telah di-refund
                                </p>
                                {p.refund_catatan && (
                                  <p className="text-xs text-purple-700 mt-0.5">{p.refund_catatan}</p>
                                )}
                                {p.refunded_at && (
                                  <p className="text-[11px] text-muted-foreground mt-1">
                                    Refund diproses pada {new Date(p.refunded_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Bukti Transfer Preview */}
                          {p.bukti_transfer_url && (
                            <button
                              onClick={() => { setSelectedPayment(p); setImageDialogOpen(true) }}
                              className="w-full flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors text-left"
                            >
                              <ImageIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium">Bukti Transfer</p>
                                <p className="text-[11px] text-muted-foreground truncate">Klik untuk melihat</p>
                              </div>
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </button>
                          )}

                          {/* Actions */}
                          {p.status === 'menunggu_verifikasi' && (
                            <div className="flex gap-2">
                              <Button
                                className="flex-1 bg-tani-green hover:bg-tani-green/90 text-white"
                                onClick={() => { setSelectedPayment(p); setAdminCatatan(''); setDialogOpen(true) }}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Verifikasi
                              </Button>
                              <Button
                                variant="outline"
                                className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                                onClick={() => { setSelectedPayment(p); setAdminCatatan(''); setRejectDialogOpen(true) }}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Tolak
                              </Button>
                            </div>
                          )}

                          {/* Refund action for verified payments */}
                          {p.status === 'terverifikasi' && (
                            <Button
                              variant="outline"
                              className="w-full border-purple-300 text-purple-600 hover:bg-purple-50"
                              onClick={() => { setSelectedPayment(p); setAdminCatatan(''); setRefundDialogOpen(true) }}
                            >
                              <RotateCcw className="h-4 w-4 mr-1" />
                              Proses Refund
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </TabsContent>
            )
          })}
        </Tabs>
      </div>

      {/* Verify Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v: boolean) => setDialogOpen(v)}>
        <DialogContent className="max-w-[calc(100%-4rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verifikasi Pembayaran</DialogTitle>
            <DialogDescription>
              Pastikan bukti transfer valid dan nominal sesuai sebelum memverifikasi.
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-3">
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Jumlah</p>
                <p className="text-xl font-bold text-tani-green">{formatRupiah(selectedPayment.jumlah)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedPayment.jenis_pembayaran === 'deposit' ? 'Deposit 10%' : 'Full Payment'} - {selectedPayment.supplier?.nama_perusahaan}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Catatan Admin (opsional)</Label>
                <Textarea
                  placeholder="Catatan verifikasi..."
                  value={adminCatatan}
                  onChange={(e) => setAdminCatatan(e.target.value)}
                  rows={2}
                  className="text-sm"
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
              Batal
            </Button>
            <Button
              className="flex-1 bg-tani-green hover:bg-tani-green/90 text-white"
              onClick={handleVerify}
              disabled={processing}
            >
              {processing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
              Verifikasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={(v: boolean) => setRejectDialogOpen(v)}>
        <DialogContent className="max-w-[calc(100%-4rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tolak Pembayaran</DialogTitle>
            <DialogDescription>
              Berikan alasan penolakan agar supplier dapat mengirim ulang bukti yang benar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs">Alasan Penolakan *</Label>
              <Textarea
                placeholder="Contoh: Nominal tidak sesuai, bukti tidak jelas, rekening pengirim berbeda..."
                value={adminCatatan}
                onChange={(e) => setAdminCatatan(e.target.value)}
                rows={3}
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)} className="flex-1">
              Batal
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleReject}
              disabled={processing || !adminCatatan.trim()}
            >
              {processing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <XCircle className="h-4 w-4 mr-1" />}
              Tolak Pembayaran
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={(v: boolean) => setImageDialogOpen(v)}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Bukti Transfer</DialogTitle>
          </DialogHeader>
          {selectedPayment?.bukti_transfer_url && (
            <div className="flex flex-col items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/platform-assets/${selectedPayment.bukti_transfer_url}`}
                alt="Bukti Transfer"
                className="max-h-[60vh] w-full object-contain rounded-lg"
              />
              <div className="text-center text-sm">
                <p className="font-semibold">{selectedPayment.supplier?.nama_perusahaan}</p>
                <p className="text-muted-foreground">
                  {selectedPayment.jenis_pembayaran === 'deposit' ? 'Deposit 10%' : 'Full'} - {formatRupiah(selectedPayment.jumlah)}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageDialogOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={refundDialogOpen} onOpenChange={(v: boolean) => setRefundDialogOpen(v)}>
        <DialogContent className="max-w-[calc(100%-4rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-purple-600" />
              Proses Refund
            </DialogTitle>
            <DialogDescription>
              Dana akan dikembalikan ke supplier. Saldo escrow supplier akan dikurangi.
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-3">
              <div className="bg-purple-50 rounded-lg p-4 text-center space-y-1">
                <p className="text-xs text-muted-foreground">Jumlah Refund</p>
                <p className="text-2xl font-bold text-purple-700">{formatRupiah(selectedPayment.jumlah)}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedPayment.jenis_pembayaran === 'deposit' ? 'Deposit 10%' : 'Full Payment'} - {selectedPayment.supplier?.nama_perusahaan}
                </p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800">
                  <p className="font-medium">Perhatian:</p>
                  <ul className="mt-1 space-y-0.5 list-disc list-inside">
                    <li>Saldo escrow supplier akan dikurangi {formatRupiah(selectedPayment.jumlah)}</li>
                    <li>Pre-order terkait akan di-reset deposit-nya</li>
                    <li>Supplier akan mendapat notifikasi</li>
                    <li>Pastikan dana sudah ditransfer balik ke supplier</li>
                  </ul>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Catatan Refund (opsional)</Label>
                <Textarea
                  placeholder="Contoh: Pre-order dibatalkan atas permintaan supplier, dana dikembalikan via transfer BCA..."
                  value={adminCatatan}
                  onChange={(e) => setAdminCatatan(e.target.value)}
                  rows={2}
                  className="text-sm"
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setRefundDialogOpen(false)} className="flex-1">
              Batal
            </Button>
            <Button
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              onClick={handleRefund}
              disabled={processing}
            >
              {processing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-1" />}
              Konfirmasi Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
