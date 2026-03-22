'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SOP_SECTIONS } from '@/lib/constants/sop-content'
import { useAuthStore } from '@/store'

interface SOPAgreementModalProps {
  open: boolean
}

export function SOPAgreementModal({ open }: SOPAgreementModalProps) {
  const [agreed, setAgreed] = useState(false)
  const agreeSOP = useAuthStore((s) => s.agreeSOP)

  function handleSubmit() {
    agreeSOP()
  }

  return (
    <Dialog open={open} modal onOpenChange={() => { }} disablePointerDismissal>
      <DialogContent
        className="sm:max-w-2xl"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle>Syarat & Ketentuan Platform taninesia</DialogTitle>
          <DialogDescription className="sr-only">
            Baca dan setujui syarat dan ketentuan platform sebelum melanjutkan.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] rounded-md border p-4">
          <div className="space-y-6 pr-4">
            {SOP_SECTIONS.map((section) => (
              <div key={section.id}>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  {section.title}
                </h3>

                {/* Sections with content array */}
                {'content' in section && section.content && (
                  <div className="space-y-3">
                    {section.content.map((block, i) => (
                      <div key={i}>
                        <h4 className="text-xs font-medium text-gray-700 mb-1">
                          {block.subtitle}
                        </h4>
                        <ul className="list-disc list-inside space-y-0.5">
                          {block.items.map((item, j) => (
                            <li key={j} className="text-xs text-gray-600">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sections with table */}
                {'tableHeaders' in section &&
                  section.tableHeaders &&
                  section.tableRows && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr>
                            {section.tableHeaders.map((header, i) => (
                              <th
                                key={i}
                                className="border border-gray-200 bg-gray-50 px-2 py-1 text-left font-medium text-gray-700"
                              >
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {section.tableRows.map((row, i) => (
                            <tr key={i}>
                              {row.map((cell, j) => (
                                <td
                                  key={j}
                                  className="border border-gray-200 px-2 py-1 text-gray-600"
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex items-start gap-2 pt-2">
          <Checkbox
            id="sop-agree"
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked === true)}
          />
          <label htmlFor="sop-agree" className="text-sm text-gray-700 leading-snug cursor-pointer">
            Saya telah membaca dan menyetujui seluruh peraturan platform taninesia
          </label>
        </div>

        <Button className="w-full" disabled={!agreed} onClick={handleSubmit}>
          Masuk ke Platform
        </Button>
      </DialogContent>
    </Dialog>
  )
}
