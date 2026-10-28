'use client'

import { FormEvent, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  async function submit(event: FormEvent) { event.preventDefault(); if (!supabase || password.length < 6) return setMessage('Informe uma senha com pelo menos 6 caracteres.'); const { error } = await supabase.auth.updateUser({ password }); setMessage(error ? 'Não foi possível redefinir a senha.' : 'Senha atualizada com sucesso.') }
  return <main className="flex min-h-dvh items-center justify-center bg-[#f4f5f3] p-5"><form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-[#fbfcfa] p-7"><h1 className="text-2xl font-extrabold">Redefinir senha</h1><p className="mt-2 text-sm text-[#7b837a]">Crie uma nova senha para acessar o painel.</p><input className="field mt-6" type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Nova senha" /><button className="button mt-4">Salvar nova senha</button>{message && <p className="mt-3 text-sm font-bold">{message}</p>}</form></main>
}
