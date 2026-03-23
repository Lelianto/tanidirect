'use client'

import { useState, useEffect, useRef } from 'react'
import { TopBar } from '@/components/shared/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store'
import { toast } from 'sonner'
import { Landmark, QrCode, Upload, Loader2, CheckCircle2, ImageIcon } from 'lucide-react'

interface RekeningEscrow {
  bank: string
  nomor: string
  atas_nama: string
}

interface QRISConfig {
  image_path: string
  merchant_name: string
}

export default function AdminSettingsPage() {
  const adminUser = useAuthStore((s) => s.user)

  const [rekening, setRekening] = useState<RekeningEscrow>({ bank: '', nomor: '', atas_nama: '' })
  const [qris, setQris] = useState<QRISConfig>({ image_path: '', merchant_name: '' })
  const [qrisPreview, setQrisPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingRekening, setSavingRekening] = useState(false)
  const [uploadingQris, setUploadingQris] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchConfig()
  }, [])

  async function fetchConfig() {
    try {
      const res = await fetch('/api/admin/settings')
      if (!res.ok) throw new Error('Gagal memuat konfigurasi')
      const data = await res.json()
      if (data.rekening_escrow) setRekening(data.rekening_escrow)
      if (data.qris) setQris(data.qris)
    } catch {
      toast.error('Gagal memuat konfigurasi')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveRekening() {
    if (!rekening.bank || !rekening.nomor || !rekening.atas_nama) {
      toast.error('Semua field rekening wajib diisi')
      return
    }

    setSavingRekening(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'rekening_escrow',
          value: rekening,
          adminId: adminUser?.id,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('Rekening escrow berhasil disimpan')
    } catch {
      toast.error('Gagal menyimpan rekening')
    } finally {
      setSavingRekening(false)
    }
  }

  async function handleUploadQris(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview
    const reader = new FileReader()
    reader.onload = (ev) => setQrisPreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    setUploadingQris(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (adminUser?.id) formData.append('admin_id', adminUser.id)

      const res = await fetch('/api/admin/settings/qris-upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Upload gagal')
      }

      const data = await res.json()
      setQris({ ...qris, image_path: data.filePath })
      toast.success('QRIS berhasil diupload')
    } catch (err: any) {
      toast.error(err.message || 'Gagal upload QRIS')
      setQrisPreview(null)
    } finally {
      setUploadingQris(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <TopBar title="Pengaturan Platform" />

      <div className="p-4 lg:p-6 space-y-6 max-w-3xl">
        {/* Rekening Escrow */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-tani-green/10">
                <Landmark className="h-4 w-4 text-tani-green" />
              </div>
              Rekening Escrow Taninesia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Rekening ini digunakan untuk menerima pembayaran escrow dari supplier sebelum dana dicairkan ke poktan/petani.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="bank">Nama Bank</Label>
                <Input
                  id="bank"
                  placeholder="BCA, BRI, Mandiri, dll"
                  value={rekening.bank}
                  onChange={(e) => setRekening({ ...rekening, bank: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nomor">Nomor Rekening</Label>
                <Input
                  id="nomor"
                  placeholder="1234567890"
                  value={rekening.nomor}
                  onChange={(e) => setRekening({ ...rekening, nomor: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="atas_nama">Atas Nama</Label>
                <Input
                  id="atas_nama"
                  placeholder="PT Taninesia Digital"
                  value={rekening.atas_nama}
                  onChange={(e) => setRekening({ ...rekening, atas_nama: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveRekening} disabled={savingRekening}>
                {savingRekening ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Simpan Rekening
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* QRIS Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-tani-green/10">
                <QrCode className="h-4 w-4 text-tani-green" />
              </div>
              QRIS Statis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload gambar QRIS statis untuk pembayaran. Gambar ini akan ditampilkan ke supplier saat checkout.
            </p>

            {/* Preview */}
            {(qrisPreview || qris.image_path) && (
              <div className="flex justify-center p-4 bg-gray-50 rounded-xl border border-dashed border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrisPreview || ''}
                  alt="QRIS Preview"
                  className="max-w-[240px] rounded-lg"
                />
              </div>
            )}

            {!qrisPreview && !qris.image_path && (
              <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-xl border border-dashed border-border text-muted-foreground">
                <ImageIcon className="h-10 w-10 mb-2" />
                <p className="text-sm">Belum ada QRIS yang diupload</p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleUploadQris}
            />

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingQris}
              >
                {uploadingQris ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {qris.image_path ? 'Ganti QRIS' : 'Upload QRIS'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
