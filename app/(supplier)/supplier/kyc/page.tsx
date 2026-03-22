'use client'

import { useState, useEffect, useMemo } from 'react'
import { TopBar } from '@/components/shared/TopBar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { TrustScoreBadge } from '@/components/shared/TrustScoreBadge'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthStore } from '@/store'
import { formatTanggal } from '@/lib/utils/date'
// DIDIT_DISABLED: akan diaktifkan kembali setelah bug selesai
// import { DiditVerification } from '@/components/shared/DiditVerification'
import { FileCheck, FileText, Shield } from 'lucide-react'

const LAYERS = [1, 2, 3] as const

export default function SupplierKYCPage() {
  const user = useAuthStore((s) => s.user)
  const [kycData, setKycData] = useState<any[]>([])

  useEffect(() => {
    if (!user?.id) return
    async function fetchKyc() {
      try {
        const res = await fetch(`/api/kyc/status?user_id=${user!.id}`)
        if (res.ok) {
          const data = await res.json()
          setKycData(data.submissions || [])
        }
      } catch {
        // fallback to empty
      }
    }
    fetchKyc()
  }, [user?.id])

  const mySubmissions = useMemo(
    () => kycData,
    [kycData],
  )

  // Determine current trust level from highest approved layer
  const currentTrustLevel = useMemo(() => {
    const approved = mySubmissions.filter((s) => s.status === 'approved')
    if (approved.length === 0) return 'unverified' as const
    const highest = approved.sort((a, b) => b.layer - a.layer)[0]
    return highest.trust_level
  }, [mySubmissions])

  const getSubmissionForLayer = (layer: 1 | 2 | 3) =>
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
                      {submission.documents.map((doc: any) => (
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
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Belum ada dokumen yang diajukan untuk layer ini.
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </>
  )
}
