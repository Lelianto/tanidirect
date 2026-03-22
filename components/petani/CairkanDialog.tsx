'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { formatRupiah } from '@/lib/utils/currency'
import type { RekeningInfo } from '@/types'
import { toast } from 'sonner'
import { useAuthStore } from '@/store'
import {
  Wallet, Building2, Smartphone, CheckCircle, ArrowRight,
  ArrowLeft, AlertCircle, Pencil, Shield, Loader2,
} from 'lucide-react'

const BANK_OPTIONS = ['BRI', 'BCA', 'BNI', 'Mandiri', 'BSI'] as const
const EWALLET_OPTIONS = ['GoPay', 'OVO', 'DANA', 'ShopeePay', 'LinkAja'] as const
const BIAYA_ADMIN = 2500

interface CairkanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  saldoPending: number
  savedRekening?: RekeningInfo
}

type Step = 'rekening' | 'konfirmasi' | 'sukses'

export function CairkanDialog({ open, onOpenChange, saldoPending, savedRekening }: CairkanDialogProps) {
  const user = useAuthStore((s) => s.user)
  const [step, setStep] = useState<Step>(savedRekening ? 'konfirmasi' : 'rekening')
  const [submitting, setSubmitting] = useState(false)
  const [metode, setMetode] = useState<'bank' | 'ewallet'>(savedRekening?.metode || 'bank')
  const [provider, setProvider] = useState(savedRekening?.provider || '')
  const [nomor, setNomor] = useState(savedRekening?.nomor || '')
  const [atasNama, setAtasNama] = useState(savedRekening?.atas_nama || '')
  const [isEditing, setIsEditing] = useState(!savedRekening)

  const jumlahDiterima = saldoPending - BIAYA_ADMIN
  const isRekeningValid = provider && nomor && atasNama

  function handleClose() {
    onOpenChange(false)
    // Reset after animation
    setTimeout(() => {
      setStep(savedRekening ? 'konfirmasi' : 'rekening')
      setIsEditing(!savedRekening)
    }, 200)
  }

  async function handleSubmit() {
    if (!user) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/petani/cairkan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petani_id: user.id,
          jumlah: saldoPending,
          rekening: { metode, provider, nomor, atas_nama: atasNama },
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Gagal memproses pencairan')
      }

      setStep('sukses')
      toast.success('Pencairan berhasil diproses!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => { if (!v) handleClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-tani-green" />
            {step === 'rekening' && 'Rekening Pencairan'}
            {step === 'konfirmasi' && 'Konfirmasi Pencairan'}
            {step === 'sukses' && 'Pencairan Berhasil'}
          </DialogTitle>
          <DialogDescription>
            {step === 'rekening' && 'Masukkan rekening atau e-wallet tujuan pencairan'}
            {step === 'konfirmasi' && 'Periksa detail pencairan Anda sebelum melanjutkan'}
            {step === 'sukses' && 'Dana sedang diproses ke rekening Anda'}
          </DialogDescription>
        </DialogHeader>

        {/* ===== STEP: REKENING ===== */}
        {step === 'rekening' && (
          <div className="space-y-4">
            {/* Metode toggle */}
            <div className="space-y-2">
              <Label>Metode Pencairan</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setMetode('bank'); setProvider('') }}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                    metode === 'bank'
                      ? 'border-tani-green bg-tani-green/5 text-tani-green'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  Transfer Bank
                </button>
                <button
                  type="button"
                  onClick={() => { setMetode('ewallet'); setProvider('') }}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                    metode === 'ewallet'
                      ? 'border-tani-green bg-tani-green/5 text-tani-green'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <Smartphone className="h-4 w-4" />
                  E-Wallet
                </button>
              </div>
            </div>

            {/* Provider */}
            <div className="space-y-2">
              <Label>{metode === 'bank' ? 'Bank' : 'E-Wallet'}</Label>
              <div className="flex flex-wrap gap-2">
                {(metode === 'bank' ? BANK_OPTIONS : EWALLET_OPTIONS).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setProvider(opt)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      provider === opt
                        ? 'border-tani-green bg-tani-green text-white'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Nomor */}
            <div className="space-y-2">
              <Label>{metode === 'bank' ? 'Nomor Rekening' : 'Nomor HP (terdaftar)'}</Label>
              <Input
                placeholder={metode === 'bank' ? 'Contoh: 0012-01-012345-56-7' : 'Contoh: 081234567890'}
                value={nomor}
                onChange={(e) => setNomor(e.target.value)}
                className="text-base"
              />
            </div>

            {/* Atas Nama */}
            <div className="space-y-2">
              <Label>Atas Nama</Label>
              <Input
                placeholder="Nama sesuai rekening/akun"
                value={atasNama}
                onChange={(e) => setAtasNama(e.target.value)}
                className="text-base"
              />
            </div>
          </div>
        )}

        {/* ===== STEP: KONFIRMASI ===== */}
        {step === 'konfirmasi' && (
          <div className="space-y-4">
            {/* Rekening summary */}
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {metode === 'bank' ? (
                        <Building2 className="h-4 w-4 text-tani-blue" />
                      ) : (
                        <Smartphone className="h-4 w-4 text-tani-blue" />
                      )}
                      <span className="text-sm font-semibold">{provider}</span>
                    </div>
                    <p className="text-sm font-mono text-muted-foreground">{nomor}</p>
                    <p className="text-xs text-muted-foreground">a.n. {atasNama}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-tani-green"
                    onClick={() => { setStep('rekening'); setIsEditing(true) }}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Ubah
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Rincian */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Saldo yang dicairkan</span>
                <span className="font-semibold">{formatRupiah(saldoPending)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Biaya admin</span>
                <span className="text-tani-red">-{formatRupiah(BIAYA_ADMIN)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Jumlah diterima</span>
                <span className="text-lg font-bold text-tani-green">{formatRupiah(jumlahDiterima)}</span>
              </div>
            </div>

            {/* Estimasi */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Estimasi waktu pencairan</p>
                <p>{metode === 'bank' ? '1x24 jam kerja' : 'Instan (maks. 15 menit)'}</p>
              </div>
            </div>
          </div>
        )}

        {/* ===== STEP: SUKSES ===== */}
        {step === 'sukses' && (
          <div className="text-center py-4 space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-tani-green/10">
              <CheckCircle className="h-8 w-8 text-tani-green" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold font-[family-name:var(--font-heading)]">
                Pencairan Diproses!
              </p>
              <p className="text-2xl font-bold text-tani-green">
                {formatRupiah(jumlahDiterima)}
              </p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-left text-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tujuan</span>
                <span className="font-medium">{provider} — {nomor}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Atas Nama</span>
                <span className="font-medium">{atasNama}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Estimasi</span>
                <span className="font-medium">{metode === 'bank' ? '1x24 jam kerja' : 'Maks. 15 menit'}</span>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl text-xs text-amber-700">
              <Shield className="h-4 w-4 shrink-0 mt-0.5" />
              <p>Anda akan menerima notifikasi WhatsApp saat dana berhasil masuk ke rekening.</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <DialogFooter>
          {step === 'rekening' && (
            <>
              <Button variant="outline" onClick={handleClose}>Batal</Button>
              <Button
                className="bg-tani-green hover:bg-tani-green/90 text-white"
                disabled={!isRekeningValid}
                onClick={() => setStep('konfirmasi')}
              >
                Lanjut
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </>
          )}
          {step === 'konfirmasi' && (
            <>
              <Button variant="outline" onClick={() => setStep('rekening')}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Kembali
              </Button>
              <Button
                className="bg-tani-green hover:bg-tani-green/90 text-white"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Cairkan {formatRupiah(jumlahDiterima)}
              </Button>
            </>
          )}
          {step === 'sukses' && (
            <Button className="w-full bg-tani-green hover:bg-tani-green/90 text-white" onClick={handleClose}>
              Selesai
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
