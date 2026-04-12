import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';

export default function NoAccountScreen() {
  const { signOut } = useAuth();
  const theme = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={styles.emoji}>🌾</Text>
      <Text style={[styles.title, { color: theme.text }]}>Compte non configuré</Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        Votre compte n&apos;est pas encore lié à un profil fournisseur.{'\n'}Contactez l&apos;équipe KBouffe pour finaliser votre inscription.
      </Text>
      <TouchableOpacity style={[styles.btn, { backgroundColor: theme.primary }]} onPress={signOut}>
        <Text style={styles.btnText}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emoji: { fontSize: 56, marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  body: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  btn: { paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
