import { useState, useMemo, useEffect, useCallback } from 'react';
import {
    StyleSheet, View, Text, TextInput, FlatList,
    Pressable, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RestaurantCard } from '@/components/restaurant/RestaurantCard';
import { CUISINE_CATEGORIES } from '@/data/mocks';
import { Colors, Spacing, Radii, Typography, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRestaurants } from '@/hooks/use-restaurants';
import type { MobileRestaurant } from '@/lib/api';
import { useLoyalty } from '@/contexts/loyalty-context';

type SortKey = 'recommended' | 'rating' | 'time' | 'delivery_fee';

const SORT_OPTIONS: { id: SortKey; label: string; icon: string }[] = [
    { id: 'recommended', label: 'Recommandé',  icon: 'sparkles-outline' },
    { id: 'rating',       label: 'Mieux notés', icon: 'star-outline' },
    { id: 'time',         label: 'Plus rapide', icon: 'time-outline' },
    { id: 'delivery_fee', label: 'Livraison',   icon: 'bicycle-outline' },
];

export default function ExploreScreen() {
    const router = useRouter();
    const { q } = useLocalSearchParams<{ q?: string }>();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();

    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState<SortKey>('recommended');
    const [freeDeliveryOnly, setFreeDeliveryOnly] = useState(false);
    const [openOnly, setOpenOnly] = useState(false);
    const { isRestaurantFavorite, toggleRestaurantFavorite } = useLoyalty();

    useEffect(() => {
        if (q && typeof q === 'string') setSearch(q);
    }, [q]);

    const { restaurants, loading: loadingRestaurants } = useRestaurants();

    const hasActiveFilters =
        selectedCategory !== 'all' || freeDeliveryOnly || openOnly || sortBy !== 'recommended';

    const resetFilters = useCallback(() => {
        setSelectedCategory('all');
        setFreeDeliveryOnly(false);
        setOpenOnly(false);
        setSortBy('recommended');
    }, []);

    const filtered = useMemo(() => {
        let results: MobileRestaurant[] = [...restaurants];

        // Category
        if (selectedCategory !== 'all') {
            results = results.filter(r =>
                r.cuisineType?.toLowerCase().includes(selectedCategory.toLowerCase()),
            );
        }

        // Search
        if (search.trim()) {
            const term = search.toLowerCase();
            results = results.filter(r =>
                r.name.toLowerCase().includes(term) ||
                r.description?.toLowerCase().includes(term) ||
                r.cuisineType?.toLowerCase().includes(term),
            );
        }

        // Quick filters
        if (freeDeliveryOnly) results = results.filter(r => r.deliveryFee === 0);
        if (openOnly)         results = results.filter(r => r.isActive);

        // Sort
        switch (sortBy) {
            case 'rating':
                results.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
                break;
            case 'time':
                results.sort((a, b) => (a.estimatedDeliveryTime ?? 99) - (b.estimatedDeliveryTime ?? 99));
                break;
            case 'delivery_fee':
                results.sort((a, b) => a.deliveryFee - b.deliveryFee);
                break;
            default:
                // sponsored first
                results = [
                    ...results.filter(r => r.isSponsored).sort((a, b) => (a.sponsoredRank ?? 99) - (b.sponsoredRank ?? 99)),
                    ...results.filter(r => !r.isSponsored),
                ];
        }

        return results;
    }, [restaurants, search, selectedCategory, sortBy, freeDeliveryOnly, openOnly]);

    const renderItem = useCallback(
        ({ item }: { item: MobileRestaurant }) => (
            <RestaurantCard
                restaurant={item as never}
                onPress={() => router.push(`/restaurant/${item.slug}`)}
                isFavorite={isRestaurantFavorite(item.id)}
                onToggleFavorite={() => toggleRestaurantFavorite(item.id)}
            />
        ),
        [isRestaurantFavorite, router, toggleRestaurantFavorite],
    );

    const ListHeader = (
        <View>
            {/* ── Catégories ── */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.rowScroll}
                contentContainerStyle={styles.rowContainer}
            >
                {CUISINE_CATEGORIES.map((cat) => {
                    const active = selectedCategory === cat.id;
                    return (
                        <Pressable
                            key={cat.id}
                            onPress={() => setSelectedCategory(cat.id)}
                            style={[
                                styles.chip,
                                { backgroundColor: active ? theme.primary : theme.border + '40' },
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel={`Filtre ${cat.label}`}
                            accessibilityState={{ selected: active }}
                        >
                            <Ionicons name={cat.icon as any} size={15} color={active ? '#fff' : theme.icon} />
                            <Text style={[styles.chipLabel, { color: active ? '#fff' : theme.text }]}>
                                {cat.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </ScrollView>

            {/* ── Tri ── */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.rowScroll}
                contentContainerStyle={styles.rowContainer}
            >
                {SORT_OPTIONS.map((opt) => {
                    const active = sortBy === opt.id;
                    return (
                        <Pressable
                            key={opt.id}
                            onPress={() => setSortBy(opt.id)}
                            style={[
                                styles.sortChip,
                                {
                                    borderColor: active ? theme.primary : theme.border,
                                    backgroundColor: active ? theme.primary + '15' : 'transparent',
                                },
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel={`Trier par ${opt.label}`}
                            accessibilityState={{ selected: active }}
                        >
                            <Ionicons
                                name={opt.icon as any}
                                size={14}
                                color={active ? theme.primary : theme.icon}
                            />
                            <Text style={[styles.chipLabel, { color: active ? theme.primary : theme.icon }]}>
                                {opt.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </ScrollView>

            {/* ── Filtres rapides ── */}
            <View style={styles.quickFiltersRow}>
                <Pressable
                    onPress={() => setFreeDeliveryOnly(v => !v)}
                    style={[
                        styles.toggleChip,
                        {
                            borderColor: freeDeliveryOnly ? theme.primary : theme.border,
                            backgroundColor: freeDeliveryOnly ? theme.primary + '15' : 'transparent',
                        },
                    ]}
                    accessibilityRole="checkbox"
                    accessibilityLabel="Livraison gratuite uniquement"
                    accessibilityState={{ checked: freeDeliveryOnly }}
                >
                    <Ionicons name="bicycle-outline" size={14} color={freeDeliveryOnly ? theme.primary : theme.icon} />
                    <Text style={[styles.chipLabel, { color: freeDeliveryOnly ? theme.primary : theme.icon }]}>
                        Livraison gratuite
                    </Text>
                </Pressable>

                <Pressable
                    onPress={() => setOpenOnly(v => !v)}
                    style={[
                        styles.toggleChip,
                        {
                            borderColor: openOnly ? theme.primary : theme.border,
                            backgroundColor: openOnly ? theme.primary + '15' : 'transparent',
                        },
                    ]}
                    accessibilityRole="checkbox"
                    accessibilityLabel="Établissements ouverts uniquement"
                    accessibilityState={{ checked: openOnly }}
                >
                    <Ionicons name="checkmark-circle-outline" size={14} color={openOnly ? theme.primary : theme.icon} />
                    <Text style={[styles.chipLabel, { color: openOnly ? theme.primary : theme.icon }]}>
                        Ouvert maintenant
                    </Text>
                </Pressable>
            </View>

            {/* ── Compteur + reset ── */}
            <View style={styles.resultRow}>
                <Text style={[styles.resultCount, { color: theme.icon }]}>
                    {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
                </Text>
                {hasActiveFilters && (
                    <TouchableOpacity
                        onPress={resetFilters}
                        style={[styles.resetBtn, { borderColor: theme.border }]}
                        accessibilityRole="button"
                        accessibilityLabel="Réinitialiser tous les filtres"
                        hitSlop={8}
                    >
                        <Ionicons name="close-outline" size={14} color={theme.icon} />
                        <Text style={[styles.resetLabel, { color: theme.icon }]}>Réinitialiser</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
            {/* ── En-tête ── */}
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>Explorer</Text>
                <View style={[styles.searchBar, { borderColor: theme.border, backgroundColor: theme.border + '30' }]}>
                    <Ionicons name="search" size={20} color={theme.icon} style={styles.searchIcon} />
                    <TextInput
                        placeholder="Restaurant, plat, cuisine…"
                        placeholderTextColor={theme.icon}
                        style={[styles.searchInput, { color: theme.text }]}
                        value={search}
                        onChangeText={setSearch}
                        returnKeyType="search"
                        clearButtonMode="never"
                        autoCorrect={false}
                    />
                    {search.length > 0 && (
                        <Pressable
                            onPress={() => setSearch('')}
                            accessibilityRole="button"
                            accessibilityLabel="Effacer la recherche"
                            hitSlop={8}
                        >
                            <Ionicons name="close-circle" size={20} color={theme.icon} />
                        </Pressable>
                    )}
                </View>
            </View>

            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                ListHeaderComponent={ListHeader}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews
                maxToRenderPerBatch={8}
                windowSize={5}
                initialNumToRender={6}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="search-outline" size={52} color={theme.border} />
                        <Text style={[styles.emptyTitle, { color: theme.text }]}>Aucun résultat</Text>
                        <Text style={[styles.emptyText, { color: theme.icon }]}>
                            {search.trim()
                                ? `Aucun restaurant pour « ${search.trim()} »`
                                : 'Essayez de modifier vos filtres.'}
                        </Text>
                        {hasActiveFilters && (
                            <TouchableOpacity
                                onPress={resetFilters}
                                style={[styles.emptyResetBtn, { backgroundColor: theme.primary }]}
                                accessibilityRole="button"
                                accessibilityLabel="Réinitialiser les filtres"
                            >
                                <Text style={styles.emptyResetLabel}>Réinitialiser les filtres</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container:   { flex: 1 },
    header:      { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.md },
    title:       { ...Typography.title2, marginBottom: Spacing.md },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        height: 48,
        borderRadius: Radii.lg,
        borderWidth: 1,
    },
    searchIcon:  { marginRight: Spacing.sm },
    searchInput: { flex: 1, height: '100%', ...Typography.body },
    // scrollable rows
    rowScroll:     { maxHeight: 44, marginBottom: 4 },
    rowContainer:  { paddingHorizontal: Spacing.md, gap: Spacing.sm, alignItems: 'center' },
    // chips
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: Radii.full,
    },
    sortChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: Radii.full,
        borderWidth: 1,
    },
    chipLabel: { ...Typography.caption, fontWeight: '600' },
    // quick filters
    quickFiltersRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.md,
        marginTop: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    toggleChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: Radii.full,
        borderWidth: 1,
    },
    // result bar
    resultRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    resultCount: { ...Typography.caption },
    resetBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: Radii.full,
        borderWidth: 1,
    },
    resetLabel: { ...Typography.small },
    // list
    listContainer: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl },
    // empty
    empty: { alignItems: 'center', paddingTop: Spacing.xxl, paddingHorizontal: Spacing.lg },
    emptyTitle: { ...Typography.title3, marginTop: Spacing.md },
    emptyText:  { ...Typography.body, marginTop: Spacing.xs, textAlign: 'center' },
    emptyResetBtn: {
        marginTop: Spacing.lg,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: Radii.full,
    },
    emptyResetLabel: { ...Typography.caption, fontWeight: '700', color: '#fff' },
});
