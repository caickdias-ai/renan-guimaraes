import { View, Text } from 'react-native';
export default function Placeholder({ titulo, dica }: { titulo: string; dica: string }) {
  return (
    <View style={{ flex: 1, padding: 20, gap: 8 }}>
      <Text style={{ fontSize: 20, fontWeight: '700' }}>{titulo}</Text>
      <Text style={{ color: '#666' }}>{dica}</Text>
    </View>
  );
}
