import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

const MOCK_NOTIFS = [
  { id: '1', type: 'order', message: 'Nouvelle commande de Restaurant La Terrasse', time: 'Il y a 5 min' },
  { id: '2', type: 'stock', message: 'Stock de Tomates fraîches bas (< 10 kg)', time: 'Il y a 1h' },
  { id: '3', type: 'payment', message: 'Paiement reçu : 45 000 FCFA', time: 'Hier' },
];

export default function NotificationsScreen() {
  const theme = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>Alertes</Text>
      </View>
      <FlatList
        data={MOCK_NOTIFS}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={[styles.notif, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={styles.icon}>{item.type === 'order' ? '📦' : item.type === 'stock' ? '⚠️' : '💰'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.message, { color: theme.text }]}>{item.message}</Text>
              <Text style={[styles.time, { color: theme.textSecondary }]}>{item.time}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  title: { fontSize: 24, fontWeight: '800' },
  notif: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 12, marginBottom: 10, borderWidth: 1, alignItems: 'center' },
  icon: { fontSize: 24 },
  message: { fontSize: 14, fontWeight: '500', lineHeight: 20 },
  time: { fontSize: 12, marginTop: 4 },
});
