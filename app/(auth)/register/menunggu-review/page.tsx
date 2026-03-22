'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Leaf, Clock, RefreshCw, AlertTriangle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthStore } from '@/store'
import Link from 'next/link'

export default function MenungguReviewPage() {
  const user = useAuthStore((s) => s.user)
  const router = useRouter()

  // In a real implementation, this would fetch from Supabase
  // For now we use the user's kyc_status from the store or default to docs_submitted
  const [kycStatus] = useState('docs_submitted')
  const [reviewerNotes] = useState('')

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-tani-green/5 to-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-tani-green text-white mx-auto">
            <Leaf className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold font-[family-name:var(--font-heading)] text-tani-green">
            taninesia
          </h1>
        </div>

        {kycStatus === 'docs_submitted' && (
          <Card className="shadow-sm border-blue-200">
            <CardContent className="p-6 text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mx-auto">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold font-[family-name:var(--font-heading)]">
                  Dokumen Sedang Direview
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Dokumen Anda sedang direview oleh tim taninesia.
                  Proses ini membutuhkan maksimum <strong>3 hari kerja</strong>.
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-700">
                  Kami akan mengirimkan notifikasi WhatsApp setelah proses review selesai.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {kycStatus === 'docs_revision' && (
          <Card className="shadow-sm border-amber-200">
            <CardContent className="p-6 text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 mx-auto">
                <AlertTriangle className="h-8 w-8 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold font-[family-name:var(--font-heading)]">
                  Dokumen Perlu Diperbaiki
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Tim kami menemukan masalah pada dokumen yang Anda kirimkan.
                </p>
              </div>
              {reviewerNotes && (
                <div className="bg-amber-50 rounded-lg p-3 text-left">
                  <p className="text-xs font-medium text-amber-800 mb-1">Catatan reviewer:</p>
                  <p className="text-sm text-amber-700">{reviewerNotes}</p>
                </div>
              )}
              <Link href="/register/kyc">
                <Button className="w-full bg-tani-amber hover:bg-tani-amber/90 text-white">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Upload Ulang
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <Link href="/login">
            <Button variant="ghost" className="text-sm text-muted-foreground">
              Kembali ke Halaman Login
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
