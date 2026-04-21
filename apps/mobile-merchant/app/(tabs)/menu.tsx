import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    Switch, RefreshControl, ActivityIndicator, SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import type { ProductRow } from '@/lib/types';

interface MenuSection {
    id: string;
    name: string;
    products: ProductRow[];
}

export default function MenuScreen() {
    const { profile } = useAuth();
    const theme = useTheme();
    const router = useRouter();
    const [sections, setSections] = useState<MenuSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchMenu = useCallback(async () => {
        if (!profile?.restaurantId) {
            console.log('No restaurantId:', profile);
            return;
        }
        try {
            const [catsRes, prodsRes] = await Promise.all([
                supabase.from('categories').select('id, name, sort_order').eq('restaurant_id', profile.restaurantId).order('sort_order'),
                supabase.from('products').select('id, name, description, price, is_available, image_url, category_id').eq('restaurant_id', profile.restaurantId).order('name'),
            ]);
            if (catsRes.error) {
                console.error('Categories error:', catsRes.error);
            }
            if (prodsRes.error) {
                console.error('Products error:', prodsRes.error);
            }
            console.log('Loaded categories:', catsRes.data?.length, 'products:', prodsRes.data?.length);
            const cats = catsRes.data ?? [];
            const prods = prodsRes.data ?? [];
            const uncategorized = prods.filter((p: ProductRow) => !p.category_id);
            const result: MenuSection[] = cats.map((c: any) => ({
                ...c,
                products: prods.filter((p: ProductRow) => p.category_id === c.id),
            }));
            if (uncategorized.length > 0) result.push({ id: '_uncategorized', name: 'Sans catégorie', products: uncategorized });
            setSections(result.filter((s) => s.products.length > 0));
        } catch (error) {
            console.error('Error fetching menu:', error);
        }
    }, [profile?.restaurantId]);

    useEffect(() => { fetchMenu().finally(() => setLoading(false)); }, [fetchMenu]);

    const toggleAvailability = async (product: ProductRow) => {
        const newVal = !product.is_available;
        setSections((prev) =>
            prev.map((s) => ({
                ...s,
                products: s.products.map((p) => p.id === product.id ? { ...p, is_available: newVal } : p),
            }))
        );
        await supabase.from('products').update({ is_available: newVal }).eq('id', product.id);
    };

    const onRefresh = async () => { setRefreshing(true); await fetchMenu(); setRefreshing(false); };

    const s = styles(theme);

    if (loading) return (
        <SafeAreaView style={s.container} edges={['top']}>
            <ActivityIndicator style={{ marginTop: 40 }} color={theme.primary} size="large" />
        </SafeAreaView>
    );

    return (
        <SafeAreaView style={s.container} edges={['top']}>
            <View style={s.header}>
                <Text style={s.title}>Mon Menu</Text>
                <TouchableOpacity style={[s.addBtn, { backgroundColor: theme.primary }]} onPress={() => router.push('/product/new')}>
                    <Ionicons name="add" size={20} color="#fff" />
                    <Text style={s.addBtnText}>Produit</Text>
                </TouchableOpacity>
            </View>

            <SectionList
                sections={sections.map((s) => ({ title: s.name, data: s.products }))}
                keyExtractor={(item) => item.id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
                renderSectionHeader={({ section }) => (
                    <View style={s.sectionHeader}>
                        <Text style={s.sectionTitle}>{section.title}</Text>
                        <Text style={[s.sectionCount, { color: theme.textSecondary }]}>{section.data.length} article{section.data.length > 1 ? 's' : ''}</Text>
                    </View>
                )}
                renderItem={({ item }) => (
                    <TouchableOpacity style={s.productCard} onPress={() => router.push(`/product/${item.id}`)}>
                        {item.image_url ? (
                            <Image source={{ uri: item.image_url }} style={s.productImage} contentFit="cover" />
                        ) : (
                            <View style={[s.productImage, s.productImagePlaceholder]}>
                                <Text style={s.productImageEmoji}>🍽️</Text>
                            </View>
                        )}
                        <View style={s.productInfo}>
                            <Text style={[s.productName, !item.is_available && s.unavailable]}>{item.name}</Text>
                            <Text style={[s.productPrice, { color: theme.primary }]}>{item.price?.toLocaleString()} FCFA</Text>
                        </View>
                        <Switch
                            value={item.is_available}
                            onValueChange={() => toggleAvailability(item)}
                            trackColor={{ false: theme.border, true: theme.primary + '80' }}
                            thumbColor={item.is_available ? theme.primary : theme.textSecondary}
                        />
                    </TouchableOpacity>
                )}
                contentContainerStyle={s.list}
                ListEmptyComponent={
                    <View style={s.empty}>
                        <Text style={s.emptyIcon}>🍽️</Text>
                        <Text style={[s.emptyText, { color: theme.textSecondary }]}>Aucun produit dans le menu</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = (theme: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.border },
    title: { fontSize: 22, fontWeight: '700', color: theme.text },
    addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
    addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    list: { paddingBottom: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: theme.background },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: theme.text },
    sectionCount: { fontSize: 12 },
    productCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.surface, marginHorizontal: 12, marginBottom: 8, borderRadius: 12, padding: 12 },
    productImage: { width: 52, height: 52, borderRadius: 10 },
    productImagePlaceholder: { backgroundColor: theme.border, alignItems: 'center', justifyContent: 'center' },
    productImageEmoji: { fontSize: 22 },
    productInfo: { flex: 1 },
    productName: { fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 2 },
    unavailable: { opacity: 0.4 },
    productPrice: { fontSize: 13, fontWeight: '700' },
    empty: { alignItems: 'center', marginTop: 60 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyText: { fontSize: 15 },
});
