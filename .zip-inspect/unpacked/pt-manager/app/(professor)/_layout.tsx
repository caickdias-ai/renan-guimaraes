import { Pressable, Text } from 'react-native';
import { Tabs } from 'expo-router';
import BrandLockup from '../../src/components/BrandLockup';
import { supabase } from '../../src/lib/supabase';

export default function ProfLayout() {
  return (
    <Tabs screenOptions={{
      headerStyle: { backgroundColor: '#313131' }, headerTintColor: '#fff', headerShadowVisible: false,
      headerTitle: () => <BrandLockup variant="header" />,
      headerTitleAlign: 'center',
      tabBarActiveTintColor: '#fff', tabBarInactiveTintColor: '#a8a8a8',
      tabBarStyle: { height: 62, paddingTop: 5, paddingBottom: 7, borderTopColor: '#414141', backgroundColor: '#292929' },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      headerRight: () => <Pressable onPress={() => supabase.auth.signOut()} style={{ paddingHorizontal: 14, paddingVertical: 8 }}><Text style={{ color: '#fff', fontWeight: '700' }}>Sair</Text></Pressable>,
    }}>
      <Tabs.Screen name="alunos" options={{ title: 'Alunos', tabBarLabel: 'Alunos' }} />
      <Tabs.Screen name="treinos" options={{ title: 'Treinos', tabBarLabel: 'Treinos' }} />
      <Tabs.Screen name="dieta" options={{ title: 'Dietas', tabBarLabel: 'Dietas' }} />
      <Tabs.Screen name="anamnese" options={{ title: 'Anamnese', tabBarLabel: 'Anamnese' }} />
      <Tabs.Screen name="chat" options={{ title: 'Mensagens', tabBarLabel: 'Chat' }} />
    </Tabs>
  );
}
