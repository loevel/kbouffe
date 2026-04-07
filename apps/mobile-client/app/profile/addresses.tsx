import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getAddresses, createAddress, updateAddress, deleteAddress, type Address } from '@/lib/api';
import { Colors, Spacing, Radii, Typography, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { setMapPickerCallback, type PickedAddress } from '@/app/map-picker';

export default function AddressesScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [newLabel, setNewLabel] = useState('');
    const [newAddress, setNewAddress] = useState('');
    const [newCity, setNewCity] = useState('Douala');
    const [pickedLat, setPickedLat] = useState<number | undefined>();
    const [pickedLng, setPickedLng] = useState<number | undefined>();

    const handleOpenMapPicker = () => {
        setMapPickerCallback((picked: PickedAddress) => {
            setNewAddress(picked.address);
            setNewCity(picked.city);
            setPickedLat(picked.lat);
            setPickedLng(picked.lng);
        });
        router.push('/map-picker');
    };

    useEffect(() => {
        fetchAddresses();
    }, []);

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
        try {
            await updateAddress(id, { isDefault: true });
            fetchAddresses();
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de definir comme adresse par defaut.');
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert('Supprimer', 'Supprimer cette adresse ?', [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Supprimer', style: 'destructive', onPress: async () => {
                try {
                    await deleteAddress(id);
                    fetchAddresses();
                } catch (error) {
                    Alert.alert('Erreur', 'Impossible de supprimer cette adresse.');
                }
            } },
        ]);
    };

    const handleAdd = async () => {
        if (!newLabel.trim() || !newAddress.trim()) return;
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
        } catch (error) {
            Alert.alert('Erreur', 'Impossible d\'ajouter l\'adresse.');
        }
    };

    const renderAddress = ({ item }: { item: Address }) => (
        <View style={[styles.card, { backgroundColor: theme.background, borderColor: item.isDefault ? theme.primary : theme.border }]}>
            <View style={styles.cardHeader}>
                <View style={[styles.iconCircle, { backgroundColor: theme.primary + '15' }]}>
                    <Ionicons
                        name={item.label === 'Maison' ? 'home-outline' : item.label === 'Bureau' ? 'briefcase-outline' : 'location-outline'}
                        size={20}
                        color={theme.primary}
                    />
                </View>
                <View style={styles.cardContent}>
                    <View style={styles.labelRow}>
                        <Text style={[styles.cardLabel, { color: theme.text }]}>{item.label}</Text>
                        {item.isDefault && (
                            <View style={[styles.defaultBadge, { backgroundColor: theme.primary + '20' }]}>
                                <Text style={[styles.defaultBadgeText, { color: theme.primary }]}>Par defaut</Text>
                            </View>
                        )}
                    </View>
                    <Text style={[styles.cardAddress, { color: theme.icon }]}>{item.address}</Text>
                    <Text style={[styles.cardCity, { color: theme.icon }]}>{item.city}</Text>
                </View>
            </View>
            <View style={styles.cardActions}>
                {!item.isDefault && (
                    <Pressable onPress={() => handleSetDefault(item.id)} style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}>
                        <Ionicons name="checkmark-circle-outline" size={18} color={theme.primary} />
                        <Text style={[styles.actionText, { color: theme.primary }]}>Par defaut</Text>
                    </Pressable>
                )}
                <Pressable onPress={() => handleDelete(item.id)} style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}>
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    <Text style={[styles.actionText, { color: '#ef4444' }]}>Supprimer</Text>
                </Pressable>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <FlatList
                data={addresses}
                keyExtractor={item => item.id}
                renderItem={renderAddress}
                contentContainerStyle={{ padding: Spacing.md, paddingBottom: insets.bottom + 100, gap: Spacing.sm }}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="location-outline" size={48} color={theme.icon} />
                        <Text style={[styles.emptyText, { color: theme.icon }]}>Aucune adresse enregistree</Text>
                    </View>
                }
                ListFooterComponent={
                    showForm ? (
                        <View style={[styles.formCard, { borderColor: theme.border }]}>
                            <Text style={[styles.formTitle, { color: theme.text }]}>Nouvelle adresse</Text>
                            <TextInput
                                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                                value={newLabel}
                                onChangeText={setNewLabel}
                                placeholder="Label (ex: Maison, Bureau)"
                                placeholderTextColor={theme.icon}
                            />
                            <TextInput
                                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                                value={newAddress}
                                onChangeText={setNewAddress}
                                placeholder="Adresse complete"
                                placeholderTextColor={theme.icon}
                            />
                            {/* Map picker button */}
                            <Pressable
                                onPress={handleOpenMapPicker}
                                style={[styles.mapPickerBtn, { borderColor: theme.primary, backgroundColor: theme.primary + '10' }]}
                            >
                                <Ionicons name="map-outline" size={18} color={theme.primary} />
                                <Text style={[styles.mapPickerText, { color: theme.primary }]}>
                                    {pickedLat ? '📍 Position sur carte ✓' : 'Choisir sur la carte'}
                                </Text>
                            </Pressable>
                            <TextInput
                                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                                value={newCity}
                                onChangeText={setNewCity}
                                placeholder="Ville"
                                placeholderTextColor={theme.icon}
                            />
                            <View style={styles.formButtons}>
                                <Pressable onPress={() => setShowForm(false)} style={[styles.cancelBtn, { borderColor: theme.border }]}>
                                    <Text style={[styles.cancelBtnText, { color: theme.text }]}>Annuler</Text>
                                </Pressable>
                                <Pressable onPress={handleAdd} style={[styles.addBtnFilled, { backgroundColor: theme.primary }]}>
                                    <Text style={styles.addBtnFilledText}>Ajouter</Text>
                                </Pressable>
                            </View>
                        </View>
                    ) : null
                }
            />

            {!showForm && (
                <View style={[styles.fabContainer, { bottom: insets.bottom + Spacing.md }]}>
                    <Pressable
                        style={[styles.fab, { backgroundColor: theme.primary }]}
                        onPress={() => setShowForm(true)}
                    >
                        <Ionicons name="add" size={24} color="#fff" />
                        <Text style={styles.fabText}>Ajouter une adresse</Text>
                    </Pressable>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    card: {
        borderRadius: Radii.lg,
        borderWidth: 1,
        padding: Spacing.md,
        ...Shadows.sm,
    },
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
    cardLabel: { ...Typography.body, fontWeight: '600' },
    defaultBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radii.full },
    defaultBadgeText: { ...Typography.small, fontWeight: '600' },
    cardAddress: { ...Typography.caption },
    cardCity: { ...Typography.small, marginTop: 2 },
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: Spacing.md,
        marginTop: Spacing.md,
        paddingTop: Spacing.sm,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#e2e8f0',
    },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    actionText: { ...Typography.caption, fontWeight: '500' },
    mapPickerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        padding: Spacing.md,
        borderRadius: Radii.lg,
        borderWidth: 1,
    },
    mapPickerText: { ...Typography.body, fontWeight: '500' },
    empty: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.md },
    emptyText: { ...Typography.body },
    formCard: {
        borderRadius: Radii.lg,
        borderWidth: 1,
        padding: Spacing.md,
        gap: Spacing.sm,
        marginTop: Spacing.sm,
    },
    formTitle: { ...Typography.title3, marginBottom: Spacing.xs },
    input: {
        ...Typography.body,
        padding: Spacing.md,
        borderRadius: Radii.lg,
        borderWidth: 1,
    },
    formButtons: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
    cancelBtn: {
        flex: 1,
        padding: Spacing.md,
        borderRadius: Radii.full,
        borderWidth: 1,
        alignItems: 'center',
    },
    cancelBtnText: { ...Typography.body, fontWeight: '500' },
    addBtnFilled: {
        flex: 1,
        padding: Spacing.md,
        borderRadius: Radii.full,
        alignItems: 'center',
    },
    addBtnFilledText: { color: '#fff', ...Typography.body, fontWeight: '600' },
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
        padding: Spacing.md,
        borderRadius: Radii.full,
        ...Shadows.md,
    },
    fabText: { color: '#fff', ...Typography.body, fontWeight: '600' },
});
