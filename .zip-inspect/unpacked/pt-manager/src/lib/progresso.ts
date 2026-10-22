import { supabase } from './supabase';

export const TIPOS = ['peso', 'cintura', 'quadril', 'braço', 'coxa'] as const;
export type Tipo = (typeof TIPOS)[number];
export type Ponto = { d: string; v: number }; // d = 'YYYY-MM-DD'
export const unidade = (tipo: string) => (tipo === 'peso' ? 'kg' : 'cm');

export async function serieMedida(alunoId: string, tipo: Tipo): Promise<Ponto[]> {
  const { data, error } = await supabase
    .from('medidas').select('data,valor').eq('aluno_id', alunoId).eq('tipo', tipo).order('data');
  if (error) throw error;
  return (data ?? []).map((m) => ({ d: m.data, v: Number(m.valor) }));
}

export async function registrarMedida(alunoId: string, tipo: Tipo, valor: number) {
  const { error } = await supabase.from('medidas').insert({ aluno_id: alunoId, tipo, valor });
  if (error) throw error;
}

// Exercícios em que o aluno já registrou carga (para montar as opções do gráfico).
export async function exerciciosComCarga(alunoId: string): Promise<{ id: string; nome: string }[]> {
  const { data, error } = await supabase
    .from('cargas').select('exercicio_id,exercicios(nome)').eq('aluno_id', alunoId);
  if (error) throw error;
  const mapa = new Map<string, string>();
  for (const c of (data ?? []) as any[]) mapa.set(c.exercicio_id, c.exercicios?.nome ?? '?');
  return [...mapa].map(([id, nome]) => ({ id, nome })).sort((a, b) => a.nome.localeCompare(b.nome));
}

// Uma carga por dia: a maior registrada naquele dia.
export async function serieCarga(alunoId: string, exercicioId: string): Promise<Ponto[]> {
  const { data, error } = await supabase
    .from('cargas').select('data,kg').eq('aluno_id', alunoId).eq('exercicio_id', exercicioId).order('data');
  if (error) throw error;
  const porDia = new Map<string, number>();
  for (const c of data ?? []) porDia.set(c.data, Math.max(porDia.get(c.data) ?? 0, Number(c.kg)));
  return [...porDia].map(([d, v]) => ({ d, v }));
}
