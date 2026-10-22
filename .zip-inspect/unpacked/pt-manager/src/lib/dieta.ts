import { supabase } from './supabase';

export type Refeicao = { nome: string; texto: string };
export const REFEICOES_PADRAO: Refeicao[] = ['Café da manhã', 'Almoço', 'Lanche', 'Jantar'].map((nome) => ({ nome, texto: '' }));

export async function obterDieta(alunoId: string): Promise<Refeicao[] | null> {
  const { data, error } = await supabase.from('dietas').select('refeicoes').eq('aluno_id', alunoId).maybeSingle();
  if (error) throw error;
  return (data?.refeicoes as Refeicao[]) ?? null;
}

export async function salvarDieta(alunoId: string, refeicoes: Refeicao[]) {
  const { error } = await supabase.from('dietas').upsert({ aluno_id: alunoId, refeicoes: refeicoes.filter((r) => r.nome.trim()) });
  if (error) throw error;
}
