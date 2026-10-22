import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
export const supabaseConfigured = Boolean(url && anonKey && !url.includes('SEU-PROJETO') && !anonKey.includes('sua-anon-key'));

// URLs sentinela evitam que o app quebre ao abrir antes da configuração local;
// a tela de login informa como conectar o backend.
export const supabase = createClient(
  url || 'http://127.0.0.1:54321',
  anonKey || 'supabase-nao-configurado',
  { auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false } }
);
