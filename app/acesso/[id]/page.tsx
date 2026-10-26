'use client'

import { FormEvent, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function StudentAccess({ params }: { params: { id: string } }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', birthDate: '', height: '', weight: '', conditions: '', password: '' })
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  function update(key: keyof typeof form, value: string) { setForm((current) => ({ ...current, [key]: value })) }
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!supabase) return setStatus('Conexão indisponível. Tente novamente mais tarde.')
    if (!form.name.trim() || !form.email.trim() || form.password.length < 6) return setStatus('Preencha nome, e-mail e uma senha com pelo menos 6 caracteres.')
    setSaving(true)
    const { data: client, error: clientError } = await supabase.from('clients').update({ full_name: form.name.trim(), email: form.email.trim().toLowerCase(), phone: form.phone.trim() || null, birth_date: form.birthDate || null, status: 'active' }).eq('id', params.id).select('id,trainer_id').single()
    if (clientError || !client) { setSaving(false); return setStatus('Não foi possível localizar este convite. Solicite um novo link ao personal.') }
    const { error: anamnesisError } = await supabase.from('anamneses').upsert({ client_id: client.id, trainer_id: client.trainer_id, height_cm: form.height ? Number(form.height) : null, weight_kg: form.weight ? Number(form.weight) : null, medical_conditions: form.conditions.trim() || null, completed_at: new Date().toISOString() }, { onConflict: 'client_id' })
    if (anamnesisError) { setSaving(false); return setStatus('Cadastro salvo, mas a anamnese precisa ser revisada pelo personal.') }
    const { error: authError } = await supabase.auth.signUp({ email: form.email.trim().toLowerCase(), password: form.password, options: { data: { role: 'client', client_id: client.id }, emailRedirectTo: `${window.location.origin}/auth/callback` } })
    setSaving(false)
    setStatus(authError ? 'Dados salvos. O e-mail já pode ter cadastro ou precisa ser confirmado.' : 'Cadastro enviado. Confirme seu e-mail para acessar sua área.')
  }
  return <main className="min-h-screen bg-[#f4f5f3] p-5 text-[#242624]"><form onSubmit={submit} className="mx-auto flex max-w-xl flex-col gap-4 rounded-3xl bg-[#fbfcfa] p-6 shadow-sm sm:p-8"><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8a9385]">Guimarães Treinador</p><h1 className="text-3xl font-extrabold tracking-[-0.04em]">Complete seu cadastro</h1><p className="text-sm text-[#7b837a]">Preencha seus dados e a ficha de anamnese para começar seu acompanhamento.</p><div className="grid gap-4 sm:grid-cols-2"><input required value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Nome completo" className="field sm:col-span-2" /><input required type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="E-mail" className="field" /><input required minLength={6} type="password" value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="Crie uma senha" className="field" /><input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="Telefone com DDD" className="field" /><input type="date" value={form.birthDate} onChange={(e) => update('birthDate', e.target.value)} aria-label="Data de nascimento" className="field" /><input type="number" value={form.height} onChange={(e) => update('height', e.target.value)} placeholder="Altura em cm" className="field" /><input type="number" value={form.weight} onChange={(e) => update('weight', e.target.value)} placeholder="Peso em kg" className="field" /><textarea value={form.conditions} onChange={(e) => update('conditions', e.target.value)} placeholder="Lesões, condições de saúde e observações" className="field min-h-28 sm:col-span-2" /></div><button disabled={saving} className="button disabled:opacity-60">{saving ? 'Salvando...' : 'Enviar cadastro'}</button>{status && <p role="status" className="rounded-xl bg-[#eef3eb] p-3 text-sm text-[#586555]">{status}</p>}</form></main>
}
