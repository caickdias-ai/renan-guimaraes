import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { NIVEIS, feedbacksDoAluno, type FeedbackDB } from '../lib/feedback';

// Lista de feedbacks de um aluno. `versao` muda para forçar recarregar (ex.: após enviar um novo).
export default function FeedbackLista({ alunoId, versao = 0 }: { alunoId: string; versao?: number }) {
  const [lista, setLista] = useState<FeedbackDB[]>([]);
  useEffect(() => { feedbacksDoAluno(alunoId).then(setLista).catch(() => setLista([])); }, [alunoId, versao]);

  if (!lista.length) return <Text style={{ color: '#666' }}>Nenhum feedback ainda.</Text>;
  return (
    <View>
      {lista.map((f) => (
        <View key={f.id} style={{ paddingVertical: 8, borderTopWidth: 1, borderColor: '#eee' }}>
          <Text style={{ fontWeight: '600' }}>{f.treinos?.nome ?? 'Treino'} · {NIVEIS[f.nivel - 1]} ({f.nivel}/5)</Text>
          {!!f.mensagem && <Text style={{ color: '#444', marginTop: 2 }}>{f.mensagem}</Text>}
          <Text style={{ color: '#888', fontSize: 11, marginTop: 2 }}>{new Date(f.criado_em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</Text>
        </View>
      ))}
    </View>
  );
}
