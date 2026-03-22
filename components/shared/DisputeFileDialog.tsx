'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store'

interface DisputeFileDialogProps {
  transaksiId: string
  open: boolean
  onOpenChange: (v: boolean) => void
}

const DISPUTE_CATEGORIES = [
  { value: 'kualitas', label: 'Kualitas Produk' },
  { value: 'keterlambatan', label: 'Keterlambatan Pengiriman' },
  { value: 'volume', label: 'Volume Tidak Sesuai' },
  { value: 'pembayaran', label: 'Masalah Pembayaran' },
  { value: 'pembatalan', label: 'Pembatalan Sepihak' },
]

export function DisputeFileDialog({ transaksiId, open, onOpenChange }: DisputeFileDialogProps) {
  const user = useAuthStore((s) => s.user)
  const [kategori, setKategori] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = kategori !== '' && deskripsi.trim() !== '' && !submitting

  async function handleSubmit() {
    if (!user) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/dispute/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaksi_id: transaksiId,
          pelapor_id: user.id,
          kategori,
          deskripsi,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Gagal mengajukan sengketa')
      }

      const data = await res.json()
      toast.success(`Sengketa berhasil diajukan. SLA: ${new Date(data.sla_deadline).toLocaleDateString('id-ID')}`)
      setKategori('')
      setDeskripsi('')
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajukan Sengketa</DialogTitle>
          <DialogDescription>
            Ajukan sengketa untuk transaksi {transaksiId}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Kategori */}
          <div className="space-y-2">
            <Label htmlFor="kategori">Kategori Sengketa</Label>
            <Select value={kategori} onValueChange={(v) => setKategori(v ?? '')}>
              <SelectTrigger id="kategori">
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {DISPUTE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Deskripsi */}
          <div className="space-y-2">
            <Label htmlFor="deskripsi">Deskripsi</Label>
            <Textarea
              id="deskripsi"
              placeholder="Jelaskan detail permasalahan..."
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              rows={4}
            />
          </div>

          {/* Bukti (placeholder) */}
          <div className="space-y-2">
            <Label>Bukti Pendukung</Label>
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-6 text-gray-400">
              <Upload size={24} />
              <span className="text-sm">Upload foto/dokumen bukti</span>
              <span className="text-xs">(Fitur segera hadir)</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button disabled={!canSubmit} onClick={handleSubmit}>
            {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Kirim Sengketa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
