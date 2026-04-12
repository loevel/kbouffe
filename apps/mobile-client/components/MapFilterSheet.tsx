import React, { useCallback, useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

// ── Types ────────────────────────────────────────────────────────────────────

export interface MapFilters {
    diningOptions: ('pickup' | 'dine_in')[];
    cuisines: string[];
    minRating: number;
    priceRanges: number[];
    sortBy: 'recommended' | 'rating' | 'distance';
}

export const DEFAULT_FILTERS: MapFilters = {
    diningOptions: ['pickup'],
    cuisines: [],
    minRating: 3,
    priceRanges: [],
    sortBy: 'recommended',
};

export type FilterSheetType = 'pickup' | 'cuisine' | 'rating' | 'price' | 'sort' | null;

interface Props {
    visible: boolean;
    type: FilterSheetType;
    filters: MapFilters;
    cuisineOptions: string[];
    onApply: (filters: MapFilters) => void;
    onClose: () => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

// ── Cuisine icons mapping ────────────────────────────────────────────────────

const CUISINE_ICONS: Record<string, string> = {
    'Camerounais': 'flag-outline',
    'Fast Food': 'fast-food-outline',
    'Traditionnel': 'leaf-outline',
    'Italien': 'pizza-outline',
    'Libanais': 'restaurant-outline',
    'Cuisine américaine': 'american-football-outline',
    'Cuisine asiatique': 'fish-outline',
    'Boulangerie': 'cafe-outline',
    'Rôtisserie': 'flame-outline',
    'Déjeuner et brunch': 'sunny-outline',
    'Thés aux perles': 'wine-outline',
    'Hamburgers': 'fast-food-outline',
    'Caribéenne': 'boat-outline',
};

function getCuisineIcon(cuisine: string): string {
    return CUISINE_ICONS[cuisine] ?? 'restaurant-outline';
}

// ── Component ────────────────────────────────────────────────────────────────

export function MapFilterSheet({ visible, type, filters, cuisineOptions, onApply, onClose }: Props) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    // Local copy of filters so the user can change without committing
    const [draft, setDraft] = React.useState<MapFilters>(filters);

    // Sync draft with parent filters when sheet opens
    useEffect(() => {
        if (visible) {
            setDraft(filters);
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                damping: 22,
                stiffness: 200,
                mass: 0.8,
            }).start();
        } else {
            slideAnim.setValue(SCREEN_HEIGHT);
        }
    }, [visible, filters, slideAnim]);

    const handleClose = useCallback(() => {
        Animated.timing(slideAnim, {
            toValue: SCREEN_HEIGHT,
            duration: 250,
            useNativeDriver: true,
        }).start(() => onClose());
    }, [slideAnim, onClose]);

    const handleApply = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Animated.timing(slideAnim, {
            toValue: SCREEN_HEIGHT,
            duration: 250,
            useNativeDriver: true,
        }).start(() => onApply(draft));
    }, [slideAnim, onApply, draft]);

    const handleReset = useCallback(() => {
        Haptics.selectionAsync();
        if (type === 'pickup') setDraft(d => ({ ...d, diningOptions: ['pickup'] }));
        if (type === 'cuisine') setDraft(d => ({ ...d, cuisines: [] }));
        if (type === 'rating') setDraft(d => ({ ...d, minRating: 3 }));
        if (type === 'price') setDraft(d => ({ ...d, priceRanges: [] }));
        if (type === 'sort') setDraft(d => ({ ...d, sortBy: 'recommended' }));
    }, [type]);

    // ── Dining options helpers ────────────────────────────────────────────────

    const toggleDiningOption = useCallback((option: 'pickup' | 'dine_in') => {
        Haptics.selectionAsync();
        setDraft(d => {
            const current = d.diningOptions;
            if (current.includes(option)) {
                // Don't allow deselecting all
                if (current.length === 1) return d;
                return { ...d, diningOptions: current.filter(o => o !== option) };
            }
            return { ...d, diningOptions: [...current, option] };
        });
    }, []);

    // ── Cuisine helpers ──────────────────────────────────────────────────────

    const toggleCuisine = useCallback((cuisine: string) => {
        Haptics.selectionAsync();
        setDraft(d => {
            const current = d.cuisines;
            if (current.includes(cuisine)) {
                return { ...d, cuisines: current.filter(c => c !== cuisine) };
            }
            return { ...d, cuisines: [...current, cuisine] };
        });
    }, []);

    // ── Rating helpers ───────────────────────────────────────────────────────

    const RATING_STEPS = [3, 3.5, 4, 4.5, 5];

    const setRating = useCallback((val: number) => {
        Haptics.selectionAsync();
        setDraft(d => ({ ...d, minRating: val }));
    }, []);

    // ── Price range helpers ──────────────────────────────────────────────────

    const togglePriceRange = useCallback((level: number) => {
        Haptics.selectionAsync();
        setDraft(d => {
            const current = d.priceRanges;
            if (current.includes(level)) {
                return { ...d, priceRanges: current.filter(p => p !== level) };
            }
            return { ...d, priceRanges: [...current, level] };
        });
    }, []);

    // ── Sort helpers ─────────────────────────────────────────────────────────

    const setSortBy = useCallback((val: 'recommended' | 'rating' | 'distance') => {
        Haptics.selectionAsync();
        setDraft(d => ({ ...d, sortBy: val }));
    }, []);

    // ── Title mapping ────────────────────────────────────────────────────────

    const TITLES: Record<string, string> = {
        pickup: 'Dining options',
        cuisine: 'Cuisine',
        rating: 'Note',
        price: 'Fourchette de prix',
        sort: 'Trier',
    };

    if (!visible || !type) return null;

    // ── Render content by type ───────────────────────────────────────────────

    const renderContent = () => {
        switch (type) {
            case 'pickup':
                return (
                    <View style={styles.optionsList}>
                        {[
                            { key: 'pickup' as const, label: 'Ramassage' },
                            { key: 'dine_in' as const, label: 'Manger sur place' },
                        ].map(option => {
                            const checked = draft.diningOptions.includes(option.key);
                            return (
                                <Pressable
                                    key={option.key}
                                    onPress={() => toggleDiningOption(option.key)}
                                    style={[styles.optionRow, { borderBottomColor: theme.border }]}
                                >
                                    <View
                                        style={[
                                            styles.checkbox,
                                            {
                                                backgroundColor: checked ? theme.primary : 'transparent',
                                                borderColor: checked ? theme.primary : theme.borderStrong,
                                            },
                                        ]}
                                    >
                                        {checked && <Ionicons name="checkmark" size={16} color="#fff" />}
                                    </View>
                                    <Text style={[styles.optionLabel, { color: theme.text }]}>
                                        {option.label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                );

            case 'cuisine':
                return (
                    <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {cuisineOptions.map(cuisine => {
                            const checked = draft.cuisines.includes(cuisine);
                            return (
                                <Pressable
                                    key={cuisine}
                                    onPress={() => toggleCuisine(cuisine)}
                                    style={[styles.optionRow, { borderBottomColor: theme.border }]}
                                >
                                    <Ionicons
                                        name={getCuisineIcon(cuisine) as any}
                                        size={22}
                                        color={theme.textMuted}
                                        style={styles.cuisineIcon}
                                    />
                                    <Text style={[styles.optionLabel, { color: theme.text, flex: 1 }]}>
                                        {cuisine}
                                    </Text>
                                    <View
                                        style={[
                                            styles.checkbox,
                                            {
                                                backgroundColor: checked ? theme.primary : 'transparent',
                                                borderColor: checked ? theme.primary : theme.borderStrong,
                                            },
                                        ]}
                                    >
                                        {checked && <Ionicons name="checkmark" size={16} color="#fff" />}
                                    </View>
                                </Pressable>
                            );
                        })}
                    </ScrollView>
                );

            case 'rating':
                return (
                    <View style={styles.ratingContainer}>
                        <Text style={[styles.ratingLabel, { color: theme.text }]}>
                            Plus de {draft.minRating}
                        </Text>
                        <View style={styles.ratingSteps}>
                            {RATING_STEPS.map(step => (
                                <Pressable key={step} onPress={() => setRating(step)} style={styles.ratingStepHit}>
                                    <Text style={[styles.ratingStepText, { color: theme.textMuted }]}>
                                        {step}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                        <View style={styles.sliderTrack}>
                            <View
                                style={[
                                    styles.sliderFill,
                                    {
                                        backgroundColor: theme.text,
                                        width: `${((draft.minRating - 3) / 2) * 100}%`,
                                    },
                                ]}
                            />
                            <View
                                style={[
                                    styles.sliderThumb,
                                    {
                                        backgroundColor: theme.text,
                                        left: `${((draft.minRating - 3) / 2) * 100}%`,
                                    },
                                ]}
                            />
                        </View>
                    </View>
                );

            case 'price':
                return (
                    <View style={styles.priceContainer}>
                        <View style={styles.priceRow}>
                            {[1, 2, 3, 4].map(level => {
                                const selected = draft.priceRanges.includes(level);
                                return (
                                    <Pressable
                                        key={level}
                                        onPress={() => togglePriceRange(level)}
                                        style={[
                                            styles.priceChip,
                                            {
                                                backgroundColor: selected ? theme.text : 'transparent',
                                                borderColor: theme.borderStrong,
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.priceChipText,
                                                { color: selected ? theme.background : theme.text },
                                            ]}
                                        >
                                            {'$'.repeat(level)}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>
                );

            case 'sort':
                return (
                    <View style={styles.optionsList}>
                        {[
                            { key: 'recommended' as const, label: 'Recommandé' },
                            { key: 'rating' as const, label: 'Note' },
                            { key: 'distance' as const, label: 'Distance' },
                        ].map(option => {
                            const selected = draft.sortBy === option.key;
                            return (
                                <Pressable
                                    key={option.key}
                                    onPress={() => setSortBy(option.key)}
                                    style={[styles.optionRow, { borderBottomColor: theme.border }]}
                                >
                                    <View
                                        style={[
                                            styles.radioOuter,
                                            { borderColor: selected ? theme.text : theme.borderStrong },
                                        ]}
                                    >
                                        {selected && (
                                            <View style={[styles.radioInner, { backgroundColor: theme.text }]} />
                                        )}
                                    </View>
                                    <Text style={[styles.optionLabel, { color: theme.text }]}>
                                        {option.label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                );

            default:
                return null;
        }
    };

    return (
        <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
            {/* Backdrop */}
            <Pressable style={styles.backdrop} onPress={handleClose} />

            {/* Sheet */}
            <Animated.View
                style={[
                    styles.sheet,
                    {
                        backgroundColor: theme.background,
                        paddingBottom: Math.max(insets.bottom, Spacing.md) + Spacing.md,
                        transform: [{ translateY: slideAnim }],
                    },
                ]}
            >
                {/* Handle */}
                <View style={styles.handleZone}>
                    <View style={[styles.handle, { backgroundColor: theme.borderStrong }]} />
                </View>

                {/* Title */}
                <Text style={[styles.title, { color: theme.text }]}>{TITLES[type]}</Text>

                {/* Divider */}
                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                {/* Content */}
                {renderContent()}

                {/* Appliquer button */}
                <Pressable
                    onPress={handleApply}
                    style={[styles.applyButton, { backgroundColor: theme.text }]}
                >
                    <Text style={[styles.applyButtonText, { color: theme.background }]}>Appliquer</Text>
                </Pressable>

                {/* Réinitialiser */}
                <Pressable onPress={handleReset} style={styles.resetButton}>
                    <Text style={[styles.resetButtonText, { color: theme.text }]}>Réinitialiser</Text>
                </Pressable>
            </Animated.View>
        </Modal>
    );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: Radii.xxl,
        borderTopRightRadius: Radii.xxl,
        maxHeight: SCREEN_HEIGHT * 0.7,
    },
    handleZone: {
        alignItems: 'center',
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.xs,
    },
    handle: {
        width: 42,
        height: 5,
        borderRadius: 999,
    },
    title: {
        ...Typography.subtitle2,
        fontWeight: '700',
        textAlign: 'center',
        paddingVertical: Spacing.md,
    },
    divider: {
        height: 1,
        marginHorizontal: Spacing.md,
    },
    scrollContent: {
        maxHeight: SCREEN_HEIGHT * 0.35,
    },
    optionsList: {
        paddingHorizontal: Spacing.md,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        gap: Spacing.md,
    },
    optionLabel: {
        ...Typography.body,
        fontWeight: '500',
    },
    checkbox: {
        width: 26,
        height: 26,
        borderRadius: 6,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cuisineIcon: {
        width: 28,
    },
    radioOuter: {
        width: 26,
        height: 26,
        borderRadius: 13,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioInner: {
        width: 14,
        height: 14,
        borderRadius: 7,
    },
    ratingContainer: {
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.md,
    },
    ratingLabel: {
        ...Typography.body,
        fontWeight: '500',
        marginBottom: Spacing.lg,
    },
    ratingSteps: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.sm,
    },
    ratingStepHit: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
    },
    ratingStepText: {
        ...Typography.body,
        fontWeight: '600',
    },
    sliderTrack: {
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        position: 'relative',
    },
    sliderFill: {
        height: 4,
        borderRadius: 2,
        position: 'absolute',
        left: 0,
        top: 0,
    },
    sliderThumb: {
        width: 22,
        height: 22,
        borderRadius: 11,
        position: 'absolute',
        top: -9,
        marginLeft: -11,
    },
    priceContainer: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.lg,
    },
    priceRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    priceChip: {
        flex: 1,
        height: 44,
        borderRadius: Radii.full,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    priceChipText: {
        ...Typography.body,
        fontWeight: '700',
    },
    applyButton: {
        marginHorizontal: Spacing.md,
        marginTop: Spacing.lg,
        height: 52,
        borderRadius: Radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    applyButtonText: {
        ...Typography.bodySemibold,
        fontWeight: '700',
    },
    resetButton: {
        marginTop: Spacing.md,
        alignItems: 'center',
        paddingVertical: Spacing.sm,
    },
    resetButtonText: {
        ...Typography.body,
        fontWeight: '600',
    },
});
