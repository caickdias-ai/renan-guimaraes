export type Role = 'professor' | 'aluno';
export type Aluno = { id: string; nome: string; telefone?: string; nascimento?: string; objetivo?: string; plano_id?: string | null };
export type Exercicio = { id: string; nome: string; grupo: string; video_url?: string | null };
export type TreinoItem = { exercicio_id: string; series: number; reps: string };
export type Treino = { id?: string; nome: string; itens: TreinoItem[] };
export type Pergunta = { q: string; t: 'text' | 'yn' };
