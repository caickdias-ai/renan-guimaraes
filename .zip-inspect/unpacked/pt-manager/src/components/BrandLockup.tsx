import { Image, StyleSheet, Text, View } from 'react-native';

type BrandLockupProps = {
  variant?: 'login' | 'header';
};

export default function BrandLockup({ variant = 'header' }: BrandLockupProps) {
  const login = variant === 'login';

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Guimarães Treinador"
      style={[styles.container, login ? styles.loginContainer : styles.headerContainer]}
    >
      <Image
        source={require('../../assets/brand/app-icon.png')}
        style={[styles.mark, login ? styles.loginMark : styles.headerMark]}
        resizeMode="contain"
        accessible={false}
      />
      <View style={styles.wordmark}>
        <Text style={[styles.name, login ? styles.loginName : styles.headerName]}>GUIMARÃES</Text>
        <Text style={[styles.descriptor, login ? styles.loginDescriptor : styles.headerDescriptor]}>TREINADOR</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center' },
  loginContainer: { justifyContent: 'center', gap: 14 },
  headerContainer: { justifyContent: 'center', gap: 7 },
  mark: { backgroundColor: '#292929' },
  loginMark: { width: 86, height: 86, borderRadius: 12 },
  headerMark: { width: 38, height: 38, borderRadius: 6 },
  wordmark: { alignItems: 'flex-start' },
  name: { color: '#fff', fontWeight: '900', includeFontPadding: false },
  loginName: { fontSize: 24, letterSpacing: 0.5 },
  headerName: { fontSize: 13, letterSpacing: 0.35 },
  descriptor: { color: '#d0d0d0', fontWeight: '800', includeFontPadding: false },
  loginDescriptor: { fontSize: 10, letterSpacing: 2.2, marginTop: 5 },
  headerDescriptor: { fontSize: 8, letterSpacing: 1.45, marginTop: 3 },
});
