import { supabase } from './supabase';

export type Msg = { id: string; aluno_id: string; de: 'professor' | 'aluno'; texto: string; criado_em: string };

export async function listarMensagens(alunoId: string): Promise<Msg[]> {
  const { data, error } = await supabase
    .from('mensagens').select('*').eq('aluno_id', alunoId).order('criado_em', { ascending: true }).limit(200);
  if (error) throw error;
  return (data ?? []) as Msg[];
}

export async function enviarMensagem(alunoId: string, de: Msg['de'], texto: string): Promise<Msg> {
  const { data, error } = await supabase.from('mensagens').insert({ aluno_id: alunoId, de, texto }).select().single();
  if (error) throw error;
  return data as Msg;
}

// Recebe novas mensagens da conversa em tempo real. Retorna a função para parar de ouvir.
export function assinarMensagens(alunoId: string, aoReceber: (m: Msg) => void) {
  const canal = supabase
    .channel('mensagens-' + alunoId)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens', filter: `aluno_id=eq.${alunoId}` },
      (p) => aoReceber(p.new as Msg))
    .subscribe();
  return () => { supabase.removeChannel(canal); };
}
