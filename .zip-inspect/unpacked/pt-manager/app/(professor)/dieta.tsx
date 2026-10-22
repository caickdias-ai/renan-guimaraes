import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { REFEICOES_PADRAO, obterDieta, salvarDieta, type Refeicao } from '../../src/lib/dieta';
import { supabase } from '../../src/lib/supabase';

export default function DietaProfessor() {
  const [alunos, setAlunos] = useState<{ id: string; nome: string }[]>([]);
  const [alunoId, setAlunoId] = useState<string | null>(null);
  const [refeicoes, setRefeicoes] = useState<Refeicao[]>(REFEICOES_PADRAO);
  const [nova, setNova] = useState('');

  useEffect(() => {
    supabase.from('alunos').select('id,nome').order('nome').then(({ data }) => {
      setAlunos(data ?? []);
      if (data?.length) setAlunoId(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!alunoId) return;
    obterDieta(alunoId).then((d) => setRefeicoes(d ?? REFEICOES_PADRAO)).catch((e) => Alert.alert('Erro', e.message));
  }, [alunoId]);

  const editar = (i: number, campo: keyof Refeicao, v: string) => setRefeicoes(refeicoes.map((r, j) => (j === i ? { ...r, [campo]: v } : r)));
  const adicionar = () => { if (nova.trim()) { setRefeicoes([...refeicoes, { nome: nova.trim(), texto: '' }]); setNova(''); } };
  const salvar = async () => {
    if (!alunoId) return;
    try { await salvarDieta(alunoId, refeicoes); Alert.alert('Dieta salva'); } catch (e: any) { Alert.alert('Erro', e.message); }
  };

  if (!alunos.length) return <View style={s.pad}><Text style={{ color: '#666' }}>Cadastre um aluno primeiro (aba Alunos).</Text></View>;

  return (
    <ScrollView contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {alunos.map((a) => (
          <Pressable key={a.id} onPress={() => setAlunoId(a.id)} style={[s.chip, a.id === alunoId && s.chipOn]}>
            <Text style={a.id === alunoId ? { color: '#fff' } : undefined}>{a.nome}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={s.card}>
        <Text style={s.h}>Dieta</Text>
        {refeicoes.map((r, i) => (
          <View key={i} style={{ marginBottom: 10 }}>
            <View style={s.row}>
              <TextInput style={[s.nome, { flex: 1 }]} value={r.nome} onChangeText={(v) => editar(i, 'nome', v)} />
              <Pressable onPress={() => setRefeicoes(refeicoes.filter((_, j) => j !== i))}><Text style={{ color: '#c00' }}>Remover</Text></Pressable>
            </View>
            <TextInput style={s.input} multiline placeholder="Alimentos, quantidades, horários…" value={r.texto} onChangeText={(v) => editar(i, 'texto', v)} />
          </View>
        ))}
        <View style={s.row}>
          <TextInput style={[s.input, { flex: 1, minHeight: 0 }]} placeholder="Nova refeição (ex.: Ceia)" value={nova} onChangeText={setNova} />
          <Pressable style={[s.btn, { marginTop: 0 }]} onPress={adicionar}><Text style={{ color: '#fff' }}>+</Text></Pressable>
        </View>
        <Pressable style={s.btn} onPress={salvar}><Text style={{ color: '#fff', fontWeight: '600' }}>Salvar dieta</Text></Pressable>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  pad: { padding: 16, paddingBottom: 60 },
  card: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 12, marginTop: 12 },
  h: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chip: { borderWidth: 1, borderColor: '#ccc', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 6 },
  chipOn: { backgroundColor: '#303030', borderColor: '#303030' },
  nome: { fontWeight: '700', fontSize: 15, paddingVertical: 4 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, minHeight: 70, textAlignVertical: 'top', marginTop: 4 },
  btn: { backgroundColor: '#303030', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 10 },
});
