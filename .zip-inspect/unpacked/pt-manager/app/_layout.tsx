import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { supabase } from '../src/lib/supabase';

export default function Root() {
  const router = useRouter();
  const segments = useSegments();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const route = async (userId?: string) => {
      const first = segments[0];
      const publicRoute = first === 'cadastro' || first === 'login';
      if (!userId) {
        if (!publicRoute) router.replace('/login');
        if (active) setReady(true);
        return;
      }

      const mustResolveRole = first === 'login' || first === '(professor)' || first === '(aluno)';
      if (mustResolveRole) {
        const { data } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
        if (!active) return;
        const destino = data?.role === 'professor' ? '/(professor)/alunos' : '/(aluno)/treinos';
        if (first === 'login' || (first === '(professor)' && data?.role !== 'professor') || (first === '(aluno)' && data?.role === 'professor')) {
          router.replace(destino);
        }
      }
      if (active) setReady(true);
    };
    supabase.auth.getSession().then(({ data }) => route(data.session?.user.id));
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => route(session?.user.id));
    return () => { active = false; subscription.subscription.unsubscribe(); };
  }, [router, segments]);

  return ready ? <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#f5f6f8' } }} /> : null;
}
