import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Switch, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { PRIMARY } from '@/constants/colors';

interface CatalogProduct {
  id: string;
  name: string;
  unit: string;
  price_per_unit: number;
  stock_quantity: number;
  is_available: boolean;
  category: string | null;
  image_url: string | null;
}

export default function CatalogScreen() {
  const { profile } = useAuth();
  const theme = useTheme();
  const router = useRouter();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = useCallback(async () => {
    if (!profile?.id) return;
    const { data, error } = await supabase
      .from('supplier_products')
      .select('id, name, unit, price_per_unit, stock_quantity, is_available, category, image_url')
      .eq('supplier_id', profile.id)
      .order('name');
    if (!error && data) setProducts(data as CatalogProduct[]);
    setLoading(false);
    setRefreshing(false);
  }, [profile?.id]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const toggleAvailability = async (id: string, current: boolean) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, is_available: !current } : p));
    await supabase.from('supplier_products').update({ is_available: !current }).eq('id', id);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>Mon catalogue</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: PRIMARY }]}
          onPress={() => router.push('/product/new')}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      {loading
        ? <ActivityIndicator style={{ marginTop: 40 }} size="large" color={PRIMARY} />
        : (
          <FlatList
            data={products}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 16 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProducts(); }} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>🌱</Text>
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  Ajoutez vos premiers produits
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => router.push(`/product/${item.id}`)}
              >
                <View style={styles.cardContent}>
                  <View style={styles.info}>
                    <Text style={[styles.productName, { color: theme.text }]}>{item.name}</Text>
                    {item.category && (
                      <Text style={[styles.category, { color: theme.textSecondary }]}>{item.category}</Text>
                    )}
                    <Text style={[styles.price, { color: PRIMARY }]}>
                      {item.price_per_unit.toLocaleString()} FCFA / {item.unit}
                    </Text>
                    <Text style={[styles.stock, { color: item.stock_quantity > 0 ? theme.textSecondary : '#ef4444' }]}>
                      Stock : {item.stock_quantity} {item.unit}
                    </Text>
                  </View>
                  <Switch
                    value={item.is_available}
                    onValueChange={() => toggleAvailability(item.id, item.is_available)}
                    trackColor={{ false: '#e5e7eb', true: PRIMARY + '60' }}
                    thumbColor={item.is_available ? PRIMARY : '#9ca3af'}
                  />
                </View>
              </TouchableOpacity>
            )}
          />
        )
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  title: { fontSize: 24, fontWeight: '800' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  card: { borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1 },
  cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  info: { flex: 1 },
  productName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  category: { fontSize: 12, marginBottom: 4 },
  price: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  stock: { fontSize: 13 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15 },
});
