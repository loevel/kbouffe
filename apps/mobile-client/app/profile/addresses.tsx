import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { getAddresses, createAddress, updateAddress, deleteAddress, type Address } from '@/lib/api';
import { Colors, Spacing, Radii, Typography, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { setMapPickerCallback, type PickedAddress } from '@/app/map-picker';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';

const LABEL_ICONS: Record<string, { icon: string; color: string }> = {
    Maison:  { icon: 'home', color: '#3b82f6' },
    Bureau:  { icon: 'briefcase', color: '#f59e0b' },
    default: { icon: 'location', color: '#10b981' },
};

function getLabelMeta(label: string) {
    return LABEL_ICONS[label] ?? LABEL_ICONS.default;
}

export default function AddressesScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const isDark = colorScheme === 'dark';

    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [newLabel, setNewLabel] = useState('');
    const [newAddress, setNewAddress] = useState('');
    const [newCity, setNewCity] = useState('Douala');
    const [pickedLat, setPickedLat] = useState<number | undefined>();
    const [pickedLng, setPickedLng] = useState<number | undefined>();

    const handleOpenMapPicker = () => {
        Haptics.selectionAsync();
        setMapPickerCallback((picked: PickedAddress) => {
            setNewAddress(picked.address);
            setNewCity(picked.city);
            setPickedLat(picked.lat);
            setPickedLng(picked.lng);
        });
        router.push('/map-picker');
    };

    useEffect(() => { fetchAddresses(); }, []);

    const fetchAddresses = async () => {
        setLoading(true);
        try {
            const list = await getAddresses();
            setAddresses(list);
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSetDefault = async (id: string) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        try {
            await updateAddress(id, { isDefault: true });
            fetchAddresses();
        } catch {
            Alert.alert('Erreur', 'Impossible de définir comme adresse par défaut.');
        }
    };

    const handleDelete = (id: string) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert('Supprimer', 'Supprimer cette adresse ?', [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Supprimer', style: 'destructive', onPress: async () => {
                    try {
                        await deleteAddress(id);
                        fetchAddresses();
                    } catch {
                        Alert.alert('Erreur', 'Impossible de supprimer cette adresse.');
                    }
                }
            },
        ]);
    };

    const handleAdd = async () => {
        if (!newLabel.trim() || !newAddress.trim()) {
            Alert.alert('Champs requis', 'Veuillez renseigner un label et une adresse.');
            return;
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        try {
            await createAddress({
                label: newLabel.trim(),
                address: newAddress.trim(),
                city: newCity.trim() || 'Douala',
                lat: pickedLat,
                lng: pickedLng,
                isDefault: addresses.length === 0,
            });
            setNewLabel('');
            setNewAddress('');
            setNewCity('Douala');
            setPickedLat(undefined);
            setPickedLng(undefined);
            setShowForm(false);
            fetchAddresses();
        } catch {
            Alert.alert('Erreur', 'Impossible d\'ajouter l\'adresse.');
        }
    };

    const LABEL_PRESETS = [
        { label: 'Maison', icon: 'home' },
        { label: 'Bureau', icon: 'briefcase' },
        { label: 'Autre', icon: 'location' },
    ];

    const renderAddress = ({ item, index }: { item: Address; index: number }) => {
        const meta = getLabelMeta(item.label);
        return (
            <Animated.View
                entering={FadeInDown.delay(index * 80).duration(400).springify()}
                exiting={FadeOut.duration(200)}
                layout={LinearTransition.springify()}
                style={[
                    styles.card,
                    { backgroundColor: theme.surface },
                    item.isDefault && { borderColor: theme.primary + '40', borderWidth: 1 },
                ]}
            >
                {/* Accent bar */}
                <View style={[styles.accentBar, { backgroundColor: meta.color }]} />

                <View style={styles.cardInner}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconCircle, { backgroundColor: meta.color + '15' }]}>
                            <Ionicons name={meta.icon as any} size={20} color={meta.color} />
                        </View>
                        <View style={styles.cardContent}>
                            <View style={styles.labelRow}>
                                <Text style={[styles.cardLabel, { color: theme.text }]}>{item.label}</Text>
                                {item.isDefault && (
                                    <View style={[styles.defaultBadge, { backgroundColor: theme.primary + '15' }]}>
                                        <Ionicons name="checkmark-circle" size={12} color={theme.primary} />
                                        <Text style={[styles.defaultBadgeText, { color: theme.primary }]}>Par défaut</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={[styles.cardAddress, { color: theme.text }]} numberOfLines={2}>{item.address}</Text>
                            <View style={styles.cityRow}>
                                <Ionicons name="navigate-outline" size={12} color={theme.icon} />
                                <Text style={[styles.cardCity, { color: theme.icon }]}>{item.city}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={[styles.cardActions, { borderTopColor: theme.border + '30' }]}>
                        {!item.isDefault && (
                            <Pressable
                                onPress={() => handleSetDefault(item.id)}
                                style={({ pressed }) => [
                                    styles.actionBtn,
                                    { backgroundColor: theme.primary + '08' },
                                    pressed && { opacity: 0.7 },
                                ]}
                            >
                                <Ionicons name="checkmark-circle-outline" size={16} color={theme.primary} />
                                <Text style={[styles.actionText, { color: theme.primary }]}>Par défaut</Text>
                            </Pressable>
                        )}
                        <View style={{ flex: 1 }} />
                        <Pressable
                            onPress={() => handleDelete(item.id)}
                            style={({ pressed }) => [
                                styles.actionBtn,
                                { backgroundColor: '#ef444408' },
                                pressed && { opacity: 0.7 },
                            ]}
                        >
                            <Ionicons name="trash-outline" size={16} color="#ef4444" />
                            <Text style={[styles.actionText, { color: '#ef4444' }]}>Supprimer</Text>
                        </Pressable>
                    </View>
                </View>
            </Animated.View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top, Spacing.md) }]}>
                <Pressable onPress={() => router.back()} hitSlop={8} style={[styles.backBtn, { backgroundColor: isDark ? '#ffffff08' : '#f1f5f9' }]}>
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Mes adresses</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.loadingWrapper}>
                    <ActivityIndicator color={theme.primary} size="large" />
                </View>
            ) : (
                <FlatList
                    data={addresses}
                    keyExtractor={item => item.id}
                    renderItem={renderAddress}
                    contentContainerStyle={[
                        styles.listContent,
                        { paddingBottom: insets.bottom + 100 },
                        addresses.length === 0 && { flex: 1 },
                    ]}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <Animated.View
                            entering={FadeInDown.duration(400).springify()}
                            style={styles.emptyState}
                        >
                            <View style={[styles.emptyIconCircle, { backgroundColor: theme.primary + '12' }]}>
                                <Ionicons name="location-outline" size={48} color={theme.primary} />
                            </View>
                            <Text style={[styles.emptyTitle, { color: theme.text }]}>Aucune adresse enregistrée</Text>
                            <Text style={[styles.emptyText, { color: theme.icon }]}>
                                Ajoutez vos adresses de livraison{'\n'}pour commander plus rapidement.
                            </Text>
                        </Animated.View>
                    }
                    ListFooterComponent={
                        showForm ? (
                            <Animated.View
                                entering={FadeInDown.duration(300).springify()}
                                style={[styles.formCard, { backgroundColor: theme.surface }]}
                            >
                                <View style={styles.formHeader}>
                                    <View style={[styles.formIconBox, { backgroundColor: theme.primary + '12' }]}>
                                        <Ionicons name="add-circle" size={18} color={theme.primary} />
                                    </View>
                                    <Text style={[styles.formTitle, { color: theme.text }]}>Nouvelle adresse</Text>
                                </View>

                                {/* Label presets */}
                                <View style={styles.labelPresets}>
                                    {LABEL_PRESETS.map(preset => (
                                        <Pressable
                                            key={preset.label}
                                            style={[
                                                styles.presetChip,
                                                {
                                                    backgroundColor: newLabel === preset.label ? theme.primary : (isDark ? '#ffffff08' : '#f1f5f9'),
                                                    borderColor: newLabel === preset.label ? theme.primary : theme.border + '60',
                                                },
                                            ]}
                                            onPress={() => {
                                                Haptics.selectionAsync();
                                                setNewLabel(preset.label);
                                            }}
                                        >
                                            <Ionicons
                                                name={preset.icon as any}
                                                size={16}
                                                color={newLabel === preset.label ? '#fff' : theme.icon}
                                            />
                                            <Text style={[
                                                styles.presetText,
                                                { color: newLabel === preset.label ? '#fff' : theme.text },
                                            ]}>
                                                {preset.label}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>

                                {newLabel === 'Autre' && (
                                    <TextInput
                                        style={[styles.input, { color: theme.text, borderColor: theme.border + '60', backgroundColor: isDark ? '#ffffff06' : '#f8fafc' }]}
                                        value={newLabel === 'Autre' ? '' : newLabel}
                                        onChangeText={setNewLabel}
                                        placeholder="Nom personnalisé"
                                        placeholderTextColor={theme.icon + '80'}
                                    />
                                )}

                                <TextInput
                                    style={[styles.input, { color: theme.text, borderColor: theme.border + '60', backgroundColor: isDark ? '#ffffff06' : '#f8fafc' }]}
                                    value={newAddress}
                                    onChangeText={setNewAddress}
                                    placeholder="Adresse complète"
                                    placeholderTextColor={theme.icon + '80'}
                                    multiline
                                />

                                {/* Map picker */}
                                <Pressable
                                    onPress={handleOpenMapPicker}
                                    style={({ pressed }) => [
                                        styles.mapPickerBtn,
                                        {
                                            backgroundColor: pickedLat ? '#10b98110' : theme.primary + '08',
                                            borderColor: pickedLat ? '#10b98130' : theme.primary + '25',
                                        },
                                        pressed && { opacity: 0.8 },
                                    ]}
                                >
                                    <View style={[styles.mapPickerIcon, { backgroundColor: pickedLat ? '#10b98118' : theme.primary + '15' }]}>
                                        <Ionicons name={pickedLat ? 'checkmark-circle' : 'map-outline'} size={18} color={pickedLat ? '#10b981' : theme.primary} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.mapPickerTitle, { color: pickedLat ? '#10b981' : theme.text }]}>
                                            {pickedLat ? 'Position confirmée ✓' : 'Choisir sur la carte'}
                                        </Text>
                                        <Text style={[styles.mapPickerSubtitle, { color: theme.icon }]}>
                                            {pickedLat ? 'Appuyez pour modifier' : 'Localisation précise pour la livraison'}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color={theme.border} />
                                </Pressable>

                                <TextInput
                                    style={[styles.input, { color: theme.text, borderColor: theme.border + '60', backgroundColor: isDark ? '#ffffff06' : '#f8fafc' }]}
                                    value={newCity}
                                    onChangeText={setNewCity}
                                    placeholder="Ville"
                                    placeholderTextColor={theme.icon + '80'}
                                />

                                <View style={styles.formButtons}>
                                    <Pressable
                                        onPress={() => { Haptics.selectionAsync(); setShowForm(false); }}
                                        style={({ pressed }) => [
                                            styles.cancelBtn,
                                            { borderColor: theme.border },
                                            pressed && { opacity: 0.7 },
                                        ]}
                                    >
                                        <Text style={[styles.cancelBtnText, { color: theme.text }]}>Annuler</Text>
                                    </Pressable>
                                    <Pressable
                                        onPress={handleAdd}
                                        style={({ pressed }) => [
                                            styles.addBtnFilled,
                                            { backgroundColor: theme.primary },
                                            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
                                        ]}
                                    >
                                        <Ionicons name="checkmark" size={18} color="#fff" />
                                        <Text style={styles.addBtnFilledText}>Ajouter</Text>
                                    </Pressable>
                                </View>
                            </Animated.View>
                        ) : null
                    }
                />
            )}

            {!showForm && (
                <Animated.View
                    entering={FadeInDown.delay(200).duration(400).springify()}
                    style={[styles.fabContainer, { bottom: insets.bottom + Spacing.md }]}
                >
                    <Pressable
                        style={({ pressed }) => [
                            styles.fab,
                            { backgroundColor: theme.primary },
                            pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] }
                        ]}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            setShowForm(true);
                        }}
                    >
                        <Ionicons name="add-circle-outline" size={22} color="#fff" />
                        <Text style={styles.fabText}>Ajouter une adresse</Text>
                    </Pressable>
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    /* Header */
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: { ...Typography.title3 },

    /* Loading */
    loadingWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    /* List */
    listContent: { padding: Spacing.md, gap: Spacing.md },

    /* Card */
    card: {
        borderRadius: Radii.xl,
        overflow: 'hidden',
        ...Shadows.sm,
    },
    accentBar: {
        height: 3,
        width: '100%',
    },
    cardInner: { padding: Spacing.md, gap: Spacing.md },
    cardHeader: { flexDirection: 'row', gap: Spacing.md },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardContent: { flex: 1 },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
    cardLabel: { ...Typography.bodySemibold, fontWeight: '700' },
    defaultBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: Radii.full,
    },
    defaultBadgeText: { fontSize: 11, fontWeight: '700' },
    cardAddress: { ...Typography.body, lineHeight: 20, marginBottom: 2 },
    cityRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    cardCity: { ...Typography.small, fontWeight: '500' },
    cardActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingTop: Spacing.sm,
        borderTopWidth: 1,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: Radii.md,
    },
    actionText: { ...Typography.caption, fontWeight: '600' },

    /* EmptyState */
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.xl,
        gap: Spacing.md,
    },
    emptyIconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
    },
    emptyTitle: { ...Typography.title3, textAlign: 'center' },
    emptyText: { ...Typography.body, textAlign: 'center', lineHeight: 22 },

    /* Form */
    formCard: {
        borderRadius: Radii.xl,
        padding: Spacing.md,
        gap: Spacing.md,
        marginTop: Spacing.sm,
        ...Shadows.sm,
    },
    formHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    formIconBox: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    formTitle: { ...Typography.bodySemibold, fontWeight: '700' },
    labelPresets: { flexDirection: 'row', gap: Spacing.sm },
    presetChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: Radii.full,
        borderWidth: 1,
    },
    presetText: { ...Typography.caption, fontWeight: '600' },
    input: {
        ...Typography.body,
        padding: Spacing.sm + 2,
        paddingHorizontal: Spacing.md,
        borderRadius: Radii.lg,
        borderWidth: 1,
    },
    mapPickerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        padding: Spacing.sm + 2,
        borderRadius: Radii.lg,
        borderWidth: 1,
    },
    mapPickerIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mapPickerTitle: { ...Typography.captionSemibold, fontWeight: '600' },
    mapPickerSubtitle: { ...Typography.small, marginTop: 1 },
    formButtons: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
    cancelBtn: {
        flex: 1,
        paddingVertical: Spacing.sm + 4,
        borderRadius: Radii.full,
        borderWidth: 1,
        alignItems: 'center',
    },
    cancelBtnText: { ...Typography.bodySemibold },
    addBtnFilled: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.xs,
        paddingVertical: Spacing.sm + 4,
        borderRadius: Radii.full,
    },
    addBtnFilledText: { color: '#fff', ...Typography.bodySemibold, fontWeight: '700' },

    /* FAB */
    fabContainer: {
        position: 'absolute',
        left: Spacing.md,
        right: Spacing.md,
    },
    fab: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
        borderRadius: Radii.full,
        ...Shadows.md,
    },
    fabText: { color: '#fff', ...Typography.bodySemibold, fontWeight: '700' },
});
