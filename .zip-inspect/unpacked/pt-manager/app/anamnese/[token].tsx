import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { obterAnamnese, responderAnamnese } from '../../src/lib/anamnese';
import type { Pergunta } from '../../src/lib/types';

export default function AnamneseAluno() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const [perguntas, setPerguntas] = useState<Pergunta[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [r, setR] = useState<Record<number, string>>({});

  useEffect(() => {
    obterAnamnese(token).then(setPerguntas).catch((e) => setErro(e.message));
  }, [token]);

  const enviar = async () => {
    if (!perguntas) return;
    try {
      await responderAnamnese(token, perguntas.map((p, i) => ({ ...p, r: r[i] ?? (p.t === 'yn' ? 'Não' : '') })));
      Alert.alert('Ficha enviada!', 'Obrigado. Seu professor já pode ver suas respostas.');
      router.replace('/(aluno)/treinos');
    } catch (e: any) { Alert.alert('Erro', e.message); }
  };

  if (erro) return <View style={s.pad}><Text style={{ color: '#c00' }}>{erro}</Text></View>;
  if (!perguntas) return <View style={s.pad}><Text style={{ color: '#666' }}>Carregando…</Text></View>;

  return (
    <ScrollView contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">
      <Text style={s.h}>Ficha de anamnese</Text>
      {perguntas.map((p, i) => (
        <View key={i} style={{ marginBottom: 14 }}>
          <Text style={{ marginBottom: 4 }}>{p.q}</Text>
          {p.t === 'yn' ? (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {['Sim', 'Não'].map((o) => (
                <Pressable key={o} onPress={() => setR({ ...r, [i]: o })} style={[s.chip, (r[i] ?? 'Não') === o && s.chipOn]}>
                  <Text style={(r[i] ?? 'Não') === o ? { color: '#fff' } : undefined}>{o}</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <TextInput style={s.input} multiline value={r[i] ?? ''} onChangeText={(v) => setR({ ...r, [i]: v })} />
          )}
        </View>
      ))}
      <Pressable style={s.btn} onPress={enviar}><Text style={{ color: '#fff', fontWeight: '600' }}>Enviar ficha</Text></Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  pad: { padding: 16, paddingBottom: 60 },
  h: { fontSize: 20, fontWeight: '700', marginBottom: 14 },
  chip: { borderWidth: 1, borderColor: '#ccc', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8 },
  chipOn: { backgroundColor: '#303030', borderColor: '#303030' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, minHeight: 60, textAlignVertical: 'top' },
  btn: { backgroundColor: '#303030', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8 },
});
