import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import LineChart from '../../src/components/LineChart';
import { meuAluno } from '../../src/lib/aluno';
import { TIPOS, exerciciosComCarga, registrarMedida, serieCarga, serieMedida, unidade, type Ponto, type Tipo } from '../../src/lib/progresso';

type Opcao = { chave: string; rotulo: string };
const fmt = (d: string) => d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4);

export default function Progresso() {
  const [alunoId, setAlunoId] = useState<string | null>(null);
  const [opcoes, setOpcoes] = useState<Opcao[]>(TIPOS.map((t) => ({ chave: 'm:' + t, rotulo: t[0].toUpperCase() + t.slice(1) })));
  const [chave, setChave] = useState('m:peso');
  const [pontos, setPontos] = useState<Ponto[]>([]);
  const [valor, setValor] = useState('');

  const carregarSerie = useCallback(async (id: string, k: string) => {
    try {
      setPontos(k.startsWith('m:') ? await serieMedida(id, k.slice(2) as Tipo) : await serieCarga(id, k.slice(2)));
    } catch (e: any) { Alert.alert('Erro', e.message); }
  }, []);

  // Recarrega ao voltar para a aba (assim aparecem as cargas registradas em "Treinos").
  useFocusEffect(useCallback(() => {
    (async () => {
      try {
        const a = await meuAluno();
        setAlunoId(a.id);
        const ex = await exerciciosComCarga(a.id);
        setOpcoes([
          ...TIPOS.map((t) => ({ chave: 'm:' + t, rotulo: t[0].toUpperCase() + t.slice(1) })),
          ...ex.map((e) => ({ chave: 'c:' + e.id, rotulo: 'Carga · ' + e.nome })),
        ]);
        await carregarSerie(a.id, chave);
      } catch (e: any) { Alert.alert('Erro', e.message); }
    })();
  }, [chave, carregarSerie]));

  const escolher = (k: string) => { setChave(k); if (alunoId) carregarSerie(alunoId, k); };

  const eMedida = chave.startsWith('m:');
  const un = eMedida ? unidade(chave.slice(2)) : 'kg';
  const registrar = async () => {
    const v = parseFloat(valor.replace(',', '.'));
    if (!alunoId || !v || v <= 0) return Alert.alert('Informe um valor válido');
    try {
      await registrarMedida(alunoId, chave.slice(2) as Tipo, v);
      setValor('');
      await carregarSerie(alunoId, chave);
    } catch (e: any) { Alert.alert('Erro', e.message); }
  };

  const primeiro = pontos[0], ultimo = pontos[pontos.length - 1];
  const dif = pontos.length > 1 ? Math.round((ultimo.v - primeiro.v) * 10) / 10 : null;

  return (
    <ScrollView contentContainerStyle={s.pad}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {opcoes.map((o) => (
          <Pressable key={o.chave} onPress={() => escolher(o.chave)} style={[s.chip, o.chave === chave && s.chipOn]}>
            <Text style={o.chave === chave ? { color: '#fff' } : undefined}>{o.rotulo}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={s.card}>
        <LineChart pontos={pontos} />
        {dif !== null && (
          <Text style={s.resumo}>
            {primeiro.v} → {ultimo.v} {un} ({dif > 0 ? '+' : ''}{dif} {un} desde {fmt(primeiro.d)})
          </Text>
        )}
      </View>

      <View style={s.card}>
        <Text style={s.h}>Registrar</Text>
        {eMedida ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput style={s.input} keyboardType="decimal-pad" placeholder={`Valor (${un})`} value={valor} onChangeText={setValor} />
            <Pressable style={s.btn} onPress={registrar}><Text style={{ color: '#fff', fontWeight: '600' }}>Salvar</Text></Pressable>
          </View>
        ) : (
          <Text style={{ color: '#666' }}>As cargas são registradas na aba Treinos, ao lado de cada exercício.</Text>
        )}
      </View>

      <View style={s.card}>
        <Text style={s.h}>Histórico</Text>
        {pontos.length === 0 && <Text style={{ color: '#666' }}>Nenhum registro.</Text>}
        {[...pontos].reverse().slice(0, 10).map((p, i) => (
          <View key={i} style={s.linha}><Text style={{ color: '#666' }}>{fmt(p.d)}</Text><Text style={{ fontWeight: '600' }}>{p.v} {un}</Text></View>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  pad: { padding: 16, paddingBottom: 60 },
  card: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 12, marginTop: 12 },
  h: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  chip: { borderWidth: 1, borderColor: '#ccc', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 6 },
  chipOn: { backgroundColor: '#303030', borderColor: '#303030' },
  resumo: { textAlign: 'center', marginTop: 6, fontWeight: '600' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 },
  btn: { backgroundColor: '#303030', borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center' },
  linha: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 1, borderColor: '#eee' },
});
