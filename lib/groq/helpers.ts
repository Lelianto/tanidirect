import { groq, GROQ_MODEL } from './client'

interface QueryGroqJSONOptions {
  prompt: string
  temperature?: number
  maxTokens?: number
  jsonShape: string
}

export async function queryGroqJSON<T>(options: QueryGroqJSONOptions): Promise<T> {
  const { prompt, temperature = 0.3, maxTokens = 1000, jsonShape } = options

  const fullPrompt = `${prompt}

Jawab HANYA dalam format JSON berikut, tanpa penjelasan tambahan:
${jsonShape}`

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: 'user', content: fullPrompt }],
    temperature,
    max_tokens: maxTokens,
  })

  const content = completion.choices[0]?.message?.content?.trim() || ''

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || content.match(/(\{[\s\S]*\})/) || content.match(/(\[[\s\S]*\])/)

  if (!jsonMatch) {
    throw new Error('Gagal memparse response AI: tidak ditemukan JSON')
  }

  const jsonStr = jsonMatch[1] || jsonMatch[0]
  return JSON.parse(jsonStr) as T
}
