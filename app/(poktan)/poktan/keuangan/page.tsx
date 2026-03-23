'use client'

import { useState, useEffect, useCallback } from 'react'
import { TopBar } from '@/components/shared/TopBar'
import { StatCard } from '@/components/shared/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useAuthStore } from '@/store'
import { formatRupiah } from '@/lib/utils/currency'
import { toast } from 'sonner'
import {
  Wallet, ClipboardCheck, ArrowDownToLine, Loader2,
  CheckCircle, Clock, XCircle, Banknote,
} from 'lucide-react'

const BIAYA_ADMIN = 2500
const BANK_OPTIONS = ['BRI', 'BCA', 'BNI', 'Mandiri', 'BSI']
const EWALLET_OPTIONS = ['GoPay', 'OVO', 'DANA', 'ShopeePay', 'LinkAja']

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  diproses: { label: 'Diproses', color: 'bg-amber-100 text-amber-800', icon: <Clock className="h-3 w-3" /> },
  berhasil: { label: 'Berhasil', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3" /> },
  gagal: { label: 'Gagal', color: 'bg-red-100 text-red-800', icon: <XCircle className="h-3 w-3" /> },
}

export default function PoktanKeuanganPage() {
  const user = useAuthStore((s) => s.user)
  const [poktanId, setPoktanId] = useState<string | null>(null)
  const [saldo, setSaldo] = useState(0)
  const [totalFee, setTotalFee] = useState(0)
  const [pencairanList, setPencairanList] = useState<any[]>([])
  const [qaList, setQaList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Withdrawal dialog
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [form, setForm] = useState({
    jumlah: '',
    metode: 'bank' as 'bank' | 'ewallet',
    provider: '',
    nomor: '',
    atas_nama: '',
  })

  // Resolve poktan_id from user
  useEffect(() => {
    if (!user?.id) return
    fetch(`/api/poktan/dashboard?user_id=${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.poktan?.id) {
          setPoktanId(data.poktan.id)
        }
      })
      .catch(() => {})
  }, [user?.id])

  const fetchData = useCallback(async () => {
    if (!poktanId) return
    setLoading(true)
    try {
      const [cairRes, qaRes] = await Promise.all([
        fetch(`/api/poktan/cairkan?poktan_id=${poktanId}`),
        fetch(`/api/poktan/qa?poktan_id=${poktanId}`),
      ])
      if (cairRes.ok) {
        const data = await cairRes.json()
        setPencairanList(data.pencairan || [])
        setSaldo(data.saldo || 0)
        setTotalFee(data.total_fee || 0)
      }
      if (qaRes.ok) {
        const data = await qaRes.json()
        setQaList(data.inspeksi || [])
      }
    } catch {
      // fallback
    } finally {
      setLoading(false)
    }
  }, [poktanId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function openDialog() {
    setStep(1)
    setForm({ jumlah: '', metode: 'bank', provider: '', nomor: '', atas_nama: '' })
    setDialogOpen(true)
  }

  async function handleSubmit() {
    if (!poktanId) return
    setProcessing(true)
    try {
      const res = await fetch('/api/poktan/cairkan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poktan_id: poktanId,
          jumlah: Number(form.jumlah),
          rekening: {
            metode: form.metode,
            provider: form.provider,
            nomor: form.nomor,
            atas_nama: form.atas_nama,
          },
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Gagal mengajukan pencairan')
      }
      setStep(3)
      fetchData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mengajukan pencairan')
    } finally {
      setProcessing(false)
    }
  }

  const jumlahNum = Number(form.jumlah) || 0
  const jumlahDiterima = jumlahNum > BIAYA_ADMIN ? jumlahNum - BIAYA_ADMIN : 0
  const providerOptions = form.metode === 'bank' ? BANK_OPTIONS : EWALLET_OPTIONS

  const totalCaired = pencairanList
    .filter((p: any) => p.status === 'berhasil')
    .reduce((sum: number, p: any) => sum + Number(p.jumlah_diterima), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar title="Keuangan Poktan" />
      <div className="p-4 lg:p-6 space-y-4 max-w-3xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            title="Saldo Fee QA"
            value={formatRupiah(saldo)}
            icon={<Wallet className="h-5 w-5" />}
          />
          <StatCard
            title="Total Fee Diperoleh"
            value={formatRupiah(totalFee)}
            icon={<ClipboardCheck className="h-5 w-5" />}
          />
        </div>

        {/* Cairkan Button */}
        <Button
          className="w-full bg-tani-green hover:bg-tani-green/90 text-white h-12 text-base font-semibold"
          disabled={saldo <= BIAYA_ADMIN}
          onClick={openDialog}
        >
          <ArrowDownToLine className="h-5 w-5 mr-2" />
          Cairkan Fee QA
        </Button>
        {saldo <= BIAYA_ADMIN && saldo > 0 && (
          <p className="text-xs text-muted-foreground text-center -mt-2">
            Saldo minimum pencairan: Rp {(BIAYA_ADMIN + 1).toLocaleString('id-ID')}
          </p>
        )}

        {/* Riwayat QA Fee */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Riwayat Fee QA</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : qaList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Belum ada inspeksi QA</p>
            ) : (
              <div className="space-y-3">
                {qaList.slice(0, 10).map((qa: any) => (
                  <div key={qa.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{qa.komoditas}</p>
                      <p className="text-xs text-muted-foreground">
                        {qa.volume_inspeksi_kg ? `${qa.volume_inspeksi_kg} kg` : '-'} -
                        {new Date(qa.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-tani-green">
                      +{formatRupiah(qa.fee_dibayar || 0)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Riwayat Pencairan */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Riwayat Pencairan</CardTitle>
          </CardHeader>
          <CardContent>
            {pencairanList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Belum ada pencairan</p>
            ) : (
              <div className="space-y-3">
                {pencairanList.map((p: any) => {
                  const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.diproses
                  return (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div>
                        <p className="text-sm font-medium">
                          Pencairan {formatRupiah(p.jumlah_diterima)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(p.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </p>
                      </div>
                      <Badge className={`${cfg.color} text-[10px] px-2 py-0.5 gap-1`}>
                        {cfg.icon}
                        {cfg.label}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal Dialog — 3-step */}
      <Dialog open={dialogOpen} onOpenChange={(v: boolean) => { if (!processing) setDialogOpen(v) }}>
        <DialogContent className="max-w-[calc(100%-4rem)] sm:max-w-md">
          {step === 1 && (
            <>
              <DialogHeader>
                <DialogTitle>Cairkan Fee QA</DialogTitle>
                <DialogDescription>
                  Masukkan jumlah dan informasi rekening tujuan pencairan.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="bg-tani-green/10 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Saldo Tersedia</p>
                  <p className="text-xl font-bold text-tani-green">{formatRupiah(saldo)}</p>
                </div>

                <div className="space-y-2">
                  <Label>Jumlah Pencairan (Rp)</Label>
                  <Input
                    type="number"
                    placeholder="100000"
                    value={form.jumlah}
                    onChange={(e) => setForm((f) => ({ ...f, jumlah: e.target.value }))}
                  />
                  {jumlahNum > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Biaya admin: Rp {BIAYA_ADMIN.toLocaleString('id-ID')} | Diterima: {formatRupiah(jumlahDiterima)}
                    </p>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Metode</Label>
                  <Select value={form.metode} onValueChange={(v: string | null) => setForm((f) => ({ ...f, metode: (v as 'bank' | 'ewallet') || 'bank', provider: '' }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank">Transfer Bank</SelectItem>
                      <SelectItem value="ewallet">E-Wallet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{form.metode === 'bank' ? 'Bank' : 'E-Wallet'}</Label>
                  <Select value={form.provider} onValueChange={(v: string | null) => setForm((f) => ({ ...f, provider: v || '' }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {providerOptions.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{form.metode === 'bank' ? 'No. Rekening' : 'No. HP'}</Label>
                  <Input
                    placeholder={form.metode === 'bank' ? '1234567890' : '08123456789'}
                    value={form.nomor}
                    onChange={(e) => setForm((f) => ({ ...f, nomor: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Atas Nama</Label>
                  <Input
                    placeholder="Nama pemilik rekening"
                    value={form.atas_nama}
                    onChange={(e) => setForm((f) => ({ ...f, atas_nama: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  className="w-full bg-tani-green hover:bg-tani-green/90 text-white"
                  disabled={
                    !form.jumlah || !form.provider || !form.nomor || !form.atas_nama ||
                    jumlahNum <= BIAYA_ADMIN || jumlahNum > saldo
                  }
                  onClick={() => setStep(2)}
                >
                  Lanjut Konfirmasi
                </Button>
              </DialogFooter>
            </>
          )}

          {step === 2 && (
            <>
              <DialogHeader>
                <DialogTitle>Konfirmasi Pencairan</DialogTitle>
                <DialogDescription>
                  Pastikan data berikut sudah benar sebelum melanjutkan.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="bg-tani-green/10 rounded-lg p-4 text-center">
                  <p className="text-xs text-muted-foreground">Jumlah Diterima</p>
                  <p className="text-2xl font-bold text-tani-green">{formatRupiah(jumlahDiterima)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Jumlah: {formatRupiah(jumlahNum)} - Admin: Rp {BIAYA_ADMIN.toLocaleString('id-ID')}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <span className="text-muted-foreground">Metode</span>
                  <span className="font-medium capitalize">{form.metode === 'bank' ? 'Transfer Bank' : 'E-Wallet'}</span>
                  <span className="text-muted-foreground">Provider</span>
                  <span className="font-medium">{form.provider}</span>
                  <span className="text-muted-foreground">{form.metode === 'bank' ? 'No. Rekening' : 'No. HP'}</span>
                  <span className="font-medium">{form.nomor}</span>
                  <span className="text-muted-foreground">Atas Nama</span>
                  <span className="font-medium">{form.atas_nama}</span>
                </div>
              </div>
              <DialogFooter className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Kembali
                </Button>
                <Button
                  className="flex-1 bg-tani-green hover:bg-tani-green/90 text-white"
                  onClick={handleSubmit}
                  disabled={processing}
                >
                  {processing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Banknote className="h-4 w-4 mr-1" />}
                  Ajukan Pencairan
                </Button>
              </DialogFooter>
            </>
          )}

          {step === 3 && (
            <>
              <DialogHeader>
                <DialogTitle className="text-center">Pencairan Berhasil Diajukan</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center py-6 space-y-3">
                <div className="h-16 w-16 rounded-full bg-tani-green/10 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-tani-green" />
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  Pencairan {formatRupiah(jumlahDiterima)} ke {form.provider} ({form.nomor}) sedang diproses admin.
                </p>
              </div>
              <DialogFooter>
                <Button className="w-full" onClick={() => setDialogOpen(false)}>
                  Tutup
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
