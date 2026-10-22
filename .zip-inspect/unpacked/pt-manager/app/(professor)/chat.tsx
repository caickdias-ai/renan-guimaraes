import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import ChatView from '../../src/components/ChatView';
import FeedbackLista from '../../src/components/FeedbackLista';
import { supabase } from '../../src/lib/supabase';

export default function ChatProfessor() {
  const [alunos, setAlunos] = useState<{ id: string; nome: string }[]>([]);
  const [alunoId, setAlunoId] = useState<string | null>(null);
  const [aba, setAba] = useState<'conversa' | 'feedbacks'>('conversa');

  useEffect(() => {
    supabase.from('alunos').select('id,nome').order('nome').then(({ data }) => {
      setAlunos(data ?? []);
      if (data?.length) setAlunoId(data[0].id);
    });
  }, []);

  if (!alunos.length) return <View style={{ padding: 16 }}><Text style={{ color: '#666' }}>Cadastre um aluno primeiro (aba Alunos).</Text></View>;

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 12, paddingBottom: 4 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {alunos.map((a) => (
            <Pressable key={a.id} onPress={() => setAlunoId(a.id)} style={[s.chip, a.id === alunoId && s.chipOn]}>
              <Text style={a.id === alunoId ? { color: '#fff' } : undefined}>{a.nome}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          {(['conversa', 'feedbacks'] as const).map((x) => (
            <Pressable key={x} onPress={() => setAba(x)} style={[s.aba, aba === x && s.abaOn]}>
              <Text style={{ fontWeight: aba === x ? '700' : '400' }}>{x === 'conversa' ? 'Conversa' : 'Feedbacks'}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      {alunoId && (aba === 'conversa'
        ? <ChatView alunoId={alunoId} eu="professor" />
        : <ScrollView contentContainerStyle={{ padding: 16 }}><FeedbackLista alunoId={alunoId} /></ScrollView>)}
    </View>
  );
}

const s = StyleSheet.create({
  chip: { borderWidth: 1, borderColor: '#ccc', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 6 },
  chipOn: { backgroundColor: '#303030', borderColor: '#303030' },
  aba: { flex: 1, alignItems: 'center', paddingVertical: 8, borderBottomWidth: 2, borderColor: 'transparent' },
  abaOn: { borderColor: '#303030' },
});
