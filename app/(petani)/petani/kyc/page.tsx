'use client'

import { useMemo } from 'react'
import { TopBar } from '@/components/shared/TopBar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { TrustScoreBadge } from '@/components/shared/TrustScoreBadge'
import { Card, CardContent } from '@/components/ui/card'
import { dummyKYCSubmissions } from '@/lib/dummy'
import { useAuthStore } from '@/store'
import { formatTanggal } from '@/lib/utils/date'
import { FileCheck, FileText, Shield, Info } from 'lucide-react'

export default function PetaniKYCPage() {
  const user = useAuthStore((s) => s.user)

  const mySubmission = useMemo(
    () =>
      dummyKYCSubmissions.find(
        (k) => k.user_id === user?.id && k.layer === 1,
      ),
    [user?.id],
  )

  const currentTrustLevel = useMemo(() => {
    if (mySubmission?.status === 'approved') return mySubmission.trust_level
    return 'unverified' as const
  }, [mySubmission])

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

        {/* Info banner */}
        <Card className="shadow-sm border-blue-200 bg-blue-50/50">
          <CardContent className="p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-xs text-blue-800 space-y-1">
              <p className="font-semibold">Kenapa perlu KYC?</p>
              <p>
                Verifikasi identitas (Layer 1) diperlukan agar Anda bisa
                menerima pencairan dana dan mengajukan kredit modal tanam.
                Cukup KTP dan selfie — prosesnya cepat.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Layer 1 Card */}
        <Card className="shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {mySubmission?.status === 'approved' ? (
                  <FileCheck className="h-5 w-5 text-green-600" />
                ) : (
                  <FileText className="h-5 w-5 text-muted-foreground" />
                )}
                <h3 className="font-semibold text-sm font-[family-name:var(--font-heading)]">
                  Layer 1 — Verifikasi Identitas
                </h3>
              </div>
              {mySubmission ? (
                <StatusBadge status={mySubmission.status} />
              ) : (
                <span className="text-xs text-muted-foreground">Belum diajukan</span>
              )}
            </div>

            {mySubmission ? (
              <>
                <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                  {mySubmission.documents.map((doc) => (
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
                  <span>Diajukan: {formatTanggal(mySubmission.submitted_at)}</span>
                  {mySubmission.reviewed_at && (
                    <span>Review: {formatTanggal(mySubmission.reviewed_at)}</span>
                  )}
                </div>

                {mySubmission.reviewer_catatan && (
                  <div className="p-2 bg-amber-50 rounded text-xs text-amber-800">
                    {mySubmission.reviewer_catatan}
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Dokumen yang diperlukan:
                </p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Foto KTP</li>
                  <li>Foto Selfie sambil memegang KTP</li>
                  <li>Verifikasi Nomor HP</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
