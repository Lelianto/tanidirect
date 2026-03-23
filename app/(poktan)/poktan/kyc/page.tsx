'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { TopBar } from '@/components/shared/TopBar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { TrustScoreBadge } from '@/components/shared/TrustScoreBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store'
import { formatTanggal } from '@/lib/utils/date'
// DIDIT_DISABLED: akan diaktifkan kembali setelah bug selesai
// import { DiditVerification } from '@/components/shared/DiditVerification'
import { FileCheck, FileText, Shield, Upload } from 'lucide-react'

const LAYERS = [1, 2] as const

export default function PoktanKYCPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)

  const [mySubmissions, setMySubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    fetch(`/api/kyc/status?user_id=${user.id}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.submissions) {
          setMySubmissions(data.submissions)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  // Determine current trust level from highest approved layer
  const currentTrustLevel = useMemo(() => {
    const approved = mySubmissions.filter((s: any) => s.status === 'approved')
    if (approved.length === 0) return 'unverified' as const
    const highest = approved.sort((a: any, b: any) => b.layer - a.layer)[0]
    return highest.trust_level
  }, [mySubmissions])

  const getSubmissionForLayer = (layer: 1 | 2) =>
    mySubmissions.find((s) => s.layer === layer)

  return (
    <>
      <TopBar title="Status KYC" />
      <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
        {/* Trust Level Badge */}
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <Shield className="h-6 w-6 text-tani-green" />
            <div>
              <p className="text-sm font-semibold font-[family-name:var(--font-heading)]">
                Trust Level Anda
              </p>
              <div className="mt-1">
                <TrustScoreBadge level={currentTrustLevel} size="md" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* DIDIT_DISABLED: akan diaktifkan kembali setelah bug selesai */}
        {/* <DiditVerification /> */}

        {/* Upload CTA - show when KYC not fully verified */}
        {user?.kyc_status !== 'fully_verified' && (() => {
          const layer1 = getSubmissionForLayer(1)
          const layer1NeedUpload = !layer1 || layer1.status === 'rejected'

          return (
            <Card className="shadow-sm border-amber-200 bg-amber-50/50">
              <CardContent className="p-4 space-y-3">
                {layer1NeedUpload ? (
                  <>
                    <p className="text-sm font-semibold text-amber-800">
                      {!layer1
                        ? 'Anda belum mengupload dokumen verifikasi.'
                        : 'Dokumen Layer 1 Anda ditolak. Silakan upload ulang.'}
                    </p>
                    <p className="text-xs text-amber-700">
                      Upload foto KTP dan selfie untuk memulai proses verifikasi identitas.
                    </p>
                    <Button
                      className="w-full bg-tani-green hover:bg-tani-green/90"
                      onClick={() => router.push('/register/kyc')}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {!layer1 ? 'Upload Dokumen KYC' : 'Upload Ulang Dokumen'}
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-amber-800">
                      Dokumen Anda sedang dalam proses review.
                    </p>
                    <p className="text-xs text-amber-700">
                      Verifikasi Layer 1 {layer1.status === 'approved' ? 'telah disetujui' : 'sedang ditinjau'}.
                      {layer1.status === 'approved' && ' Lanjutkan verifikasi layer berikutnya untuk meningkatkan trust level.'}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          )
        })()}

        {/* Layer Cards */}
        {LAYERS.map((layer) => {
          const submission = getSubmissionForLayer(layer)

          return (
            <Card key={layer} className="shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {submission?.status === 'approved' ? (
                      <FileCheck className="h-5 w-5 text-green-600" />
                    ) : (
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    )}
                    <h3 className="font-semibold text-sm font-[family-name:var(--font-heading)]">
                      Layer {layer}
                    </h3>
                  </div>
                  {submission ? (
                    <StatusBadge status={submission.status} />
                  ) : (
                    <span className="text-xs text-muted-foreground">Belum diajukan</span>
                  )}
                </div>

                {submission ? (
                  <>
                    <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                      {submission.documents.map((doc: { id: string; nama: string; status: string }) => (
                        <div key={doc.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs">{doc.nama}</span>
                          </div>
                          <StatusBadge status={doc.status} />
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Diajukan: {formatTanggal(submission.submitted_at)}</span>
                      {submission.reviewed_at && (
                        <span>Review: {formatTanggal(submission.reviewed_at)}</span>
                      )}
                    </div>

                    {submission.reviewer_catatan && (
                      <div className="p-2 bg-amber-50 rounded text-xs text-amber-800">
                        {submission.reviewer_catatan}
                      </div>
                    )}

                    {submission.status === 'rejected' && (
                      <Button
                        size="sm"
                        className="w-full bg-tani-green hover:bg-tani-green/90"
                        onClick={() => router.push(`/register/kyc?layer=${layer}`)}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Ulang Dokumen
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Belum ada dokumen yang diajukan untuk layer ini.
                    </p>
                    <Button
                      size="sm"
                      className="w-full bg-tani-green hover:bg-tani-green/90"
                      onClick={() => router.push(`/register/kyc?layer=${layer}`)}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Ajukan Verifikasi Layer {layer}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </>
  )
}
