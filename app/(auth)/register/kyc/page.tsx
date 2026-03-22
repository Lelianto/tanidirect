'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Leaf, Upload, Camera, X, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthStore } from '@/store'
import { toast } from 'sonner'
import Image from 'next/image'

interface DocUpload {
  file: File | null
  preview: string
}

export default function KYCUploadPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const [ktp, setKtp] = useState<DocUpload>({ file: null, preview: '' })
  const [selfie, setSelfie] = useState<DocUpload>({ file: null, preview: '' })
  const [uploading, setUploading] = useState(false)
  const ktpInputRef = useRef<HTMLInputElement>(null)
  const selfieInputRef = useRef<HTMLInputElement>(null)

  function handleFileSelect(
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: DocUpload) => void
  ) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimum 5MB')
      return
    }

    const preview = URL.createObjectURL(file)
    setter({ file, preview })
  }

  function removeFile(setter: (val: DocUpload) => void, currentPreview: string) {
    if (currentPreview) URL.revokeObjectURL(currentPreview)
    setter({ file: null, preview: '' })
  }

  async function handleSubmit() {
    if (!ktp.file || !selfie.file || !user) return

    setUploading(true)
    try {
      // Upload both docs in parallel
      const uploads = [
        { file: ktp.file, docType: 'ktp' },
        { file: selfie.file, docType: 'selfie' },
      ].map(({ file, docType }) => {
        const fd = new FormData()
        fd.append('user_id', user.id)
        fd.append('doc_type', docType)
        fd.append('file', file)
        return fetch('/api/kyc/upload', { method: 'POST', body: fd })
      })

      const results = await Promise.all(uploads)

      for (const res of results) {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Gagal mengupload dokumen')
        }
      }

      toast.success('Dokumen berhasil diupload!')
      router.push('/register/menunggu-review')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan saat upload')
    } finally {
      setUploading(false)
    }
  }

  const canSubmit = !!ktp.file && !!selfie.file && !uploading

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-tani-green/5 to-background p-4">
      <div className="w-full max-w-md space-y-6 py-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-tani-green text-white mx-auto">
            <Leaf className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold font-[family-name:var(--font-heading)] text-tani-green">
            Verifikasi Identitas
          </h1>
          <p className="text-sm text-muted-foreground">
            Upload foto KTP dan selfie untuk verifikasi akun Anda
          </p>
        </div>

        {/* Upload KTP */}
        <Card className="shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Foto KTP / e-KTP</h3>
                <p className="text-xs text-muted-foreground">
                  Pastikan foto jelas dan tidak terpotong
                </p>
              </div>
              {ktp.file && <CheckCircle2 className="h-5 w-5 text-green-600" />}
            </div>

            {ktp.preview ? (
              <div className="relative">
                <Image
                  src={ktp.preview}
                  alt="KTP Preview"
                  width={400}
                  height={250}
                  className="w-full h-48 object-cover rounded-lg border"
                />
                <button
                  type="button"
                  onClick={() => removeFile(setKtp, ktp.preview)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => ktpInputRef.current?.click()}
                className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-tani-green hover:bg-tani-green/5 transition-colors"
              >
                <Upload className="h-8 w-8 text-gray-400" />
                <span className="text-sm text-gray-500">Tap untuk upload foto KTP</span>
                <span className="text-xs text-gray-400">JPG, PNG — Maks 5MB</span>
              </button>
            )}
            <input
              ref={ktpInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFileSelect(e, setKtp)}
            />
          </CardContent>
        </Card>

        {/* Upload Selfie */}
        <Card className="shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Foto Selfie Memegang KTP</h3>
                <p className="text-xs text-muted-foreground">
                  Pegang KTP di samping wajah. Pastikan wajah dan tulisan KTP terlihat jelas.
                </p>
              </div>
              {selfie.file && <CheckCircle2 className="h-5 w-5 text-green-600" />}
            </div>

            {selfie.preview ? (
              <div className="relative">
                <Image
                  src={selfie.preview}
                  alt="Selfie Preview"
                  width={400}
                  height={250}
                  className="w-full h-48 object-cover rounded-lg border"
                />
                <button
                  type="button"
                  onClick={() => removeFile(setSelfie, selfie.preview)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => selfieInputRef.current?.click()}
                className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-tani-green hover:bg-tani-green/5 transition-colors"
              >
                <Camera className="h-8 w-8 text-gray-400" />
                <span className="text-sm text-gray-500">Tap untuk foto selfie + KTP</span>
                <span className="text-xs text-gray-400">JPG, PNG — Maks 5MB</span>
              </button>
            )}
            <input
              ref={selfieInputRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={(e) => handleFileSelect(e, setSelfie)}
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <Button
          className="w-full h-12 bg-tani-green hover:bg-tani-green-dark text-white text-base font-semibold"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Mengupload...
            </>
          ) : (
            <>
              <Upload className="h-5 w-5 mr-2" />
              Upload Dokumen
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Dokumen Anda akan direview oleh tim taninesia dalam maksimum 3 hari kerja.
        </p>
      </div>
    </div>
  )
}
