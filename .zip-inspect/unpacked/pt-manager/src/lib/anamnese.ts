import { supabase } from './supabase';
import type { Pergunta } from './types';

export type RespostaItem = Pergunta & { r: string };
export const MODELO_PADRAO: Pergunta[] = [
  { q: 'Possui alguma lesão ou dor?', t: 'text' },
  { q: 'Já fez alguma cirurgia?', t: 'yn' },
  { q: 'Pratica atividade física atualmente?', t: 'yn' },
  { q: 'Usa algum medicamento?', t: 'text' },
  { q: 'Qual é o seu objetivo?', t: 'text' },
];

const uidAtual = async () => (await supabase.auth.getUser()).data.user!.id;

export async function carregarModelo(): Promise<Pergunta[]> {
  const { data, error } = await supabase.from('anamnese_modelos').select('perguntas').eq('professor_id', await uidAtual()).maybeSingle();
  if (error) throw error;
  return (data?.perguntas as Pergunta[]) ?? MODELO_PADRAO;
}

export async function salvarModelo(perguntas: Pergunta[]) {
  const { error } = await supabase.from('anamnese_modelos')
    .upsert({ professor_id: await uidAtual(), perguntas: perguntas.filter((p) => p.q.trim()) });
  if (error) throw error;
}

export async function criarConvite(alunoId: string): Promise<string> {
  const { data, error } = await supabase.from('convites')
    .insert({ professor_id: await uidAtual(), tipo: 'anamnese', aluno_id: alunoId }).select('token').single();
  if (error) throw error;
  return data.token as string;
}

// Última anamnese respondida pelo aluno (guarda a pergunta junto da resposta, então editar o modelo depois não bagunça o histórico).
export async function respostasDoAluno(alunoId: string): Promise<{ criado_em: string; respostas: RespostaItem[] } | null> {
  const { data, error } = await supabase.from('anamnese_respostas').select('criado_em,respostas')
    .eq('aluno_id', alunoId).order('criado_em', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data as any;
}

export async function obterAnamnese(token: string): Promise<Pergunta[]> {
  const { data, error } = await supabase.rpc('obter_anamnese', { p_token: token });
  if (error) throw error;
  return data as Pergunta[];
}

export async function responderAnamnese(token: string, respostas: RespostaItem[]) {
  const { error } = await supabase.rpc('responder_anamnese', { p_token: token, p_respostas: respostas });
  if (error) throw error;
}
