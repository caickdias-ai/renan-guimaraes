import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!serviceKey || !url) return NextResponse.json({ error: 'Serviço indisponível.' }, { status: 503 })
  if (!body.name?.trim() || !body.email?.trim() || String(body.password || '').length < 6) return NextResponse.json({ error: 'Preencha os campos obrigatórios.' }, { status: 400 })
  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data: client, error: clientError } = await admin.from('clients').select('id,trainer_id').eq('id', id).maybeSingle()
  if (clientError || !client) return NextResponse.json({ error: 'Este link não está disponível. Solicite um novo link ao personal.' }, { status: 404 })
  const email = body.email.trim().toLowerCase()
  const { data: created, error: authError } = await admin.auth.admin.createUser({ email, password: body.password, email_confirm: false, user_metadata: { role: 'client', client_id: client.id } })
  if (authError && !authError.message.toLowerCase().includes('already')) return NextResponse.json({ error: 'Não foi possível criar o acesso.' }, { status: 400 })
  const userId = created.user?.id
  const { error: updateError } = await admin.from('clients').update({ full_name: body.name.trim(), email, phone: body.phone?.trim() || null, birth_date: body.birthDate || null, status: 'active', user_id: userId || undefined }).eq('id', id)
  if (updateError) return NextResponse.json({ error: 'Não foi possível salvar o cadastro.' }, { status: 400 })
  const answers = body.answers || {}
  const { error: anamnesisError } = await admin.from('anamneses').upsert({ client_id: client.id, trainer_id: client.trainer_id, height_cm: Number(body.height) || null, weight_kg: Number(body.weight) || null, medical_conditions: JSON.stringify(answers), completed_at: new Date().toISOString() }, { onConflict: 'client_id' })
  if (anamnesisError) return NextResponse.json({ error: 'Cadastro salvo, mas a anamnese não foi salva.' }, { status: 400 })
  return NextResponse.json({ ok: true })
}
