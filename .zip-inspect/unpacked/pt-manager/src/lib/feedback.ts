import { supabase } from './supabase';

export const NIVEIS = ['Muito fácil', 'Fácil', 'Ok', 'Difícil', 'Muito difícil'];
export type FeedbackDB = { id: string; nivel: number; mensagem: string | null; criado_em: string; treinos: { nome: string } | null };

export async function enviarFeedback(alunoId: string, treinoId: string, nivel: number, mensagem: string) {
  const { error } = await supabase.from('feedbacks').insert({ aluno_id: alunoId, treino_id: treinoId, nivel, mensagem: mensagem.trim() || null });
  if (error) throw error;
}

export async function feedbacksDoAluno(alunoId: string): Promise<FeedbackDB[]> {
  const { data, error } = await supabase
    .from('feedbacks').select('id,nivel,mensagem,criado_em,treinos(nome)')
    .eq('aluno_id', alunoId).order('criado_em', { ascending: false }).limit(30);
  if (error) throw error;
  return (data ?? []) as unknown as FeedbackDB[];
}
