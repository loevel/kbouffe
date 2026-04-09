import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Radii, Typography, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/auth-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface DietaryOption {
    id: string;
    label: string;
    icon: string;
    color: string;
    description: string;
}

interface AllergenOption {
    id: string;
    label: string;
    icon: string;
}

const DIETARY_OPTIONS: DietaryOption[] = [
    { id: 'vegetarian',   label: 'Végétarien',   icon: 'leaf-outline',        color: '#22c55e',  description: 'Sans viande ni poisson' },
    { id: 'vegan',        label: 'Végétalien',   icon: 'nutrition-outline',   color: '#10b981',  description: 'Sans produits animaux' },
    { id: 'halal',        label: 'Halal',         icon: 'moon-outline',        color: '#3b82f6',  description: 'Conforme aux règles halal' },
    { id: 'gluten_free',  label: 'Sans gluten',  icon: 'ban-outline',         color: '#f59e0b',  description: 'Adapté aux cœliaques' },
    { id: 'dairy_free',   label: 'Sans lactose', icon: 'water-outline',       color: '#6366f1',  description: 'Sans produits laitiers' },
    { id: 'low_calorie',  label: 'Léger',        icon: 'fitness-outline',     color: '#ec4899',  description: 'Plats moins caloriques' },
];

const ALLERGENS: AllergenOption[] = [
    { id: 'gluten',       label: 'Gluten',        icon: 'ban-outline' },
    { id: 'milk',         label: 'Lait',           icon: 'water-outline' },
    { id: 'eggs',         label: 'Œufs',           icon: 'ellipse-outline' },
    { id: 'peanuts',      label: 'Arachides',      icon: 'alert-circle-outline' },
    { id: 'tree_nuts',    label: 'Fruits à coque', icon: 'leaf-outline' },
    { id: 'soy',          label: 'Soja',           icon: 'leaf-outline' },
    { id: 'fish',         label: 'Poisson',        icon: 'fish-outline' },
    { id: 'shellfish',    label: 'Crustacés',      icon: 'fish-outline' },
];

const CUISINE_PREFS: { id: string; label: string; flag: string }[] = [
    { id: 'camerounaise', label: 'Camerounaise', flag: '🇨🇲' },
    { id: 'senegalaise',  label: 'Sénégalaise',  flag: '🇸🇳' },
    { id: 'ivoirienne',   label: 'Ivoirienne',   flag: '🇨🇮' },
    { id: 'francaise',    label: 'Française',    flag: '🇫🇷' },
    { id: 'italienne',    label: 'Italienne',    flag: '🇮🇹' },
    { id: 'asiatique',    label: 'Asiatique',    flag: '🥢' },
    { id: 'africaine',    label: 'Africaine',    flag: '🌍' },
    { id: 'libanaise',    label: 'Libanaise',    flag: '🇱🇧' },
];

interface Preferences {
    dietary: string[];
    allergens: string[];
    cuisines: string[];
}

export default function PreferencesScreen() {
    const router = useRouter();
    const { user, updateProfile } = useAuth();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const isDark = colorScheme === 'dark';

    const [prefs, setPrefs] = useState<Preferences>({ dietary: [], allergens: [], cuisines: [] });
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);

    useEffect(() => {
        const stored = (user as any)?.profile?.preferences;
        if (stored) {
            setPrefs({
                dietary:  stored.dietary  ?? [],
                allergens: stored.allergens ?? [],
                cuisines:  stored.cuisines  ?? [],
            });
        }
    }, [user]);

    const toggle = (key: keyof Preferences, id: string) => {
        void Haptics.selectionAsync();
        setPrefs(prev => {
            const list = prev[key];
            return {
                ...prev,
                [key]: list.includes(id) ? list.filter(x => x !== id) : [...list, id],
            };
        });
        setDirty(true);
    };

    const handleSave = async () => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSaving(true);
        try {
            await updateProfile({ profile: { ...(user as any)?.profile, preferences: prefs } } as any);
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setDirty(false);
            Alert.alert('Sauvegardé', 'Vos préférences ont été mises à jour.');
        } catch {
            Alert.alert('Erreur', 'Impossible de sauvegarder. Réessayez.');
        } finally {
            setSaving(false);
        }
    };

    const ChipRow = ({ items, selected, onToggle, colorFn }: {
        items: { id: string; label: string; icon?: string; flag?: string; color?: string; description?: string }[];
        selected: string[];
        onToggle: (id: string) => void;
        colorFn?: (item: typeof items[0]) => string;
    }) => (
        <View style={styles.chipGrid}>
            {items.map(item => {
                const active = selected.includes(item.id);
                const color = colorFn?.(item) ?? theme.primary;
                return (
                    <Pressable
                        key={item.id}
                        onPress={() => onToggle(item.id)}
                        style={[
                            styles.chip,
                            { borderColor: active ? color : theme.border, backgroundColor: active ? color + '15' : theme.surface },
                        ]}
                    >
                        {item.flag ? (
                            <Text style={styles.chipFlag}>{item.flag}</Text>
                        ) : item.icon ? (
                            <Ionicons name={item.icon as any} size={16} color={active ? color : theme.icon} />
                        ) : null}
                        <Text style={[styles.chipLabel, { color: active ? color : theme.text }]}>{item.label}</Text>
                        {active && <Ionicons name="checkmark" size={14} color={color} />}
                    </Pressable>
                );
            })}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { paddingTop: Math.max(insets.top, Spacing.md) }]}>
                <Pressable onPress={() => router.back()} hitSlop={8} style={[styles.backButton, { backgroundColor: isDark ? '#ffffff08' : '#f1f5f9' }]}>
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Préférences alimentaires</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Intro */}
                <Animated.View entering={FadeInDown.delay(100).duration(400).springify()} style={[styles.infoCard, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '30' }]}>
                    <Ionicons name="sparkles-outline" size={20} color={theme.primary} />
                    <Text style={[styles.infoText, { color: theme.text }]}>
                        Vos préférences nous aident à vous proposer des restaurants et plats adaptés à votre mode de vie.
                    </Text>
                </Animated.View>

                {/* Dietary */}
                <Animated.View entering={FadeInDown.delay(200).duration(400).springify()} style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.icon }]}>Régimes alimentaires</Text>
                    <ChipRow
                        items={DIETARY_OPTIONS}
                        selected={prefs.dietary}
                        onToggle={(id) => toggle('dietary', id)}
                        colorFn={(item) => (item as DietaryOption).color}
                    />
                </Animated.View>

                {/* Allergens */}
                <Animated.View entering={FadeInDown.delay(300).duration(400).springify()} style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.icon }]}>Allergènes à éviter</Text>
                    <View style={[styles.allergenNote, { backgroundColor: '#ef444410', borderColor: '#ef444430' }]}>
                        <Ionicons name="warning-outline" size={16} color="#ef4444" />
                        <Text style={styles.allergenNoteText}>
                            Pour votre sécurité, signalez toujours vos allergies directement au restaurant.
                        </Text>
                    </View>
                    <ChipRow
                        items={ALLERGENS}
                        selected={prefs.allergens}
                        onToggle={(id) => toggle('allergens', id)}
                        colorFn={() => '#ef4444'}
                    />
                </Animated.View>

                {/* Cuisine preferences */}
                <Animated.View entering={FadeInDown.delay(400).duration(400).springify()} style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.icon }]}>Cuisines préférées</Text>
                    <ChipRow
                        items={CUISINE_PREFS}
                        selected={prefs.cuisines}
                        onToggle={(id) => toggle('cuisines', id)}
                    />
                </Animated.View>

                {/* Summary */}
                {(prefs.dietary.length > 0 || prefs.allergens.length > 0 || prefs.cuisines.length > 0) && (
                    <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Text style={[styles.summaryTitle, { color: theme.text }]}>Résumé de vos préférences</Text>
                        {prefs.dietary.length > 0 && (
                            <Text style={[styles.summaryLine, { color: theme.icon }]}>
                                🥗 {prefs.dietary.map(id => DIETARY_OPTIONS.find(o => o.id === id)?.label).filter(Boolean).join(', ')}
                            </Text>
                        )}
                        {prefs.allergens.length > 0 && (
                            <Text style={[styles.summaryLine, { color: theme.icon }]}>
                                🚫 Allergie à: {prefs.allergens.map(id => ALLERGENS.find(o => o.id === id)?.label).filter(Boolean).join(', ')}
                            </Text>
                        )}
                        {prefs.cuisines.length > 0 && (
                            <Text style={[styles.summaryLine, { color: theme.icon }]}>
                                🍽 Cuisine: {prefs.cuisines.map(id => CUISINE_PREFS.find(o => o.id === id)?.label).filter(Boolean).join(', ')}
                            </Text>
                        )}
                    </View>
                )}

                <Pressable
                    style={[styles.saveButton, { backgroundColor: dirty ? theme.primary : theme.border, opacity: saving ? 0.7 : 1 }]}
                    onPress={handleSave}
                    disabled={saving || !dirty}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="save-outline" size={20} color="#fff" />
                            <Text style={styles.saveButtonText}>{dirty ? 'Sauvegarder les préférences' : 'Préférences à jour'}</Text>
                        </>
                    )}
                </Pressable>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
    },
    backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { ...Typography.title3 },
    scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.lg },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
        padding: Spacing.md,
        borderRadius: Radii.lg,
        borderWidth: 1,
    },
    infoText: { ...Typography.caption, flex: 1, lineHeight: 20 },
    section: { gap: Spacing.sm },
    sectionTitle: {
        ...Typography.small,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginLeft: Spacing.xs,
    },
    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: Radii.full,
        borderWidth: 1.5,
        ...Shadows.sm,
    },
    chipFlag: { fontSize: 16 },
    chipLabel: { ...Typography.caption, fontWeight: '600' },
    allergenNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.xs,
        padding: Spacing.sm,
        borderRadius: Radii.md,
        borderWidth: 1,
    },
    allergenNoteText: { ...Typography.small, color: '#ef4444', flex: 1, lineHeight: 17 },
    summaryCard: {
        padding: Spacing.md,
        borderRadius: Radii.lg,
        borderWidth: 1,
        gap: Spacing.xs,
    },
    summaryTitle: { ...Typography.captionSemibold, marginBottom: Spacing.xs },
    summaryLine: { ...Typography.caption, lineHeight: 20 },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        height: 52,
        borderRadius: Radii.lg,
    },
    saveButtonText: { color: '#fff', ...Typography.bodySemibold },
});
