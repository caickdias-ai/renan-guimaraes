import { supabase } from './supabase';

export type ItemAluno = { id: string; series: number; reps: string; exercicios: { id: string; nome: string; video_url: string | null } };
export type TreinoAluno = { id: string; nome: string; ordem: number; treino_itens: ItemAluno[] };

export async function meuAluno() {
  const { data: u } = await supabase.auth.getUser();
  const { data, error } = await supabase.from('alunos').select('id,nome').eq('user_id', u.user!.id).single();
  if (error) throw error;
  return data as { id: string; nome: string };
}

export async function treinosDoAluno(alunoId: string): Promise<TreinoAluno[]> {
  const { data, error } = await supabase
    .from('treinos')
    .select('id,nome,ordem,treino_itens(id,series,reps,exercicios(id,nome,video_url))')
    .eq('aluno_id', alunoId)
    .order('ordem');
  if (error) throw error;
  return (data ?? []) as unknown as TreinoAluno[];
}

// Última carga registrada por exercício: { [exercicio_id]: kg }
export async function ultimasCargas(alunoId: string): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('cargas').select('exercicio_id,kg').eq('aluno_id', alunoId)
    .order('data', { ascending: false }).order('criado_em', { ascending: false });
  if (error) throw error;
  const mapa: Record<string, number> = {};
  for (const c of data ?? []) if (!(c.exercicio_id in mapa)) mapa[c.exercicio_id] = Number(c.kg);
  return mapa;
}

export async function registrarCarga(alunoId: string, exercicioId: string, kg: number) {
  const { error } = await supabase.from('cargas').insert({ aluno_id: alunoId, exercicio_id: exercicioId, kg });
  if (error) throw error;
}

// Sem vídeo próprio cadastrado, abre uma busca no YouTube como alternativa.
export const urlVideo = (nome: string, video?: string | null) =>
  video || `https://www.youtube.com/results?search_query=${encodeURIComponent(nome + ' execução correta')}`;
