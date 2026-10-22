import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import BrandLockup from '../src/components/BrandLockup';
import { supabase, supabaseConfigured } from '../src/lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [busy, setBusy] = useState(false);
  const entrar = async () => {
    if (!supabaseConfigured) return Alert.alert('Backend não configurado', 'Configure EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no arquivo .env. Veja o README do projeto.');
    if (!email.trim() || !senha) return Alert.alert('Preencha seus dados', 'Informe e-mail e senha para entrar.');
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    setBusy(false);
    if (error) Alert.alert('Não foi possível entrar', error.message);
  };

  return (
    <KeyboardAvoidingView style={s.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.content}>
        <View style={s.brandPanel}>
          <BrandLockup variant="login" />
          <View style={s.brandRule} />
          <Text style={s.brandCaption}>GESTÃO DE TREINOS E ALUNOS</Text>
        </View>
        <View style={s.card}>
          <Text style={s.kicker}>ÁREA EXCLUSIVA</Text>
          <Text style={s.title}>Acesse sua conta</Text>
          <Text style={s.sub}>Entre para acompanhar alunos e treinos.</Text>
          <Text style={s.label}>E-mail</Text>
          <TextInput style={s.input} placeholder="voce@email.com" placeholderTextColor="#929292" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" value={email} onChangeText={setEmail} returnKeyType="next" />
          <Text style={s.label}>Senha</Text>
          <TextInput style={s.input} placeholder="Sua senha" placeholderTextColor="#929292" secureTextEntry value={senha} onChangeText={setSenha} onSubmitEditing={entrar} returnKeyType="go" />
          <Pressable style={[s.button, busy && { opacity: .7 }]} onPress={entrar} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Entrar</Text>}
          </Pressable>
          {!supabaseConfigured && <Text style={s.note}>Para iniciar, conecte este app ao seu projeto Supabase. As instruções estão no README.</Text>}
        </View>
        <Text style={s.footer}>GUIMARÃES TREINADOR</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f2f2f2', justifyContent: 'center', padding: 22 },
  content: { width: '100%', maxWidth: 440, alignSelf: 'center' },
  brandPanel: { backgroundColor: '#313131', borderRadius: 18, paddingHorizontal: 20, paddingVertical: 18, alignItems: 'center', marginBottom: 16 },
  brandRule: { width: 36, height: 2, backgroundColor: '#fff', opacity: .8, borderRadius: 2, marginTop: 10 },
  brandCaption: { color: '#d2d2d2', fontSize: 9, letterSpacing: 1.8, fontWeight: '700', marginTop: 8 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 22, borderWidth: 1, borderColor: '#e2e2e2' },
  kicker: { color: '#777', fontSize: 10, letterSpacing: 1.4, fontWeight: '800' },
  title: { fontSize: 22, fontWeight: '800', color: '#202020', marginTop: 5 },
  sub: { color: '#777', marginTop: 5, marginBottom: 16 },
  label: { color: '#4c4c4c', fontSize: 12, fontWeight: '700', marginBottom: 6, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#dedede', backgroundColor: '#fafafa', borderRadius: 10, padding: 13, color: '#202020' },
  button: { backgroundColor: '#292929', borderRadius: 11, padding: 14, alignItems: 'center', marginTop: 20, minHeight: 50, justifyContent: 'center' },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  note: { color: '#555', backgroundColor: '#f0f0f0', borderRadius: 10, padding: 11, marginTop: 15, fontSize: 12, lineHeight: 18 },
  footer: { textAlign: 'center', color: '#757575', fontSize: 10, fontWeight: '700', letterSpacing: 1.1, marginTop: 17 },
});
