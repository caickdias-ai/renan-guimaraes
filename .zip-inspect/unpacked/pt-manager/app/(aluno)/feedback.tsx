import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import FeedbackLista from '../../src/components/FeedbackLista';
import { meuAluno, treinosDoAluno } from '../../src/lib/aluno';
import { NIVEIS, enviarFeedback } from '../../src/lib/feedback';

export default function FeedbackAluno() {
  const [alunoId, setAlunoId] = useState<string | null>(null);
  const [treinos, setTreinos] = useState<{ id: string; nome: string }[]>([]);
  const [treinoId, setTreinoId] = useState('');
  const [nivel, setNivel] = useState(3);
  const [msg, setMsg] = useState('');
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const a = await meuAluno();
        setAlunoId(a.id);
        const t = await treinosDoAluno(a.id);
        setTreinos(t);
        if (t.length) setTreinoId(t[0].id);
      } catch (e: any) { Alert.alert('Erro', e.message); }
    })();
  }, []);

  const enviar = async () => {
    if (!alunoId || !treinoId) return;
    try {
      await enviarFeedback(alunoId, treinoId, nivel, msg);
      setMsg(''); setNivel(3); setVersao((v) => v + 1);
      Alert.alert('Feedback enviado!', 'Seu professor vai ver.');
    } catch (e: any) { Alert.alert('Erro', e.message); }
  };

  if (!alunoId) return <View style={s.pad}><Text style={{ color: '#666' }}>Carregando…</Text></View>;

  return (
    <ScrollView contentContainerStyle={s.pad}>
      <View style={s.card}>
        <Text style={s.h}>Como foi o treino?</Text>
        {treinos.length === 0 ? <Text style={{ color: '#666' }}>Você ainda não tem treinos.</Text> : (
          <>
            <Text style={s.lbl}>Treino</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {treinos.map((t) => (
                <Pressable key={t.id} onPress={() => setTreinoId(t.id)} style={[s.chip, t.id === treinoId && s.chipOn]}>
                  <Text style={t.id === treinoId ? { color: '#fff' } : undefined}>{t.nome}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text style={s.lbl}>Dificuldade</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {NIVEIS.map((n, i) => (
                <Pressable key={n} onPress={() => setNivel(i + 1)} style={[s.nivel, nivel === i + 1 && s.chipOn]}>
                  <Text style={[{ fontWeight: '700' }, nivel === i + 1 && { color: '#fff' }]}>{i + 1}</Text>
                  <Text style={[{ fontSize: 9 }, nivel === i + 1 && { color: '#fff' }]}>{n}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput style={s.input} multiline placeholder="Mensagem para o professor (opcional)" value={msg} onChangeText={setMsg} />
            <Pressable style={s.btn} onPress={enviar}><Text style={{ color: '#fff', fontWeight: '600' }}>Enviar feedback</Text></Pressable>
          </>
        )}
      </View>
      <View style={s.card}>
        <Text style={s.h}>Seus feedbacks</Text>
        <FeedbackLista alunoId={alunoId} versao={versao} />
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  pad: { padding: 16, paddingBottom: 60 },
  card: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 12, marginBottom: 12 },
  h: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  lbl: { fontSize: 12, color: '#666', marginTop: 8, marginBottom: 4 },
  chip: { borderWidth: 1, borderColor: '#ccc', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 6 },
  chipOn: { backgroundColor: '#303030', borderColor: '#303030' },
  nivel: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginTop: 10, minHeight: 70, textAlignVertical: 'top' },
  btn: { backgroundColor: '#303030', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 10 },
});
