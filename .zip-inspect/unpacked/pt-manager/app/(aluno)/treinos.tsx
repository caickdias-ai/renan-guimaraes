import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { meuAluno, registrarCarga, treinosDoAluno, ultimasCargas, urlVideo, type TreinoAluno } from '../../src/lib/aluno';

export default function MeusTreinos() {
  const [alunoId, setAlunoId] = useState<string | null>(null);
  const [treinos, setTreinos] = useState<TreinoAluno[]>([]);
  const [cargas, setCargas] = useState<Record<string, number>>({});
  const [aberto, setAberto] = useState<string | null>(null);
  const [kg, setKg] = useState<Record<string, string>>({}); // valor digitado por item
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      const a = await meuAluno();
      setAlunoId(a.id);
      const [t, c] = await Promise.all([treinosDoAluno(a.id), ultimasCargas(a.id)]);
      setTreinos(t); setCargas(c); setErro(null);
      setAberto((atual) => atual ?? t[0]?.id ?? null);
    } catch (e: any) {
      setErro(e.message ?? 'Não foi possível carregar seus treinos.');
    }
    setCarregando(false);
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  const registrar = async (itemId: string, exercicioId: string) => {
    const valor = parseFloat((kg[itemId] ?? '').replace(',', '.'));
    if (!alunoId || !valor || valor <= 0) return Alert.alert('Informe a carga em kg');
    try {
      await registrarCarga(alunoId, exercicioId, valor);
      setCargas((c) => ({ ...c, [exercicioId]: valor }));
      setKg((k) => ({ ...k, [itemId]: '' }));
    } catch (e: any) { Alert.alert('Erro', e.message); }
  };

  return (
    <ScrollView contentContainerStyle={s.pad} refreshControl={<RefreshControl refreshing={carregando} onRefresh={carregar} />}>
      {erro && <Text style={{ color: '#c00' }}>{erro}</Text>}
      {!carregando && !erro && treinos.length === 0 && <Text style={{ color: '#666' }}>Seu professor ainda não montou seu treino.</Text>}

      {treinos.map((t) => (
        <View key={t.id} style={s.card}>
          <Pressable onPress={() => setAberto(aberto === t.id ? null : t.id)} style={s.head}>
            <Text style={s.h}>{t.nome}</Text>
            <Text>{aberto === t.id ? '▲' : '▼'}</Text>
          </Pressable>

          {aberto === t.id && t.treino_itens.map((x) => (
            <View key={x.id} style={s.item}>
              <View style={s.row}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '600' }}>{x.exercicios.nome}</Text>
                  <Text style={s.mut}>
                    {x.series}x{x.reps}{cargas[x.exercicios.id] ? ` · última carga ${cargas[x.exercicios.id]} kg` : ''}
                  </Text>
                </View>
                <Pressable onPress={() => Linking.openURL(urlVideo(x.exercicios.nome, x.exercicios.video_url))}>
                  <Text style={s.link}>▶ Vídeo</Text>
                </Pressable>
              </View>
              <View style={s.row}>
                <TextInput
                  style={s.input} keyboardType="decimal-pad" placeholder="Carga (kg)"
                  value={kg[x.id] ?? ''} onChangeText={(v) => setKg((k) => ({ ...k, [x.id]: v }))}
                />
                <Pressable style={s.btn} onPress={() => registrar(x.id, x.exercicios.id)}>
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Registrar</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  pad: { padding: 16, paddingBottom: 60 },
  card: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 12, marginBottom: 12 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  h: { fontSize: 16, fontWeight: '700', flex: 1 },
  item: { borderTopWidth: 1, borderColor: '#eee', paddingVertical: 10, gap: 8, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mut: { color: '#666', fontSize: 12 },
  link: { color: '#303030', fontWeight: '600' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8 },
  btn: { backgroundColor: '#303030', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14 },
});
