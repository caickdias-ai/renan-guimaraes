import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const workoutDraftSchema = z.object({
  title: z.string().min(1),
  goal: z.string().optional().default(''),
  days: z.array(z.object({ name: z.string().min(1), position: z.number().int().nonnegative(), items: z.array(z.object({ exercise_id: z.string().uuid(), sets: z.number().int().positive(), reps: z.string().min(1), rest_seconds: z.number().int().nonnegative(), notes: z.string().optional().default(''), position: z.number().int().nonnegative() })) })).min(1),
})

export const dietDraftSchema = z.object({
  title: z.string().min(1),
  calories: z.number().nonnegative(), protein_g: z.number().nonnegative(), carbs_g: z.number().nonnegative(), fat_g: z.number().nonnegative(),
  meals: z.array(z.object({ name: z.string().min(1), time: z.string().min(1), items: z.array(z.object({ food: z.string().min(1), quantity: z.string().min(1), kcal: z.number().nonnegative(), protein_g: z.number().nonnegative(), carbs_g: z.number().nonnegative(), fat_g: z.number().nonnegative() })), substitutions: z.string().optional().default('') })).min(1),
})

export function serverSupabase() {
  if (!supabaseUrl || !serviceKey) throw new Error('Configuração segura do Supabase ausente')
  return createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function requireTrainer(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) throw new Response('Não autenticado', { status: 401 })
  const admin = serverSupabase()
  const { data: { user }, error } = await admin.auth.getUser(token)
  if (error || !user) throw new Response('Não autenticado', { status: 401 })
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'trainer') throw new Response('Acesso restrito ao personal', { status: 403 })
  return { admin, user }
}

export async function generateJson<T>(prompt: string, schema: z.ZodType<T>) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY não configurada no servidor')
  let lastError = 'Resposta inválida'
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model: 'claude-sonnet-5-5', max_tokens: 6000, temperature: 0.2, system: 'Responda SOMENTE com JSON válido, sem markdown, sem comentários ou texto adicional.', messages: [{ role: 'user', content: prompt }] }) })
    if (!response.ok) throw new Error(`Anthropic respondeu ${response.status}`)
    const payload = await response.json() as { content?: Array<{ text?: string }> }
    try { const text = payload.content?.find((item) => item.text)?.text || ''; return schema.parse(JSON.parse(text.replace(/^```json\s*|\s*```$/g, ''))) } catch (error) { lastError = error instanceof Error ? error.message : 'JSON inválido' }
  }
  throw new Error(`A IA retornou dados inválidos: ${lastError}`)
}
