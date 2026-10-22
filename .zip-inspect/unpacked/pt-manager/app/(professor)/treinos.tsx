import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../../src/lib/supabase';
import type { Aluno, Exercicio, TreinoItem } from '../../src/lib/types';
import { excluirTreino, gerarComIA, listarTreinos, salvarTreinos, type TreinoDB } from '../../src/lib/treinos';

const OBJETIVOS = ['Hipertrofia', 'Emagrecimento', 'Condicionamento'];
const NIVEIS = ['Iniciante', 'Intermediário', 'Avançado'];
const DIAS = [2, 3, 4, 5];
const FOCOS = ['Equilibrado', 'Inferiores'];

function Chips<T extends string | number>({ opcoes, valor, onChange, rotulo }: { opcoes: T[]; valor: T; onChange: (v: T) => void; rotulo?: (v: T) => string }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
      {opcoes.map((o) => (
        <Pressable key={String(o)} onPress={() => onChange(o)} style={[s.chip, o === valor && s.chipOn]}>
          <Text style={o === valor ? s.chipTxtOn : undefined}>{rotulo ? rotulo(o) : String(o)}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

export default function Treinos() {
  const [alunos, setAlunos] = useState<Pick<Aluno, 'id' | 'nome'>[]>([]);
  const [alunoId, setAlunoId] = useState<string | null>(null);
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [treinos, setTreinos] = useState<TreinoDB[]>([]);
  const [busy, setBusy] = useState(false);

  // IA
  const [ia, setIa] = useState({ objetivo: OBJETIVOS[0], nivel: NIVEIS[0], dias: 3, foco: FOCOS[0] });

  // Montador manual
  const [nome, setNome] = useState('');
  const [itens, setItens] = useState<TreinoItem[]>([]);
  const [grupo, setGrupo] = useState('');
  const [exId, setExId] = useState('');
  const [series, setSeries] = useState('3');
  const [reps, setReps] = useState('12');

  const grupos = useMemo(() => [...new Set(exercicios.map((e) => e.grupo))], [exercicios]);
  const doGrupo = useMemo(() => exercicios.filter((e) => e.grupo === grupo), [exercicios, grupo]);
  const nomeEx = (id: string) => exercicios.find((e) => e.id === id)?.nome ?? '?';

  useEffect(() => {
    supabase.from('alunos').select('id,nome').order('nome').then(({ data }) => {
      setAlunos(data ?? []);
      if (data?.length) setAlunoId(data[0].id);
    });
    supabase.from('exercicios').select('id,nome,grupo,video_url').order('nome').then(({ data }) => {
      const ex = (data as Exercicio[]) ?? [];
      setExercicios(ex);
      if (ex.length) { setGrupo(ex[0].grupo); setExId(ex.find((e) => e.grupo === ex[0].grupo)!.id); }
    });
  }, []);

  const recarregar = useCallback(async () => {
    if (alunoId) setTreinos(await listarTreinos(alunoId));
  }, [alunoId]);
  useEffect(() => { recarregar().catch((e) => Alert.alert('Erro', e.message)); }, [recarregar]);

  const executar = async (fn: () => Promise<void>) => {
    setBusy(true);
    try { await fn(); await recarregar(); } catch (e: any) { Alert.alert('Erro', e.message ?? String(e)); }
    setBusy(false);
  };

  const gerar = () => executar(async () => {
    if (!alunoId) return;
    const gerados = await gerarComIA(ia, exercicios);
    if (!gerados.length) throw new Error('A IA não retornou treinos válidos. Tente novamente.');
    await salvarTreinos(alunoId, gerados, treinos.length);
  });

  const addItem = () => {
    if (!exId) return;
    setItens([...itens, { exercicio_id: exId, series: parseInt(series, 10) || 3, reps: reps || '12' }]);
  };

  const salvarManual = () => executar(async () => {
    if (!alunoId || !itens.length) return;
    await salvarTreinos(alunoId, [{ nome: nome.trim() || 'Treino', itens }], treinos.length);
    setNome(''); setItens([]);
  });

  if (!alunos.length) return <View style={s.pad}><Text>Cadastre um aluno primeiro (aba Alunos).</Text></View>;

  return (
    <ScrollView contentContainerStyle={s.pad}>
      <Text style={s.lbl}>Aluno</Text>
      <Chips opcoes={alunos.map((a) => a.id)} valor={alunoId ?? ''} onChange={setAlunoId} rotulo={(id) => alunos.find((a) => a.id === id)?.nome ?? ''} />
      {busy && <ActivityIndicator style={{ marginVertical: 8 }} />}

      <View style={s.card}>
        <Text style={s.h}>✨ Gerar treino com IA</Text>
        <Text style={s.lbl}>Objetivo</Text><Chips opcoes={OBJETIVOS} valor={ia.objetivo} onChange={(objetivo) => setIa({ ...ia, objetivo })} />
        <Text style={s.lbl}>Nível</Text><Chips opcoes={NIVEIS} valor={ia.nivel} onChange={(nivel) => setIa({ ...ia, nivel })} />
        <Text style={s.lbl}>Dias por semana</Text><Chips opcoes={DIAS} valor={ia.dias} onChange={(dias) => setIa({ ...ia, dias })} />
        <Text style={s.lbl}>Foco</Text><Chips opcoes={FOCOS} valor={ia.foco} onChange={(foco) => setIa({ ...ia, foco })} />
        <Pressable style={s.btn} onPress={gerar} disabled={busy}><Text style={s.btnTxt}>Gerar treinos</Text></Pressable>
      </View>

      <View style={s.card}>
        <Text style={s.h}>Montar treino manual</Text>
        <TextInput style={s.input} placeholder="Nome (ex.: Treino A - Inferiores)" value={nome} onChangeText={setNome} />
        <Text style={s.lbl}>Grupo</Text>
        <Chips opcoes={grupos} valor={grupo} onChange={(g) => { setGrupo(g); setExId(exercicios.find((e) => e.grupo === g)?.id ?? ''); }} />
        <Text style={s.lbl}>Exercício</Text>
        <Chips opcoes={doGrupo.map((e) => e.id)} valor={exId} onChange={setExId} rotulo={nomeEx} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput style={[s.input, { flex: 1 }]} keyboardType="number-pad" placeholder="Séries" value={series} onChangeText={setSeries} />
          <TextInput style={[s.input, { flex: 1 }]} placeholder="Reps (ex.: 8-12)" value={reps} onChangeText={setReps} />
        </View>
        <Pressable style={[s.btn, s.ghost]} onPress={addItem}><Text>+ Adicionar exercício</Text></Pressable>
        {itens.map((x, i) => (
          <View key={i} style={s.row}>
            <Text>{nomeEx(x.exercicio_id)} · {x.series}x{x.reps}</Text>
            <Pressable onPress={() => setItens(itens.filter((_, j) => j !== i))}><Text>✕</Text></Pressable>
          </View>
        ))}
        {itens.length > 0 && <Pressable style={s.btn} onPress={salvarManual} disabled={busy}><Text style={s.btnTxt}>Salvar treino</Text></Pressable>}
      </View>

      <View style={s.card}>
        <Text style={s.h}>Treinos do aluno</Text>
        {treinos.length === 0 && <Text style={{ color: '#666' }}>Sem treinos.</Text>}
        {treinos.map((t) => (
          <View key={t.id} style={{ marginBottom: 12 }}>
            <View style={s.row}>
              <Text style={{ fontWeight: '700', flex: 1 }}>{t.nome}</Text>
              <Pressable onPress={() => executar(() => excluirTreino(t.id))}><Text style={{ color: '#c00' }}>Excluir</Text></Pressable>
            </View>
            {t.treino_itens.map((x) => (
              <Text key={x.id} style={{ color: '#666' }}>{x.exercicios?.nome} · {x.series}x{x.reps}</Text>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  pad: { padding: 16, paddingBottom: 60 },
  card: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 12, marginTop: 12 },
  h: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  lbl: { fontSize: 12, color: '#666', marginTop: 6 },
  chip: { borderWidth: 1, borderColor: '#ccc', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 6 },
  chipOn: { backgroundColor: '#303030', borderColor: '#303030' },
  chipTxtOn: { color: '#fff' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginTop: 6 },
  btn: { backgroundColor: '#303030', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 10 },
  ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#ccc' },
  btnTxt: { color: '#fff', fontWeight: '600' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
});
