import { useState } from 'react';
import { View, TextInput, Button, Alert, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../src/lib/supabase';

export default function CadastroPorLink() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [f, setF] = useState({ nome: '', telefone: '', nascimento: '', objetivo: '', email: '', senha: '' });
  const set = (k: keyof typeof f) => (v: string) => setF({ ...f, [k]: v });

  const enviar = async () => {
    // 1) cria a conta do aluno  2) a função SQL vincula o aluno ao professor dono do convite
    const { data, error } = await supabase.auth.signUp({ email: f.email, password: f.senha });
    if (error) return Alert.alert('Erro', error.message);
    const { error: e2 } = await supabase.rpc('cadastrar_por_convite', { p_token: token, p_dados: f });
    Alert.alert(e2 ? 'Erro' : 'Cadastro enviado!', e2?.message ?? 'Seu professor já recebeu seus dados.');
  };

  return (
    <View style={{ flex: 1, padding: 24, gap: 8 }}>
      <Text style={{ fontSize: 20, fontWeight: '700' }}>Seu cadastro</Text>
      {(['nome', 'telefone', 'nascimento', 'objetivo', 'email', 'senha'] as const).map((k) => (
        <TextInput key={k} placeholder={k} secureTextEntry={k === 'senha'} autoCapitalize="none" value={f[k]} onChangeText={set(k)} style={{ borderWidth: 1, padding: 10, borderRadius: 8 }} />
      ))}
      <Button title="Enviar" onPress={enviar} />
    </View>
  );
}
