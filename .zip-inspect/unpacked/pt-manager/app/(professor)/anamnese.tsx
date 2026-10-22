import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Linking from 'expo-linking';
import { MODELO_PADRAO, carregarModelo, criarConvite, respostasDoAluno, salvarModelo, type RespostaItem } from '../../src/lib/anamnese';
import { supabase } from '../../src/lib/supabase';
import type { Pergunta } from '../../src/lib/types';

export default function AnamneseProfessor() {
  const [perguntas, setPerguntas] = useState<Pergunta[]>(MODELO_PADRAO);
  const [alunos, setAlunos] = useState<{ id: string; nome: string }[]>([]);
  const [alunoId, setAlunoId] = useState<string | null>(null);
  const [resp, setResp] = useState<{ criado_em: string; respostas: RespostaItem[] } | null>(null);

  useEffect(() => {
    carregarModelo().then(setPerguntas).catch((e) => Alert.alert('Erro', e.message));
    supabase.from('alunos').select('id,nome').order('nome').then(({ data }) => {
      setAlunos(data ?? []);
      if (data?.length) setAlunoId(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (alunoId) respostasDoAluno(alunoId).then(setResp).catch(() => setResp(null));
  }, [alunoId]);

  const editar = (i: number, p: Partial<Pergunta>) => setPerguntas(perguntas.map((x, j) => (j === i ? { ...x, ...p } : x)));

  const salvar = async () => {
    try { await salvarModelo(perguntas); Alert.alert('Ficha salva'); } catch (e: any) { Alert.alert('Erro', e.message); }
  };

  const enviar = async () => {
    if (!alunoId) return;
    try {
      await salvarModelo(perguntas); // garante que o aluno receba a versão atual da ficha
      const token = await criarConvite(alunoId);
      await Share.share({ message: `Preencha sua ficha de anamnese: ${Linking.createURL('/anamnese/' + token)}` });
    } catch (e: any) { Alert.alert('Erro', e.message); }
  };

  return (
    <ScrollView contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">
      <View style={s.card}>
        <Text style={s.h}>Ficha de anamnese</Text>
        {perguntas.map((p, i) => (
          <View key={i} style={{ marginBottom: 10 }}>
            <TextInput style={s.input} value={p.q} placeholder="Pergunta" onChangeText={(q) => editar(i, { q })} />
            <View style={s.row}>
              {(['text', 'yn'] as const).map((t) => (
                <Pressable key={t} onPress={() => editar(i, { t })} style={[s.chip, p.t === t && s.chipOn]}>
                  <Text style={p.t === t ? { color: '#fff' } : undefined}>{t === 'text' ? 'Texto' : 'Sim/Não'}</Text>
                </Pressable>
              ))}
              <Pressable onPress={() => setPerguntas(perguntas.filter((_, j) => j !== i))} style={{ marginLeft: 'auto' }}>
                <Text style={{ color: '#c00' }}>Remover</Text>
              </Pressable>
            </View>
          </View>
        ))}
        <Pressable style={[s.btn, s.ghost]} onPress={() => setPerguntas([...perguntas, { q: '', t: 'text' }])}><Text>+ Pergunta</Text></Pressable>
        <Pressable style={s.btn} onPress={salvar}><Text style={s.btnTxt}>Salvar ficha</Text></Pressable>
      </View>

      <View style={s.card}>
        <Text style={s.h}>Enviar ao aluno</Text>
        {!alunos.length ? <Text style={{ color: '#666' }}>Cadastre um aluno primeiro (aba Alunos).</Text> : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {alunos.map((a) => (
                <Pressable key={a.id} onPress={() => setAlunoId(a.id)} style={[s.chip, a.id === alunoId && s.chipOn]}>
                  <Text style={a.id === alunoId ? { color: '#fff' } : undefined}>{a.nome}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable style={s.btn} onPress={enviar}><Text style={s.btnTxt}>Enviar link da ficha</Text></Pressable>
          </>
        )}
      </View>

      {alunoId && (
        <View style={s.card}>
          <Text style={s.h}>Respostas do aluno</Text>
          {!resp ? <Text style={{ color: '#666' }}>Ainda não respondida.</Text> : (
            <>
              <Text style={{ color: '#888', fontSize: 11, marginBottom: 6 }}>Respondida em {new Date(resp.criado_em).toLocaleDateString('pt-BR')}</Text>
              {resp.respostas.map((r, i) => (
                <View key={i} style={{ paddingVertical: 6, borderTopWidth: 1, borderColor: '#eee' }}>
                  <Text style={{ color: '#666' }}>{r.q}</Text>
                  <Text style={{ fontWeight: '600' }}>{r.r || '—'}</Text>
                </View>
              ))}
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  pad: { padding: 16, paddingBottom: 60 },
  card: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 12, marginBottom: 12 },
  h: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  chip: { borderWidth: 1, borderColor: '#ccc', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 6 },
  chipOn: { backgroundColor: '#303030', borderColor: '#303030' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 },
  btn: { backgroundColor: '#303030', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 10 },
  ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#ccc' },
  btnTxt: { color: '#fff', fontWeight: '600' },
});
