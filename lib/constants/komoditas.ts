export const KOMODITAS = [
  'Beras',
  'Jagung',
  'Kedelai',
  'Cabai Merah',
  'Cabai Rawit',
  'Bawang Merah',
  'Bawang Putih',
  'Tomat',
  'Kentang',
  'Wortel',
  'Kubis',
  'Sawi',
  'Bayam',
  'Kangkung',
  'Timun',
  'Terong',
  'Kacang Panjang',
  'Brokoli',
  'Singkong',
  'Ubi Jalar',
  'Pisang',
  'Mangga',
  'Jeruk',
  'Pepaya',
  'Semangka',
  'Kelapa',
  'Kopi Arabika',
  'Kopi Robusta',
  'Kakao',
  'Teh',
  'Lada',
  'Pala',
  'Cengkeh',
  'Vanili',
] as const

export type Komoditas = (typeof KOMODITAS)[number]

export const GRADE_LABELS: Record<string, string> = {
  A: 'Premium',
  B: 'Standar',
  C: 'Ekonomi',
}

export const GRADE_COLORS: Record<string, string> = {
  A: 'bg-green-100 text-green-800',
  B: 'bg-blue-100 text-blue-800',
  C: 'bg-amber-100 text-amber-800',
}
