import { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import ChatView from '../../src/components/ChatView';
import { meuAluno } from '../../src/lib/aluno';

export default function ChatAluno() {
  const [alunoId, setAlunoId] = useState<string | null>(null);
  useEffect(() => { meuAluno().then((a) => setAlunoId(a.id)).catch((e) => Alert.alert('Erro', e.message)); }, []);
  if (!alunoId) return <View style={{ padding: 16 }}><Text style={{ color: '#666' }}>Carregando…</Text></View>;
  return <ChatView alunoId={alunoId} eu="aluno" />;
}
