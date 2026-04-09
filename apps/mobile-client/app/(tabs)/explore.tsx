import { useState, useCallback, useEffect } from 'react';
import {
    StyleSheet, View, Text, TextInput, ScrollView, TouchableOpacity,
    FlatList, Image, Pressable, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CustomHeader } from '@/components/CustomHeader';
import { Colors, Spacing, Radii, Typography, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRestaurants } from '@/hooks/use-restaurants';
import * as Haptics from 'expo-haptics';

// Types
interface RecentSearch {
    id: string;
    query: string;
    timestamp: number;
}

interface FeaturedRestaurant {
    id: string;
    name: string;
    deliveryTime: string;
    cuisine: string;
}

interface HealthyProduct {
    id: string;
    name: string;
    image: string;
}

interface Category {
    id: string;
    name: string;
    icon: string;
}

export default function ExploreScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const { restaurants } = useRestaurants();

    const [search, setSearch] = useState('');
    const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([
        { id: '1', query: 'poutine', timestamp: Date.now() - 86400000 },
        { id: '2', query: 'poutine', timestamp: Date.now() - 172800000 },
        { id: '3', query: 'restaurant', timestamp: Date.now() - 259200000 },
        { id: '4', query: 'Kebab', timestamp: Date.now() - 345600000 },
        { id: '5', query: 'poulet', timestamp: Date.now() - 432000000 },
        { id: '6', query: 'costo', timestamp: Date.now() - 518400000 },
        { id: '7', query: 'kebab parus', timestamp: Date.now() - 604800000 },
        { id: '8', query: 'rice', timestamp: Date.now() - 691200000 },
    ]);

    const [favoriteRestaurants] = useState<FeaturedRestaurant[]>([
        { id: '1', name: "McDonald's", deliveryTime: '10 min', cuisine: '' },
        { id: '2', name: 'Burger King', deliveryTime: '11 min', cuisine: '' },
        { id: '3', name: 'KFC', deliveryTime: '15 min', cuisine: '' },
        { id: '4', name: 'Walmart', deliveryTime: '20 min', cuisine: '' },
        { id: '5', name: 'Metro', deliveryTime: '25 min', cuisine: '' },
    ]);

    const [healthyProducts] = useState<HealthyProduct[]>([
        { id: '1', name: 'Fraises', image: '🍓' },
        { id: '2', name: 'Yogourt', image: '🥛' },
        { id: '3', name: "Lait d'amande", image: '🥛' },
        { id: '4', name: 'Kombucha', image: '🍹' },
        { id: '5', name: "Huile d'olive", image: '🫒' },
    ]);

    const [categories] = useState<Category[]>([
        { id: '1', name: 'Restauration rapide', icon: '🍟' },
        { id: '2', name: 'Hamburgers', icon: '🍔' },
        { id: '3', name: 'Crème et yogourt glacés', icon: '🍦' },
        { id: '4', name: 'Cuisine turque', icon: '🍢' },
    ]);

    const handleSearch = useCallback((query: string) => {
        if (!query.trim()) return;

        // Ajouter à l'historique
        const newSearch: RecentSearch = {
            id: Date.now().toString(),
            query: query.trim(),
            timestamp: Date.now(),
        };

        setRecentSearches(prev => {
            const filtered = prev.filter(s => s.query !== query.trim());
            return [newSearch, ...filtered].slice(0, 10);
        });

        setSearch('');
        router.push({
            pathname: '/(tabs)/explore',
            params: { q: query.trim() }
        });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, [router]);

    const handleCategoryPress = useCallback((categoryName: string) => {
        handleSearch(categoryName);
    }, [handleSearch]);

    const handleRemoveRecent = useCallback((id: string) => {
        setRecentSearches(prev => prev.filter(s => s.id !== id));
    }, []);

    const handleRestaurantPress = useCallback((restaurantId: string) => {
        router.push({
            pathname: '/restaurant/[id]',
            params: { id: restaurantId }
        });
    }, [router]);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <CustomHeader />

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Search Bar */}
                <View style={[styles.searchBarContainer, { paddingHorizontal: Spacing.md }]}>
                    <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Ionicons name="search" size={20} color={theme.tabIconDefault} />
                        <TextInput
                            style={[styles.searchInput, { color: theme.text }]}
                            placeholder="Rechercher dans kBouffe"
                            placeholderTextColor={theme.tabIconDefault}
                            value={search}
                            onChangeText={setSearch}
                            onSubmitEditing={() => handleSearch(search)}
                        />
                    </View>
                </View>

                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            Recherches récentes
                        </Text>
                        <View style={styles.tagsContainer}>
                            {recentSearches.slice(0, 8).map(item => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[styles.tag, { backgroundColor: theme.primaryLight }]}
                                    onPress={() => handleSearch(item.query)}
                                    onLongPress={() => handleRemoveRecent(item.id)}
                                >
                                    <Ionicons name="time-outline" size={14} color={theme.primary} />
                                    <Text style={[styles.tagText, { color: theme.primary }]}>
                                        {item.query}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* Order Again Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        Commander à nouveau
                    </Text>
                    <FlatList
                        horizontal
                        data={favoriteRestaurants}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.restaurantCard}
                                onPress={() => handleRestaurantPress(item.id)}
                            >
                                <View style={[styles.restaurantLogo, { backgroundColor: theme.primaryLight }]}>
                                    <Text style={styles.restaurantLogoText}>
                                        {item.name.charAt(0)}
                                    </Text>
                                </View>
                                <Text style={[styles.restaurantName, { color: theme.text }]} numberOfLines={2}>
                                    {item.name}
                                </Text>
                                <Text style={[styles.deliveryTime, { color: theme.tabIconDefault }]}>
                                    {item.deliveryTime}
                                </Text>
                            </TouchableOpacity>
                        )}
                        keyExtractor={item => item.id}
                        scrollEnabled={false}
                        numColumns={Math.ceil(favoriteRestaurants.length / 2)}
                    />
                </View>

                {/* Eat Healthy Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        Mangez sain
                    </Text>
                    <FlatList
                        horizontal
                        data={healthyProducts}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.productCard, { borderColor: theme.border }]}
                                onPress={() => handleSearch(item.name)}
                            >
                                <Text style={styles.productEmoji}>{item.image}</Text>
                                <Text style={[styles.productName, { color: theme.text }]}>
                                    {item.name}
                                </Text>
                            </TouchableOpacity>
                        )}
                        keyExtractor={item => item.id}
                        scrollEnabled
                        showsHorizontalScrollIndicator={false}
                    />
                </View>

                {/* Best Categories Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        Meilleures catégories
                    </Text>
                    {categories.map(category => (
                        <TouchableOpacity
                            key={category.id}
                            style={[styles.categoryItem, { borderBottomColor: theme.border }]}
                            onPress={() => handleCategoryPress(category.name)}
                        >
                            <Text style={styles.categoryEmoji}>{category.icon}</Text>
                            <Text style={[styles.categoryName, { color: theme.text }]}>
                                {category.name}
                            </Text>
                            <Ionicons name="chevron-forward" size={20} color={theme.tabIconDefault} />
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    searchBarContainer: {
        paddingVertical: Spacing.md,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        borderRadius: Radii.xl,
        borderWidth: 1,
        height: 44,
    },
    searchInput: {
        flex: 1,
        marginLeft: Spacing.sm,
        ...Typography.body,
    },
    section: {
        paddingHorizontal: Spacing.md,
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        ...Typography.subtitle2,
        marginBottom: Spacing.md,
        fontWeight: '600',
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: Radii.lg,
        gap: Spacing.xs,
    },
    tagText: {
        ...Typography.caption,
        fontWeight: '500',
    },
    restaurantCard: {
        flex: 1,
        marginRight: Spacing.md,
        marginBottom: Spacing.md,
        alignItems: 'center',
    },
    restaurantLogo: {
        width: 80,
        height: 80,
        borderRadius: Radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
    },
    restaurantLogoText: {
        fontSize: 32,
        fontWeight: '700',
        color: '#fff',
    },
    restaurantName: {
        ...Typography.caption,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: Spacing.xs,
        maxWidth: 80,
    },
    deliveryTime: {
        ...Typography.caption,
        fontSize: 12,
    },
    productCard: {
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        borderRadius: Radii.lg,
        borderWidth: 1,
        marginRight: Spacing.md,
        minWidth: 90,
    },
    productEmoji: {
        fontSize: 32,
        marginBottom: Spacing.sm,
    },
    productName: {
        ...Typography.caption,
        textAlign: 'center',
        fontWeight: '500',
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        gap: Spacing.md,
    },
    categoryEmoji: {
        fontSize: 20,
    },
    categoryName: {
        flex: 1,
        ...Typography.body,
        fontWeight: '500',
    },
});
