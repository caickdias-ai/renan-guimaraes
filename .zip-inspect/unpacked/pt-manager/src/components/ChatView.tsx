import { useEffect, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { assinarMensagens, enviarMensagem, listarMensagens, type Msg } from '../lib/chat';

const hora = (iso: string) => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export default function ChatView({ alunoId, eu }: { alunoId: string; eu: Msg['de'] }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [texto, setTexto] = useState('');

  useEffect(() => {
    let vivo = true;
    setMsgs([]);
    listarMensagens(alunoId).then((m) => vivo && setMsgs(m)).catch((e) => Alert.alert('Erro', e.message));
    const parar = assinarMensagens(alunoId, (m) => setMsgs((p) => (p.some((x) => x.id === m.id) ? p : [...p, m])));
    return () => { vivo = false; parar(); };
  }, [alunoId]);

  const enviar = async () => {
    const t = texto.trim();
    if (!t) return;
    setTexto('');
    try {
      const m = await enviarMensagem(alunoId, eu, t);
      setMsgs((p) => (p.some((x) => x.id === m.id) ? p : [...p, m])); // o evento em tempo real também chega; evita duplicar
    } catch (e: any) { setTexto(t); Alert.alert('Erro', e.message); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <FlatList
        inverted
        data={[...msgs].reverse()}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 12 }}
        ListEmptyComponent={<Text style={{ color: '#666', textAlign: 'center', transform: [{ scaleY: -1 }] }}>Sem mensagens ainda.</Text>}
        renderItem={({ item }) => (
          <View style={[s.bolha, item.de === eu ? s.minha : s.outra]}>
            <Text style={item.de === eu ? { color: '#fff' } : undefined}>{item.texto}</Text>
            <Text style={[s.hora, item.de === eu && { color: '#ffe' }]}>{hora(item.criado_em)}</Text>
          </View>
        )}
      />
      <View style={s.barra}>
        <TextInput style={s.input} placeholder="Mensagem" value={texto} onChangeText={setTexto} multiline />
        <Pressable style={s.btn} onPress={enviar}><Text style={{ color: '#fff', fontWeight: '600' }}>Enviar</Text></Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  bolha: { maxWidth: '80%', padding: 10, borderRadius: 14, marginVertical: 3 },
  minha: { alignSelf: 'flex-end', backgroundColor: '#303030' },
  outra: { alignSelf: 'flex-start', backgroundColor: '#eee' },
  hora: { fontSize: 10, color: '#888', marginTop: 2 },
  barra: { flexDirection: 'row', gap: 8, padding: 10, borderTopWidth: 1, borderColor: '#ddd', alignItems: 'flex-end' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8, maxHeight: 100 },
  btn: { backgroundColor: '#303030', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 10 },
});
