import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch, getErrorMessage } from '@/lib/api';
import { useTheme } from '@/hooks/use-theme';

interface DeliverySettings {
    delivery_zones: string[];
    delivery_base_fee: number;
    delivery_per_km_fee: number;
    min_order_amount: number;
    free_delivery_threshold: number | null;
    estimated_delivery_time: number;
}

export default function ZonesSettingsScreen() {
    const { session } = useAuth();
    const router = useRouter();
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newZone, setNewZone] = useState('');
    const [form, setForm] = useState<DeliverySettings>({
        delivery_zones: [],
        delivery_base_fee: 0,
        delivery_per_km_fee: 0,
        min_order_amount: 0,
        free_delivery_threshold: null,
        estimated_delivery_time: 30,
    });

    const loadSettings = useCallback(async () => {
        if (!session) { setLoading(false); return; }
        try {
            const data = await apiFetch<any>('/api/restaurant', session.access_token);
            setForm({
                delivery_zones: Array.isArray(data.delivery_zones) ? data.delivery_zones : [],
                delivery_base_fee: data.delivery_base_fee ?? 0,
                delivery_per_km_fee: data.delivery_per_km_fee ?? 0,
                min_order_amount: data.min_order_amount ?? 0,
                free_delivery_threshold: data.free_delivery_threshold ?? null,
                estimated_delivery_time: data.estimated_delivery_time ?? 30,
            });
        } catch (err) {
            console.error('Erreur chargement livraison:', err);
        } finally {
            setLoading(false);
        }
    }, [session]);

    useEffect(() => { loadSettings(); }, [loadSettings]);

    const handleSave = async () => {
        if (!session) return;
        setSaving(true);
        try {
            await apiFetch('/api/restaurant', session.access_token, {
                method: 'PATCH',
                body: JSON.stringify({
                    delivery_zones: form.delivery_zones,
                    delivery_base_fee: form.delivery_base_fee,
                    delivery_per_km_fee: form.delivery_per_km_fee,
                    min_order_amount: form.min_order_amount,
                    free_delivery_threshold: form.free_delivery_threshold,
                    estimated_delivery_time: form.estimated_delivery_time,
                }),
            });
            Alert.alert('Succès', 'Paramètres de livraison enregistrés');
        } catch (err) {
            Alert.alert('Erreur', getErrorMessage(err, 'Impossible d\'enregistrer'));
        } finally {
            setSaving(false);
        }
    };

    const addZone = () => {
        const name = newZone.trim();
        if (!name) return;
        if (form.delivery_zones.includes(name)) {
            Alert.alert('Doublon', 'Cette zone existe déjà');
            return;
        }
        setForm((prev) => ({ ...prev, delivery_zones: [...prev.delivery_zones, name] }));
        setNewZone('');
    };

    const removeZone = (zone: string) => {
        setForm((prev) => ({ ...prev, delivery_zones: prev.delivery_zones.filter((z) => z !== zone) }));
    };

    const setField = (key: keyof DeliverySettings, val: number | null) =>
        setForm((prev) => ({ ...prev, [key]: val }));

    const s = styles(theme);

    if (loading) {
        return (
            <SafeAreaView style={s.container} edges={['top']}>
                <ActivityIndicator style={{ marginTop: 40 }} color={theme.primary} size="large" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={s.container} edges={['top']}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={s.title}>Zones de livraison</Text>
                <TouchableOpacity
                    style={[s.saveBtn, { backgroundColor: theme.primary, opacity: saving ? 0.6 : 1 }]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    <Text style={s.saveBtnText}>{saving ? 'Enreg...' : 'Enregistrer'}</Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={s.content}>

                    {/* Tarification */}
                    <View style={s.section}>
                        <Text style={[s.sectionTitle, { color: theme.text }]}>Tarification</Text>
                        <View style={[s.card, { backgroundColor: theme.surface }]}>
                            <View style={s.fieldGroup}>
                                <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>Frais de livraison de base (FCFA)</Text>
                                <TextInput
                                    style={[s.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background }]}
                                    value={form.delivery_base_fee.toString()}
                                    onChangeText={(v) => setField('delivery_base_fee', parseFloat(v) || 0)}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor={theme.textSecondary}
                                />
                            </View>

                            <View style={[s.divider, { backgroundColor: theme.border }]} />

                            <View style={s.fieldGroup}>
                                <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>Frais supplémentaire par km (FCFA)</Text>
                                <TextInput
                                    style={[s.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background }]}
                                    value={form.delivery_per_km_fee.toString()}
                                    onChangeText={(v) => setField('delivery_per_km_fee', parseFloat(v) || 0)}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor={theme.textSecondary}
                                />
                            </View>

                            <View style={[s.divider, { backgroundColor: theme.border }]} />

                            <View style={s.fieldGroup}>
                                <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>Livraison gratuite au-dessus de (FCFA)</Text>
                                <TextInput
                                    style={[s.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background }]}
                                    value={form.free_delivery_threshold?.toString() ?? ''}
                                    onChangeText={(v) => setField('free_delivery_threshold', v ? parseFloat(v) : null)}
                                    keyboardType="numeric"
                                    placeholder="Laisser vide pour désactiver"
                                    placeholderTextColor={theme.textSecondary}
                                />
                            </View>

                            <View style={[s.divider, { backgroundColor: theme.border }]} />

                            <View style={s.twoColumns}>
                                <View style={[s.fieldGroup, { flex: 1 }]}>
                                    <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>Commande minimum (FCFA)</Text>
                                    <TextInput
                                        style={[s.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background }]}
                                        value={form.min_order_amount.toString()}
                                        onChangeText={(v) => setField('min_order_amount', parseFloat(v) || 0)}
                                        keyboardType="numeric"
                                        placeholder="0"
                                        placeholderTextColor={theme.textSecondary}
                                    />
                                </View>
                                <View style={[s.fieldGroup, { flex: 1 }]}>
                                    <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>Délai moyen (min)</Text>
                                    <TextInput
                                        style={[s.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background }]}
                                        value={form.estimated_delivery_time.toString()}
                                        onChangeText={(v) => setField('estimated_delivery_time', parseInt(v) || 30)}
                                        keyboardType="number-pad"
                                        placeholder="30"
                                        placeholderTextColor={theme.textSecondary}
                                    />
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Zones */}
                    <View style={s.section}>
                        <Text style={[s.sectionTitle, { color: theme.text }]}>Zones desservies</Text>

                        <View style={[s.card, { backgroundColor: theme.surface }]}>
                            <View style={s.addRow}>
                                <TextInput
                                    style={[s.addInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background }]}
                                    value={newZone}
                                    onChangeText={setNewZone}
                                    placeholder="Ex: Centre-ville, Bastos..."
                                    placeholderTextColor={theme.textSecondary}
                                    onSubmitEditing={addZone}
                                    returnKeyType="done"
                                />
                                <TouchableOpacity
                                    style={[s.addBtn, { backgroundColor: theme.primary }]}
                                    onPress={addZone}
                                >
                                    <Ionicons name="add" size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>

                            {form.delivery_zones.length > 0 ? (
                                <View style={s.tagsWrap}>
                                    {form.delivery_zones.map((zone) => (
                                        <View key={zone} style={[s.tag, { backgroundColor: theme.primary + '15' }]}>
                                            <Text style={[s.tagText, { color: theme.primary }]}>{zone}</Text>
                                            <TouchableOpacity onPress={() => removeZone(zone)} style={s.tagRemove}>
                                                <Ionicons name="close" size={14} color={theme.primary} />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <Text style={[s.noZones, { color: theme.textSecondary }]}>Aucune zone ajoutée</Text>
                            )}
                        </View>
                    </View>

                    {/* Note responsabilité */}
                    <View style={[s.infoCard, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '30' }]}>
                        <Ionicons name="information-circle" size={16} color={theme.primary} />
                        <Text style={[s.infoText, { color: theme.primary }]}>
                            Kbouffe ne fournit pas de livreurs. Vous êtes responsable d'organiser l'acheminement de vos commandes.
                        </Text>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = (theme: any) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },
        header: {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 16, paddingVertical: 12,
            backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.border,
        },
        backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
        title: { fontSize: 17, fontWeight: '700', color: theme.text },
        saveBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
        saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

        content: { padding: 16, gap: 20, paddingBottom: 40 },
        section: { gap: 10 },
        sectionTitle: { fontSize: 13, fontWeight: '700', paddingHorizontal: 2 },

        card: { borderRadius: 14, overflow: 'hidden' },
        divider: { height: 1, marginHorizontal: 14 },
        fieldGroup: { padding: 14, gap: 6 },
        fieldLabel: { fontSize: 12, fontWeight: '600' },
        input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
        twoColumns: { flexDirection: 'row', gap: 0 },

        addRow: { flexDirection: 'row', gap: 10, padding: 14 },
        addInput: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
        addBtn: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

        tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 14, paddingBottom: 14 },
        tag: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
        tagText: { fontSize: 13, fontWeight: '600' },
        tagRemove: { padding: 2 },
        noZones: { paddingHorizontal: 14, paddingBottom: 14, fontSize: 13 },

        infoCard: { borderWidth: 1, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
        infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
    });
