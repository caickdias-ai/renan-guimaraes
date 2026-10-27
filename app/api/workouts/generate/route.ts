import { generateText, gateway } from 'ai'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const prompt = String(body.prompt || 'Crie um treino equilibrado de musculação para hipertrofia.')
  const result = await generateText({
    model: gateway('anthropic/claude-sonnet-4.6'),
    system: 'Você é um personal trainer. Sugira exercícios seguros, organizados por dia, com séries, repetições e descanso. Retorne texto curto em português do Brasil. Não faça diagnóstico médico.',
    prompt,
  })
  return NextResponse.json({ text: result.text })
}
