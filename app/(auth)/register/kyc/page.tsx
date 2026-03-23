'use client'

import { useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Leaf, Upload, Camera, X, CheckCircle2, Loader2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthStore } from '@/store'
import { toast } from 'sonner'
import Image from 'next/image'

interface DocUpload {
  file: File | null
  preview: string
}

interface LayerDocConfig {
  docType: string
  label: string
  description: string
  capture?: 'environment' | 'user'
  icon: 'upload' | 'camera' | 'file'
}

const LAYER_CONFIGS: Record<number, { title: string; subtitle: string; docs: LayerDocConfig[] }> = {
  1: {
    title: 'Verifikasi Identitas',
    subtitle: 'Upload foto KTP dan selfie untuk verifikasi akun Anda',
    docs: [
      {
        docType: 'ktp',
        label: 'Foto KTP / e-KTP',
        description: 'Pastikan foto jelas dan tidak terpotong',
        capture: 'environment',
        icon: 'upload',
      },
      {
        docType: 'selfie',
        label: 'Foto Selfie Memegang KTP',
        description: 'Pegang KTP di samping wajah. Pastikan wajah dan tulisan KTP terlihat jelas.',
        capture: 'user',
        icon: 'camera',
      },
    ],
  },
  2: {
    title: 'Verifikasi Dokumen Poktan',
    subtitle: 'Upload Surat BPP dan foto buku rekening untuk aktivasi penuh akun',
    docs: [
      {
        docType: 'surat_bpp',
        label: 'Surat Rekomendasi BPP',
        description: 'Surat rekomendasi dari Balai Penyuluhan Pertanian (BPP) setempat',
        capture: 'environment',
        icon: 'file',
      },
      {
        docType: 'rekening',
        label: 'Foto Buku Rekening / Halaman Depan',
        description: 'Pastikan nama dan nomor rekening terlihat jelas',
        capture: 'environment',
        icon: 'upload',
      },
    ],
  },
}

const ICON_MAP = {
  upload: Upload,
  camera: Camera,
  file: FileText,
}

export default function KYCUploadPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <KYCUploadContent />
    </Suspense>
  )
}

function KYCUploadContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.role)

  const layer = Number(searchParams.get('layer') || '1')
  const config = LAYER_CONFIGS[layer] || LAYER_CONFIGS[1]

  const dashboardPath = role === 'ketua_poktan' ? '/poktan/dashboard'
    : role === 'supplier' ? '/supplier/dashboard'
    : role === 'petani' ? '/petani/dashboard'
    : '/login'

  const kycPath = role === 'ketua_poktan' ? '/poktan/kyc'
    : role === 'supplier' ? '/supplier/kyc'
    : role === 'petani' ? '/petani/kyc'
    : '/login'

  const [docs, setDocs] = useState<Record<string, DocUpload>>(
    () => Object.fromEntries(config.docs.map((d) => [d.docType, { file: null, preview: '' }]))
  )
  const [uploading, setUploading] = useState(false)
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  function handleFileSelect(
    e: React.ChangeEvent<HTMLInputElement>,
    docType: string
  ) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimum 5MB')
      return
    }

    const preview = URL.createObjectURL(file)
    setDocs((prev) => ({ ...prev, [docType]: { file, preview } }))
  }

  function removeFile(docType: string) {
    const current = docs[docType]
    if (current?.preview) URL.revokeObjectURL(current.preview)
    setDocs((prev) => ({ ...prev, [docType]: { file: null, preview: '' } }))
  }

  async function handleSubmit() {
    if (!user) return

    const allFilled = config.docs.every((d) => docs[d.docType]?.file)
    if (!allFilled) return

    setUploading(true)
    try {
      const uploads = config.docs.map((d) => {
        const fd = new FormData()
        fd.append('user_id', user.id)
        fd.append('doc_type', d.docType)
        fd.append('layer', String(layer))
        fd.append('file', docs[d.docType].file!)
        return fetch('/api/kyc/upload', { method: 'POST', body: fd })
      })

      const results = await Promise.all(uploads)

      for (const res of results) {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Gagal mengupload dokumen')
        }
      }

      if (layer === 1 && user) {
        useAuthStore.getState().setUser({ ...user, kyc_status: 'docs_submitted' })
      }

      toast.success('Dokumen berhasil diupload!')

      if (layer === 1) {
        router.push('/register/menunggu-review')
      } else {
        router.push(kycPath)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan saat upload')
    } finally {
      setUploading(false)
    }
  }

  const canSubmit = config.docs.every((d) => docs[d.docType]?.file) && !uploading

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-tani-green/5 to-background p-4">
      <div className="w-full max-w-md space-y-6 py-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-tani-green text-white mx-auto">
            <Leaf className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold font-[family-name:var(--font-heading)] text-tani-green">
            {config.title}
          </h1>
          {layer > 1 && (
            <p className="text-xs font-medium text-tani-green/70">Layer {layer}</p>
          )}
          <p className="text-sm text-muted-foreground">
            {config.subtitle}
          </p>
        </div>

        {/* Document Upload Cards */}
        {config.docs.map((docConfig) => {
          const doc = docs[docConfig.docType]
          const IconComponent = ICON_MAP[docConfig.icon]

          return (
            <Card key={docConfig.docType} className="shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">{docConfig.label}</h3>
                    <p className="text-xs text-muted-foreground">
                      {docConfig.description}
                    </p>
                  </div>
                  {doc?.file && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                </div>

                {doc?.preview ? (
                  <div className="relative">
                    <Image
                      src={doc.preview}
                      alt={`${docConfig.label} Preview`}
                      width={400}
                      height={250}
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(docConfig.docType)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => inputRefs.current[docConfig.docType]?.click()}
                    className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-tani-green hover:bg-tani-green/5 transition-colors"
                  >
                    <IconComponent className="h-8 w-8 text-gray-400" />
                    <span className="text-sm text-gray-500">Tap untuk upload {docConfig.label.toLowerCase()}</span>
                    <span className="text-xs text-gray-400">JPG, PNG — Maks 5MB</span>
                  </button>
                )}
                <input
                  ref={(el) => { inputRefs.current[docConfig.docType] = el }}
                  type="file"
                  accept="image/*"
                  capture={docConfig.capture}
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, docConfig.docType)}
                />
              </CardContent>
            </Card>
          )
        })}

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

        <Button
          variant="ghost"
          className="w-full text-muted-foreground"
          onClick={() => router.push(layer === 1 ? dashboardPath : kycPath)}
        >
          {layer === 1 ? 'Lewati, masuk ke Dashboard' : 'Kembali ke Status KYC'}
        </Button>
      </div>
    </div>
  )
}
