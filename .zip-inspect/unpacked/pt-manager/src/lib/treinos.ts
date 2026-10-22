import { supabase } from './supabase';
import type { Exercicio, Treino, TreinoItem } from './types';

export type TreinoDB = {
  id: string; nome: string; ordem: number;
  treino_itens: { id: string; series: number; reps: string; exercicios: { nome: string } | null }[];
};

export async function listarTreinos(alunoId: string): Promise<TreinoDB[]> {
  const { data, error } = await supabase
    .from('treinos')
    .select('id,nome,ordem,treino_itens(id,series,reps,exercicios(nome))')
    .eq('aluno_id', alunoId)
    .order('ordem');
  if (error) throw error;
  return (data ?? []) as unknown as TreinoDB[];
}

export async function salvarTreinos(alunoId: string, treinos: Treino[], ordemInicial: number) {
  for (const [i, t] of treinos.entries()) {
    const { data, error } = await supabase
      .from('treinos').insert({ aluno_id: alunoId, nome: t.nome, ordem: ordemInicial + i })
      .select('id').single();
    if (error) throw error;
    const itens = t.itens.map((x) => ({ treino_id: data.id, exercicio_id: x.exercicio_id, series: x.series, reps: x.reps }));
    if (itens.length) {
      const { error: e2 } = await supabase.from('treino_itens').insert(itens);
      if (e2) throw e2;
    }
  }
}

export async function excluirTreino(id: string) {
  const { error } = await supabase.from('treinos').delete().eq('id', id); // itens saem por cascade
  if (error) throw error;
}

export type ParamsIA = { objetivo: string; nivel: string; dias: number; foco: string };

// Chama a Edge Function (a chave da IA fica no servidor) e descarta exercícios que não existem na biblioteca.
export async function gerarComIA(p: ParamsIA, exercicios: Exercicio[]): Promise<Treino[]> {
  const { data, error } = await supabase.functions.invoke('gerar-treino', {
    body: { ...p, exercicios: exercicios.map(({ id, nome, grupo }) => ({ id, nome, grupo })) },
  });
  if (error) throw error;
  const validos = new Set(exercicios.map((e) => e.id));
  return (data.treinos as Treino[])
    .map((t) => ({ nome: t.nome, itens: t.itens.filter((x: TreinoItem) => validos.has(x.exercicio_id)) }))
    .filter((t) => t.itens.length > 0);
}
