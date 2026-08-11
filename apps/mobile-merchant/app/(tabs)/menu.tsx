import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    Switch, RefreshControl, ActivityIndicator, SectionList, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/lib/api';
import { TouchTarget } from '@/constants/theme';
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
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [loaded, setLoaded] = useState(false);

    const fetchMenu = useCallback(async () => {
        if (!profile?.restaurantId) return;
        try {
            const [catsRes, prodsRes] = await Promise.all([
                supabase.from('categories').select('id, name, sort_order').eq('restaurant_id', profile.restaurantId).order('sort_order'),
                supabase.from('products').select('id, name, description, price, is_available, image_url, category_id').eq('restaurant_id', profile.restaurantId).order('name'),
            ]);
            // Sans ce contrôle, un menu en échec de chargement était affiché comme
            // « Aucun produit », indistinguable d'un menu réellement vide.
            if (catsRes.error) throw new Error(catsRes.error.message);
            if (prodsRes.error) throw new Error(prodsRes.error.message);

            const cats = catsRes.data ?? [];
            const prods = prodsRes.data ?? [];
            const uncategorized = prods.filter((p: ProductRow) => !p.category_id);
            const result: MenuSection[] = cats.map((c: any) => ({
                ...c,
                products: prods.filter((p: ProductRow) => p.category_id === c.id),
            }));
            if (uncategorized.length > 0) result.push({ id: '_uncategorized', name: 'Sans catégorie', products: uncategorized });
            setSections(result.filter((s) => s.products.length > 0));
            setErrorMessage(null);
            setLoaded(true);
        } catch (error) {
            console.error('Erreur lors du chargement du menu:', error);
            setErrorMessage(getErrorMessage(error, 'Impossible de charger le menu'));
        }
    }, [profile?.restaurantId]);

    useEffect(() => { fetchMenu().finally(() => setLoading(false)); }, [fetchMenu]);

    const toggleAvailability = async (product: ProductRow) => {
        const newVal = !product.is_available;
        const applyValue = (value: boolean) =>
            setSections((prev) =>
                prev.map((s) => ({
                    ...s,
                    products: s.products.map((p) => p.id === product.id ? { ...p, is_available: value } : p),
                }))
            );

        applyValue(newVal);
        const { error } = await supabase.from('products').update({ is_available: newVal }).eq('id', product.id);
        if (error) {
            // Sans rollback, le switch restait sur une valeur jamais enregistrée :
            // un plat en rupture pouvait sembler encore disponible à la vente.
            applyValue(product.is_available);
            Alert.alert(
                'Mise à jour impossible',
                `La disponibilité de « ${product.name} » n'a pas pu être enregistrée.\n\n${error.message}`
            );
        }
    };

    const onRefresh = async () => { setRefreshing(true); await fetchMenu(); setRefreshing(false); };

    const onRetry = async () => { setLoading(true); await fetchMenu(); setLoading(false); };

    const s = styles(theme);

    if (loading) return (
        <SafeAreaView style={s.container} edges={['top']}>
            <ActivityIndicator style={{ marginTop: 40 }} color={theme.primary} size="large" />
        </SafeAreaView>
    );

    const header = (
        <View style={s.header}>
            <Text style={s.title}>Mon Menu</Text>
            <TouchableOpacity
                style={[s.addBtn, { backgroundColor: theme.primary }]}
                onPress={() => router.push('/product/new')}
                accessibilityRole="button"
                accessibilityLabel="Ajouter un produit"
            >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={s.addBtnText}>Produit</Text>
            </TouchableOpacity>
        </View>
    );

    // Jamais chargé avec succès : afficher l'échec plutôt qu'un menu vide trompeur.
    if (!loaded && errorMessage) {
        return (
            <SafeAreaView style={s.container} edges={['top']}>
                {header}
                <View style={s.errorState}>
                    <Ionicons name="cloud-offline-outline" size={44} color={theme.error} />
                    <Text style={s.errorTitle}>Menu indisponible</Text>
                    <Text style={[s.errorBody, { color: theme.textSecondary }]}>{errorMessage}</Text>
                    <TouchableOpacity
                        onPress={onRetry}
                        style={[s.retryButton, { borderColor: theme.error }]}
                        accessibilityRole="button"
                        accessibilityLabel="Réessayer de charger le menu"
                    >
                        <Text style={[s.retryButtonText, { color: theme.error }]}>Réessayer</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={s.container} edges={['top']}>
            {header}

            {/* Rafraîchissement en échec : le menu affiché est celui du dernier chargement réussi. */}
            {errorMessage && (
                <View style={[s.errorBanner, { borderColor: theme.error, backgroundColor: `${theme.error}15` }]}>
                    <Ionicons name="alert-circle" size={18} color={theme.error} />
                    <Text style={[s.errorBannerText, { color: theme.error }]}>{errorMessage}</Text>
                    <TouchableOpacity
                        onPress={onRetry}
                        style={[s.retryButton, { borderColor: theme.error }]}
                        accessibilityRole="button"
                        accessibilityLabel="Réessayer de charger le menu"
                    >
                        <Text style={[s.retryButtonText, { color: theme.error }]}>Réessayer</Text>
                    </TouchableOpacity>
                </View>
            )}

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
                            accessibilityLabel={`Disponibilité de ${item.name}`}
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
    errorState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
    errorTitle: { fontSize: 17, fontWeight: '800', color: theme.text },
    errorBody: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
    errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, margin: 12, borderRadius: 12, borderWidth: 1 },
    errorBannerText: { flex: 1, fontSize: 13 },
    retryButton: { minHeight: TouchTarget.min, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 10, borderWidth: 1 },
    retryButtonText: { fontSize: 13, fontWeight: '700' },
});
