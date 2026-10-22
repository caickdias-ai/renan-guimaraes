import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { meuAluno } from '../../src/lib/aluno';
import { obterDieta, type Refeicao } from '../../src/lib/dieta';

export default function DietaAluno() {
  const [dieta, setDieta] = useState<Refeicao[] | null | undefined>(undefined); // undefined = carregando
  useEffect(() => {
    (async () => {
      try { setDieta(await obterDieta((await meuAluno()).id)); } catch (e: any) { Alert.alert('Erro', e.message); setDieta(null); }
    })();
  }, []);

  if (dieta === undefined) return <View style={s.pad}><Text style={{ color: '#666' }}>Carregando…</Text></View>;
  if (!dieta?.length) return <View style={s.pad}><Text style={{ color: '#666' }}>Seu professor ainda não montou sua dieta.</Text></View>;
  return (
    <ScrollView contentContainerStyle={s.pad}>
      {dieta.map((r, i) => (
        <View key={i} style={s.card}>
          <Text style={s.h}>{r.nome}</Text>
          <Text>{r.texto || '—'}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  pad: { padding: 16, paddingBottom: 60 },
  card: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 12, marginBottom: 12 },
  h: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
});
