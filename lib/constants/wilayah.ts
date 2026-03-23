export const PROVINSI = [
  'Aceh',
  'Sumatera Utara',
  'Sumatera Barat',
  'Riau',
  'Jambi',
  'Sumatera Selatan',
  'Bengkulu',
  'Lampung',
  'Kepulauan Bangka Belitung',
  'Kepulauan Riau',
  'DKI Jakarta',
  'Jawa Barat',
  'Jawa Tengah',
  'DI Yogyakarta',
  'Jawa Timur',
  'Banten',
  'Bali',
  'Nusa Tenggara Barat',
  'Nusa Tenggara Timur',
  'Kalimantan Barat',
  'Kalimantan Tengah',
  'Kalimantan Selatan',
  'Kalimantan Timur',
  'Kalimantan Utara',
  'Sulawesi Utara',
  'Sulawesi Tengah',
  'Sulawesi Selatan',
  'Sulawesi Tenggara',
  'Gorontalo',
  'Sulawesi Barat',
  'Maluku',
  'Maluku Utara',
  'Papua',
  'Papua Barat',
  'Papua Selatan',
  'Papua Tengah',
  'Papua Pegunungan',
  'Papua Barat Daya',
] as const

export type Provinsi = (typeof PROVINSI)[number]

export const PROVINSI_PULAU: Record<string, string> = {
  // Sumatera
  'Aceh': 'Sumatera',
  'Sumatera Utara': 'Sumatera',
  'Sumatera Barat': 'Sumatera',
  'Riau': 'Sumatera',
  'Kepulauan Riau': 'Sumatera',
  'Jambi': 'Sumatera',
  'Sumatera Selatan': 'Sumatera',
  'Bengkulu': 'Sumatera',
  'Lampung': 'Sumatera',
  'Kepulauan Bangka Belitung': 'Sumatera',

  // Jawa
  'DKI Jakarta': 'Jawa',
  'Jawa Barat': 'Jawa',
  'Banten': 'Jawa',
  'Jawa Tengah': 'Jawa',
  'DI Yogyakarta': 'Jawa',
  'Jawa Timur': 'Jawa',

  // Kalimantan
  'Kalimantan Barat': 'Kalimantan',
  'Kalimantan Tengah': 'Kalimantan',
  'Kalimantan Selatan': 'Kalimantan',
  'Kalimantan Timur': 'Kalimantan',
  'Kalimantan Utara': 'Kalimantan',

  // Sulawesi
  'Sulawesi Utara': 'Sulawesi',
  'Gorontalo': 'Sulawesi',
  'Sulawesi Tengah': 'Sulawesi',
  'Sulawesi Barat': 'Sulawesi',
  'Sulawesi Selatan': 'Sulawesi',
  'Sulawesi Tenggara': 'Sulawesi',

  // Bali & Nusa Tenggara
  'Bali': 'Bali-Nusa Tenggara',
  'Nusa Tenggara Barat': 'Bali-Nusa Tenggara',
  'Nusa Tenggara Timur': 'Bali-Nusa Tenggara',

  // Maluku
  'Maluku': 'Maluku',
  'Maluku Utara': 'Maluku',

  // Papua
  'Papua': 'Papua',
  'Papua Barat': 'Papua',
  'Papua Tengah': 'Papua',
  'Papua Pegunungan': 'Papua',
  'Papua Selatan': 'Papua',
  'Papua Barat Daya': 'Papua',
}

export function getPulau(provinsi: string): string {
  return PROVINSI_PULAU[provinsi] || 'Lainnya'
}

export function isSamaPulau(prov1: string, prov2: string): boolean {
  return getPulau(prov1) === getPulau(prov2)
}
