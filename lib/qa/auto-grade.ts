import type { QAFormDefinition } from '@/lib/data/qa-forms'

export interface AutoGradeResult {
  grade: string
  isTolak: boolean
  wajibGagal: string[]
  gagalNonWajibCount: number
  totalNonWajib: number
  isComplete: boolean
}

export function computeAutoGrade(
  form: QAFormDefinition,
  results: Record<number, { lulus: boolean | null; catatan: string }>,
): AutoGradeResult {
  const wajibGagal: string[] = []
  let gagalNonWajibCount = 0
  let totalNonWajib = 0
  let totalParams = 0
  let filledParams = 0

  for (const section of form.sections) {
    for (const param of section.parameters) {
      totalParams++
      const r = results[param.no]
      if (r?.lulus !== null && r?.lulus !== undefined) filledParams++

      if (section.wajibLulusSemua) {
        if (r?.lulus === false) {
          wajibGagal.push(param.parameter)
        }
      } else {
        totalNonWajib++
        if (r?.lulus === false) {
          gagalNonWajibCount++
        }
      }
    }
  }

  const isComplete = filledParams === totalParams

  // If any wajib param failed → TOLAK
  if (wajibGagal.length > 0) {
    return { grade: 'TOLAK', isTolak: true, wajibGagal, gagalNonWajibCount, totalNonWajib, isComplete }
  }

  // Match against grade rules (ordered best → worst)
  for (const rule of form.gradeRules) {
    if (gagalNonWajibCount <= rule.maxGagalNonWajib) {
      return { grade: rule.grade, isTolak: false, wajibGagal, gagalNonWajibCount, totalNonWajib, isComplete }
    }
  }

  // No rule matched → TOLAK
  return { grade: 'TOLAK', isTolak: true, wajibGagal, gagalNonWajibCount, totalNonWajib, isComplete }
}
