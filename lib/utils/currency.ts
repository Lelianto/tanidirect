export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num)
}

export function formatKg(kg: number): string {
  if (kg >= 1000) {
    return `${formatNumber(kg / 1000)} ton`
  }
  return `${formatNumber(kg)} kg`
}
