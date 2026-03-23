import { NextRequest, NextResponse } from 'next/server'
import { groq, GROQ_MODEL } from '@/lib/groq/client'
import { getCache, setCache } from '@/lib/groq/cache'
import { createHash } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { catatan, komoditas, grade } = await request.json()

    if (!catatan || !komoditas) {
      return NextResponse.json(
        { error: 'catatan dan komoditas wajib diisi' },
        { status: 400 }
      )
    }

    // Cache key: hash of input combination
    const cacheKey = createHash('md5')
      .update(`${catatan}|${komoditas}|${grade || ''}`)
      .digest('hex')

    const cached = await getCache('qa-notes', cacheKey)
    if (cached) return NextResponse.json(cached)

    const prompt = `Kamu adalah ahli quality assurance produk pertanian Indonesia.

Seorang supplier mengirim catatan kualitas berikut untuk pre-order komoditas "${komoditas}" grade ${grade || '-'}:

"""
${catatan}
"""

Berdasarkan catatan tersebut, buatkan maksimal 2 tahap pengecekan kualitas (QA check) yang spesifik dan bisa digunakan oleh inspektor QA di lapangan.

Setiap tahap harus memiliki:
- "parameter": nama parameter pengecekan (singkat, 3-6 kata)
- "kriteria": kriteria kelulusan yang jelas dan terukur (1-2 kalimat)

PENTING:
- Hanya buat 1-2 tahap yang paling relevan dengan catatan supplier
- Gunakan bahasa Indonesia yang jelas
- Kriteria harus bisa dinilai secara visual atau dengan alat sederhana
- Jangan ulangi parameter yang sudah ada di SNI standar (ukuran, warna umum, dll)
- Fokus pada kebutuhan SPESIFIK yang diminta supplier

Jawab HANYA dalam format JSON array, tanpa penjelasan tambahan:
[{"parameter": "...", "kriteria": "..."}]`

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500,
    })

    const content = completion.choices[0]?.message?.content?.trim() || '[]'

    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'Gagal memparse response AI' },
        { status: 500 }
      )
    }

    const steps = JSON.parse(jsonMatch[0]) as Array<{
      parameter: string
      kriteria: string
    }>

    // Limit to max 2 steps and add IDs
    const qaSteps = steps.slice(0, 2).map((step, i) => ({
      id: `supplier-qa-${Date.now()}-${i + 1}`,
      parameter: step.parameter,
      kriteria: step.kriteria,
    }))

    const result = { steps: qaSteps }
    await setCache('qa-notes', cacheKey, result, 720) // 30 days

    return NextResponse.json(result)
  } catch (error) {
    console.error('QA Notes AI error:', error)

    // Fallback: return generic steps based on the notes
    return NextResponse.json({
      steps: [],
      error: 'AI tidak tersedia, catatan akan disimpan tanpa konversi otomatis',
    })
  }
}
