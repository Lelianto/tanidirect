'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TopBar } from '@/components/shared/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatRupiah } from '@/lib/utils/currency'
import { toast } from 'sonner'
import {
  ArrowLeft, Wallet, Upload, Loader2, CheckCircle,
  Building2, QrCode, Copy, ImageIcon, AlertCircle, XCircle,
} from 'lucide-react'
import Link from 'next/link'
import type { PembayaranEscrow } from '@/types'

export default function PembayaranDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [pembayaran, setPembayaran] = useState<PembayaranEscrow | null>(null)
  const [rekeningEscrow, setRekeningEscrow] = useState<{ bank: string; nomor: string; atas_nama: string } | null>(null)
  const [qrisConfig, setQrisConfig] = useState<{ image_path: string; merchant_name: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [metode, setMetode] = useState<'bank' | 'qris'>('bank')
  const [catatan, setCatatan] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    async function fetchData() {
      try {
        // Fetch pembayaran detail and platform settings in parallel
        const [payRes, settingsRes] = await Promise.all([
          fetch(`/api/supplier/pembayaran/${id}`),
          fetch('/api/admin/settings'),
        ])

        if (payRes.ok) {
          const payData = await payRes.json()
          if (payData.success && payData.pembayaran) {
            setPembayaran(payData.pembayaran)
          }
        }

        if (settingsRes.ok) {
          const settingsData = await settingsRes.json()
          if (settingsData.rekening_escrow) setRekeningEscrow(settingsData.rekening_escrow)
          if (settingsData.qris) setQrisConfig(settingsData.qris)
        }
      } catch {
        toast.error('Gagal memuat data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimum 5MB')
      return
    }
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function handleSubmit() {
    if (!file || !pembayaran) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('pembayaran_id', pembayaran.id)
      formData.append('metode_transfer', metode)
      if (catatan.trim()) formData.append('catatan_supplier', catatan)

      const res = await fetch('/api/supplier/pembayaran/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Gagal mengirim bukti')
      }

      toast.success('Bukti pembayaran berhasil dikirim! Menunggu verifikasi admin.')
      router.push('/supplier/pembayaran')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mengirim bukti')
    } finally {
      setUploading(false)
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    toast.success('Disalin ke clipboard')
  }

  if (loading) {
    return (
      <>
        <TopBar title="Pembayaran" />
        <div className="p-4 flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    )
  }

  if (!pembayaran) {
    return (
      <>
        <TopBar title="Pembayaran" />
        <div className="p-4 flex flex-col items-center justify-center py-20">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">Pembayaran tidak ditemukan</p>
          <Link href="/supplier/pembayaran">
            <Button variant="outline" className="mt-4">Kembali</Button>
          </Link>
        </div>
      </>
    )
  }

  // If already verified, show success state
  if (pembayaran.status === 'terverifikasi') {
    return (
      <>
        <TopBar title="Pembayaran Escrow" />
        <div className="p-4 lg:p-6 space-y-4 max-w-lg mx-auto">
          <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 text-muted-foreground" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
          <Card className="shadow-sm border-green-200 bg-green-50/50">
            <CardContent className="p-6 text-center space-y-3">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
              <h3 className="font-semibold text-lg text-green-800">Pembayaran Terverifikasi</h3>
              <p className="text-sm text-green-700">
                {pembayaran.jenis_pembayaran === 'deposit' ? 'Deposit 10%' : 'Pembayaran Full'} sebesar {formatRupiah(pembayaran.jumlah)} telah diverifikasi.
              </p>
              {pembayaran.verified_at && (
                <p className="text-xs text-muted-foreground">
                  Diverifikasi pada {new Date(pembayaran.verified_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  // If waiting for verification
  if (pembayaran.status === 'menunggu_verifikasi') {
    return (
      <>
        <TopBar title="Pembayaran Escrow" />
        <div className="p-4 lg:p-6 space-y-4 max-w-lg mx-auto">
          <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 text-muted-foreground" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
          <Card className="shadow-sm border-blue-200 bg-blue-50/50">
            <CardContent className="p-6 text-center space-y-3">
              <Loader2 className="h-12 w-12 text-blue-600 mx-auto animate-spin" />
              <h3 className="font-semibold text-lg text-blue-800">Menunggu Verifikasi</h3>
              <p className="text-sm text-blue-700">
                Bukti pembayaran {formatRupiah(pembayaran.jumlah)} telah dikirim dan sedang menunggu verifikasi admin.
              </p>
              <p className="text-xs text-muted-foreground">
                Anda akan mendapat notifikasi setelah pembayaran diverifikasi.
              </p>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  // Show rejection info if ditolak
  const isRejected = pembayaran.status === 'ditolak'

  return (
    <>
      <TopBar title="Pembayaran Escrow" />
      <div className="p-4 lg:p-6 space-y-4 max-w-lg mx-auto">
        <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 text-muted-foreground" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Button>

        {/* Rejection notice */}
        {isRejected && pembayaran.admin_catatan && (
          <Card className="shadow-sm border-red-200 bg-red-50/50">
            <CardContent className="p-4 flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Pembayaran Sebelumnya Ditolak</p>
                <p className="text-xs text-red-700 mt-1">Alasan: {pembayaran.admin_catatan}</p>
                <p className="text-xs text-muted-foreground mt-1">Silakan upload ulang bukti transfer yang benar.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Amount */}
        <Card className="shadow-sm border-tani-green/30 bg-tani-green/5">
          <CardContent className="p-4 text-center space-y-2">
            <p className="text-sm text-muted-foreground">Jumlah yang harus dibayar</p>
            <p className="text-3xl font-bold text-tani-green">{formatRupiah(pembayaran.jumlah)}</p>
            <Badge className="bg-tani-green/10 text-tani-green text-xs">
              {pembayaran.jenis_pembayaran === 'deposit' ? 'Deposit 10%' : 'Pembayaran Full'} dari {formatRupiah(pembayaran.total_nilai_po)}
            </Badge>
            {pembayaran.pre_order && (
              <p className="text-xs text-muted-foreground">
                {pembayaran.pre_order.komoditas} Grade {pembayaran.pre_order.grade}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Payment Method Selection */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pilih Metode Pembayaran</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMetode('bank')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  metode === 'bank'
                    ? 'border-tani-green bg-tani-green/5'
                    : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                <Building2 className={`h-6 w-6 ${metode === 'bank' ? 'text-tani-green' : 'text-muted-foreground'}`} />
                <span className={`text-xs font-medium ${metode === 'bank' ? 'text-tani-green' : 'text-muted-foreground'}`}>
                  Transfer Bank
                </span>
              </button>
              <button
                onClick={() => setMetode('qris')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  metode === 'qris'
                    ? 'border-tani-green bg-tani-green/5'
                    : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                <QrCode className={`h-6 w-6 ${metode === 'qris' ? 'text-tani-green' : 'text-muted-foreground'}`} />
                <span className={`text-xs font-medium ${metode === 'qris' ? 'text-tani-green' : 'text-muted-foreground'}`}>
                  QRIS
                </span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Bank Transfer Info */}
        {metode === 'bank' && rekeningEscrow && (
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4 text-tani-green" />
                Rekening Tujuan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Bank</p>
                  <p className="font-semibold text-sm">{rekeningEscrow.bank || '-'}</p>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Nomor Rekening</p>
                    <p className="font-semibold text-lg font-mono tracking-wider">{rekeningEscrow.nomor || '-'}</p>
                  </div>
                  {rekeningEscrow.nomor && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(rekeningEscrow.nomor)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground">Atas Nama</p>
                  <p className="font-semibold text-sm">{rekeningEscrow.atas_nama || '-'}</p>
                </div>
              </div>
              <div className="bg-amber-50 rounded-lg p-3">
                <p className="text-xs text-amber-800">
                  Pastikan transfer sesuai nominal {formatRupiah(pembayaran.jumlah)}.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* QRIS Info */}
        {metode === 'qris' && (
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <QrCode className="h-4 w-4 text-tani-green" />
                QRIS Pembayaran
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {qrisConfig?.image_path ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="bg-white border-2 border-border rounded-xl p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/platform-assets/${qrisConfig.image_path}`}
                      alt="QRIS"
                      className="w-56 h-56 object-contain"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Merchant: <span className="font-medium">{qrisConfig.merchant_name || 'Taninesia'}</span>
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center py-6 text-muted-foreground">
                  <QrCode className="h-10 w-10 mb-2 opacity-40" />
                  <p className="text-sm">QRIS belum tersedia</p>
                  <p className="text-xs">Silakan gunakan transfer bank</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Upload Bukti Transfer */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Upload className="h-4 w-4 text-tani-green" />
              Upload Bukti Pembayaran
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Bukti Transfer / Screenshot</Label>
              <div
                className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-tani-green/50 transition-colors"
                onClick={() => document.getElementById('bukti-input')?.click()}
              >
                {preview ? (
                  <div className="space-y-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                    <p className="text-xs text-muted-foreground">{file?.name}</p>
                    <p className="text-xs text-tani-green font-medium">Klik untuk ganti</p>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">Klik untuk upload bukti transfer</p>
                    <p className="text-xs text-muted-foreground">JPG, PNG, WebP (maks. 5MB)</p>
                  </>
                )}
              </div>
              <input
                id="bukti-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Catatan (opsional)</Label>
              <Textarea
                placeholder="Contoh: Transfer dari rekening BCA a/n PT..."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                rows={2}
                className="text-sm"
              />
            </div>

            <Button
              className="w-full bg-tani-green hover:bg-tani-green/90 text-white h-12 font-semibold"
              disabled={!file || uploading}
              onClick={handleSubmit}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Kirim Bukti Pembayaran
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
