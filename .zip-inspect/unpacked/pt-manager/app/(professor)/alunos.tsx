import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, RefreshControl, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '../../src/lib/supabase';
import type { Aluno } from '../../src/lib/types';

type Perfil = Aluno & { criado_em?: string };
const BRAND = '#303030';

export default function Alunos() {
  const [lista, setLista] = useState<Perfil[]>([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [modal, setModal] = useState<'novo' | 'editar' | null>(null);
  const [selecionado, setSelecionado] = useState<Perfil | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({ nome: '', telefone: '', objetivo: '' });

  const carregar = useCallback(async (refresh = false) => {
    refresh ? setAtualizando(true) : setCarregando(true);
    const { data, error } = await supabase.from('alunos').select('*').order('nome');
    if (error) Alert.alert('Não foi possível carregar os alunos', error.message);
    else setLista((data as Perfil[]) ?? []);
    setCarregando(false); setAtualizando(false);
  }, []);
  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  const filtrados = useMemo(() => {
    const q = busca.trim().toLocaleLowerCase('pt-BR');
    return lista.filter((a) => !q || `${a.nome} ${a.telefone ?? ''} ${a.objetivo ?? ''}`.toLocaleLowerCase('pt-BR').includes(q));
  }, [lista, busca]);

  const abrirNovo = () => { setSelecionado(null); setForm({ nome: '', telefone: '', objetivo: '' }); setModal('novo'); };
  const abrirEdicao = (aluno: Perfil) => { setSelecionado(aluno); setForm({ nome: aluno.nome, telefone: aluno.telefone ?? '', objetivo: aluno.objetivo ?? '' }); setModal('editar'); };
  const salvar = async () => {
    if (!form.nome.trim()) return Alert.alert('Campo obrigatório', 'Informe o nome do aluno.');
    setSalvando(true);
    const user = await supabase.auth.getUser();
    if (user.error || !user.data.user) { setSalvando(false); return Alert.alert('Sessão expirada', 'Entre novamente para continuar.'); }
    const patch = { nome: form.nome.trim(), telefone: form.telefone.trim() || null, objetivo: form.objetivo.trim() || null };
    const result = modal === 'novo'
      ? await supabase.from('alunos').insert({ ...patch, professor_id: user.data.user.id }).select().single()
      : await supabase.from('alunos').update(patch).eq('id', selecionado!.id).select().single();
    setSalvando(false);
    if (result.error) return Alert.alert('Não foi possível salvar', result.error.message);
    setModal(null); setSelecionado(null); await carregar();
  };
  const convidar = async () => {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) return Alert.alert('Sessão expirada', 'Entre novamente para continuar.');
    const { data, error } = await supabase.from('convites').insert({ professor_id: auth.user.id, tipo: 'cadastro' }).select('token').single();
    if (error || !data) return Alert.alert('Erro ao criar convite', error?.message ?? 'Tente novamente.');
    const url = Linking.createURL(`/cadastro/${data.token}`);
    await Share.share({ message: `Olá! Preencha seu cadastro no PT Manager: ${url}` });
  };
  const remover = (aluno: Perfil) => Alert.alert('Remover aluno?', `O cadastro de ${aluno.nome} será excluído. Os dados relacionados também serão removidos.`, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Remover', style: 'destructive', onPress: async () => {
      const { error } = await supabase.from('alunos').delete().eq('id', aluno.id);
      if (error) Alert.alert('Erro ao remover', error.message); else { setSelecionado(null); await carregar(); }
    } },
  ]);

  const campo = (key: keyof typeof form, label: string, placeholder: string, multiline = false) => (
    <View style={{ marginBottom: 12 }}><Text style={s.label}>{label}</Text><TextInput
      style={[s.input, multiline && { minHeight: 82, textAlignVertical: 'top' }]}
      value={form[key]} onChangeText={(value) => setForm((prev) => ({ ...prev, [key]: value }))}
      placeholder={placeholder} multiline={multiline} keyboardType={key === 'telefone' ? 'phone-pad' : 'default'}
    /></View>
  );

  return (
    <View style={s.page}>
      <FlatList
        data={filtrados} keyExtractor={(a) => a.id}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={() => carregar(true)} tintColor={BRAND} />}
        ListHeaderComponent={<>
          <View style={s.heading}><View><Text style={s.kicker}>SEU ACOMPANHAMENTO</Text><Text style={s.title}>Alunos</Text></View><View style={s.count}><Text style={s.countNumber}>{lista.length}</Text><Text style={s.countLabel}>ativos</Text></View></View>
          <View style={s.actions}>
            <Pressable style={s.primary} onPress={abrirNovo}><Text style={s.primaryText}>＋ Novo aluno</Text></Pressable>
            <Pressable style={s.secondary} onPress={convidar}><Text style={s.secondaryText}>↗ Convidar</Text></Pressable>
          </View>
          <TextInput style={s.search} placeholder="Buscar por nome, telefone ou objetivo" value={busca} onChangeText={setBusca} clearButtonMode="while-editing" />
          <Text style={s.section}>{busca ? `${filtrados.length} resultado(s)` : 'SUA CARTEIRA'}</Text>
        </>}
        ListEmptyComponent={carregando ? <ActivityIndicator color={BRAND} style={{ marginTop: 32 }} /> : <View style={s.empty}><Text style={s.emptyIcon}>◉</Text><Text style={s.emptyTitle}>{busca ? 'Nenhum resultado' : 'Sua carteira começa aqui'}</Text><Text style={s.muted}>{busca ? 'Tente outro nome ou objetivo.' : 'Cadastre um aluno ou compartilhe um link de convite para começar.'}</Text></View>}
        renderItem={({ item }) => <Pressable style={s.student} onPress={() => setSelecionado(item)}>
          <View style={s.avatar}><Text style={s.avatarText}>{item.nome.trim().split(/\s+/).slice(0, 2).map((n) => n[0]).join('').toUpperCase()}</Text></View>
          <View style={{ flex: 1 }}><Text style={s.studentName}>{item.nome}</Text><Text style={s.studentMeta}>{item.objetivo || 'Objetivo não informado'}</Text>{item.telefone ? <Text style={s.studentPhone}>{item.telefone}</Text> : null}</View>
          <Text style={s.chevron}>›</Text>
        </Pressable>}
      />

      <Modal visible={modal !== null} animationType="slide" transparent onRequestClose={() => setModal(null)}>
        <View style={s.scrim}><View style={s.sheet}>
          <View style={s.sheetTop}><View><Text style={s.kicker}>{modal === 'novo' ? 'NOVO CADASTRO' : 'DADOS DO ALUNO'}</Text><Text style={s.sheetTitle}>{modal === 'novo' ? 'Adicionar aluno' : 'Editar cadastro'}</Text></View><Pressable onPress={() => setModal(null)}><Text style={s.close}>✕</Text></Pressable></View>
          {campo('nome', 'Nome completo *', 'Ex.: Ana Souza')}{campo('telefone', 'Telefone', '(11) 99999-9999')}{campo('objetivo', 'Objetivo', 'Ex.: ganhar força e condicionamento', true)}
          <Pressable style={[s.primary, salvando && { opacity: .6 }]} onPress={salvar} disabled={salvando}><Text style={s.primaryText}>{salvando ? 'Salvando…' : 'Salvar aluno'}</Text></Pressable>
        </View></View>
      </Modal>

      <Modal visible={!!selecionado && !modal} animationType="slide" transparent onRequestClose={() => setSelecionado(null)}>
        {selecionado && <View style={s.scrim}><View style={s.sheet}>
          <View style={s.sheetTop}><View style={s.avatarLarge}><Text style={s.avatarText}>{selecionado.nome.trim().split(/\s+/).slice(0, 2).map((n) => n[0]).join('').toUpperCase()}</Text></View><Pressable onPress={() => setSelecionado(null)}><Text style={s.close}>✕</Text></Pressable></View>
          <Text style={s.sheetTitle}>{selecionado.nome}</Text><Text style={s.detailText}>{selecionado.objetivo || 'Objetivo não informado'}</Text>
          <View style={s.detailRow}><Text style={s.label}>Telefone</Text><Text style={s.detailText}>{selecionado.telefone || 'Não informado'}</Text></View>
          <View style={s.detailRow}><Text style={s.label}>Plano</Text><Text style={s.detailText}>{selecionado.plano_id ? 'Plano ativo' : 'A definir'}</Text></View>
          <Pressable style={s.primary} onPress={() => abrirEdicao(selecionado)}><Text style={s.primaryText}>Editar cadastro</Text></Pressable>
          <Pressable style={s.deleteButton} onPress={() => remover(selecionado)}><Text style={s.deleteText}>Remover aluno</Text></Pressable>
        </View></View>}
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f5f6f8' }, list: { padding: 18, paddingBottom: 36 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }, kicker: { color: '#818795', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 }, title: { fontSize: 30, color: '#17191e', fontWeight: '800', marginTop: 2 },
  count: { backgroundColor: '#e9e9e9', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center' }, countNumber: { fontWeight: '800', fontSize: 18, color: BRAND }, countLabel: { color: '#626262', fontSize: 10 },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 16 }, primary: { flex: 1, backgroundColor: BRAND, paddingVertical: 13, borderRadius: 12, alignItems: 'center' }, primaryText: { color: '#fff', fontWeight: '700' }, secondary: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e1e3e7', paddingVertical: 13, paddingHorizontal: 18, borderRadius: 12, alignItems: 'center' }, secondaryText: { color: '#272a30', fontWeight: '700' },
  search: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e6e7eb', padding: 13, fontSize: 14 }, section: { color: '#8a8e98', fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginTop: 22, marginBottom: 8 },
  student: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 13, marginBottom: 9, borderWidth: 1, borderColor: '#edeef1', gap: 12 }, avatar: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#e9e9e9', alignItems: 'center', justifyContent: 'center' }, avatarLarge: { width: 54, height: 54, borderRadius: 18, backgroundColor: '#e9e9e9', alignItems: 'center', justifyContent: 'center' }, avatarText: { color: BRAND, fontSize: 15, fontWeight: '800' }, studentName: { fontSize: 15, fontWeight: '700', color: '#1e2025' }, studentMeta: { fontSize: 12, color: '#6d727e', marginTop: 3 }, studentPhone: { fontSize: 11, color: '#9a9ea7', marginTop: 2 }, chevron: { fontSize: 25, color: '#a5a8af' },
  empty: { alignItems: 'center', paddingHorizontal: 26, paddingVertical: 50 }, emptyIcon: { color: BRAND, fontSize: 38 }, emptyTitle: { fontSize: 17, fontWeight: '700', marginTop: 10, color: '#24262c' }, muted: { textAlign: 'center', color: '#858995', lineHeight: 20, marginTop: 5 },
  scrim: { flex: 1, backgroundColor: 'rgba(16,18,22,.42)', justifyContent: 'flex-end' }, sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 32 }, sheetTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }, sheetTitle: { color: '#1d1f25', fontSize: 22, fontWeight: '800', marginTop: 3 }, close: { fontSize: 19, color: '#818590', padding: 8 }, label: { fontSize: 12, fontWeight: '700', color: '#737783', marginBottom: 5 }, input: { borderWidth: 1, borderColor: '#e2e4e8', borderRadius: 10, padding: 12, backgroundColor: '#fafbfc', color: '#1d1f25' }, detailRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f1f3' }, detailText: { color: '#25272c', marginTop: 3 }, deleteButton: { alignItems: 'center', padding: 13, marginTop: 8 }, deleteText: { color: '#bd3434', fontWeight: '700' },
});
