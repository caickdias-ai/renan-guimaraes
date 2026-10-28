'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Check, Plus, Trash2, X } from 'lucide-react'
import { format, isSameDay, parseISO, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '@/lib/supabase/client'

type Client = { id: string; full_name: string }
type Appointment = { id: string; client_id: string | null; title: string; type: string; starts_at: string; status: string; notes: string | null }

const types = ['treino', 'avaliacao', 'consulta', 'outro']

export default function AgendaPage() {
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [clients, setClients] = useState<Client[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({ title: '', client_id: '', type: 'treino', starts_at: '08:00', notes: '' })

  async function load() {
    if (!supabase) return
    const { data: session } = await supabase.auth.getSession()
    const userId = session.session?.user.id
    if (!userId) return
    const start = `${date}T00:00:00`
    const end = `${date}T23:59:59`
    const [{ data: people }, { data: events }] = await Promise.all([
      supabase.from('clients').select('id,full_name').eq('trainer_id', userId).order('full_name'),
      supabase.from('appointments').select('id,client_id,title,type,starts_at,status,notes').eq('trainer_id', userId).gte('starts_at', start).lte('starts_at', end).order('starts_at'),
    ])
    setClients(people ?? [])
    setAppointments(events ?? [])
  }
  useEffect(() => { load() }, [date])
  const selectedDate = useMemo(() => parseISO(`${date}T12:00:00`), [date])
  async function save() {
    if (!supabase || !form.title.trim() || !form.starts_at) return setMessage('Informe título e horário.')
    setSaving(true)
    const { data: session } = await supabase.auth.getSession()
    const { error } = await supabase.from('appointments').insert({ trainer_id: session.session?.user.id, client_id: form.client_id || null, title: form.title.trim(), type: form.type, starts_at: `${date}T${form.starts_at}:00`, notes: form.notes.trim() || null })
    setSaving(false)
    if (error) return setMessage('Não foi possível salvar o compromisso.')
    setMessage('Compromisso salvo.'); setForm({ title: '', client_id: '', type: 'treino', starts_at: '08:00', notes: '' }); setShowForm(false); load()
  }
  async function updateStatus(id: string, status: string) { await supabase?.from('appointments').update({ status }).eq('id', id); setMessage(status === 'done' ? 'Atendimento concluído.' : 'Compromisso cancelado.'); load() }
  async function remove(id: string) { if (!window.confirm('Excluir este compromisso?')) return; await supabase?.from('appointments').delete().eq('id', id); setMessage('Compromisso excluído.'); load() }
  return <main className="min-h-dvh bg-[#f4f5f3] px-4 pb-28 pt-6 text-[#292b29] sm:px-8 lg:pb-10"><div className="mx-auto max-w-5xl"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#899387]">Organização</p><h1 className="mt-1 text-3xl font-extrabold">Agenda</h1><p className="mt-2 text-sm text-[#778078]">{format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}</p></div><button onClick={() => setShowForm(true)} className="button w-auto px-5"><Plus className="mr-2 inline size-4" />Novo atendimento</button></div><div className="mt-6 flex items-center gap-3 rounded-2xl border border-[#e1e6df] bg-[#fbfcfa] p-4"><label className="text-sm font-bold" htmlFor="agenda-date">Dia</label><input id="agenda-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="field max-w-[180px]" /></div>{message && <p className="mt-4 rounded-xl bg-[#eef3eb] p-3 text-sm font-bold text-[#667c5d]">{message}</p>}<section className="mt-5 space-y-3">{appointments.length ? appointments.map((event) => <article key={event.id} className="flex flex-col gap-3 rounded-2xl border border-[#e1e6df] bg-[#fbfcfa] p-4 sm:flex-row sm:items-center"><div className="min-w-[72px] text-lg font-extrabold text-[#667c5d]">{format(parseISO(event.starts_at), 'HH:mm')}</div><div className="flex-1"><p className="font-bold">{event.title}</p><p className="mt-1 text-xs text-[#7b837a]">{clients.find((client) => client.id === event.client_id)?.full_name || 'Sem aluno'} · {event.type}</p>{event.notes && <p className="mt-2 text-xs text-[#7b837a]">{event.notes}</p>}</div><div className="flex gap-2"><button onClick={() => updateStatus(event.id, 'done')} className="rounded-xl bg-[#eef3eb] p-3 text-[#667c5d]" aria-label="Concluir"><Check className="size-4" /></button><button onClick={() => updateStatus(event.id, 'canceled')} className="rounded-xl bg-[#fff0ed] p-3 text-[#a4534e]" aria-label="Cancelar"><X className="size-4" /></button><button onClick={() => remove(event.id)} className="rounded-xl bg-[#fff0ed] p-3 text-[#a4534e]" aria-label="Excluir"><Trash2 className="size-4" /></button></div></article>) : <div className="rounded-2xl border border-dashed border-[#cbd5c8] bg-[#fbfcfa] px-6 py-14 text-center"><CalendarDays className="mx-auto size-8 text-[#a2ada0]" /><h2 className="mt-3 font-extrabold">Agenda livre</h2><p className="mt-1 text-sm text-[#7b837a]">Nenhum atendimento marcado para este dia.</p></div>}</section></div>{showForm && <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/25 sm:items-center sm:p-5"><section className="w-full max-w-md rounded-t-3xl bg-[#fbfcfa] p-6 sm:rounded-3xl"><div className="flex items-center justify-between"><h2 className="text-xl font-extrabold">Novo atendimento</h2><button onClick={() => setShowForm(false)} aria-label="Fechar"><X /></button></div><div className="mt-5 grid gap-3"><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Título do atendimento" className="field" /><select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} className="field"><option value="">Selecione o aluno</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.full_name}</option>)}</select><div className="grid grid-cols-2 gap-3"><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="field">{types.map((type) => <option key={type}>{type}</option>)}</select><input type="time" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} className="field" /></div><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Observações" className="field min-h-24" /><button onClick={save} disabled={saving} className="button">{saving ? 'Salvando...' : 'Salvar atendimento'}</button></div></section></div>}</main>
}
