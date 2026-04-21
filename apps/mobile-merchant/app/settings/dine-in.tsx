import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
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

interface DineInSettings {
    has_dine_in: boolean;
    has_reservations: boolean;
    dine_in_service_fee: number;
    total_tables: number;
    qr_code_enabled: boolean;
    table_numbering_enabled: boolean;
}

export default function DineInSettingsScreen() {
    const { session } = useAuth();
    const router = useRouter();
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<DineInSettings>({
        has_dine_in: false,
        has_reservations: false,
        dine_in_service_fee: 0,
        total_tables: 0,
        qr_code_enabled: false,
        table_numbering_enabled: false,
    });

    const loadSettings = useCallback(async () => {
        if (!session) { setLoading(false); return; }
        try {
            const data = await apiFetch<DineInSettings>('/api/restaurant/dine-in', session.access_token);
            setSettings({
                has_dine_in: data.has_dine_in ?? false,
                has_reservations: data.has_reservations ?? false,
                dine_in_service_fee: data.dine_in_service_fee ?? 0,
                total_tables: data.total_tables ?? 0,
                qr_code_enabled: data.qr_code_enabled ?? false,
                table_numbering_enabled: data.table_numbering_enabled ?? false,
            });
        } catch (err) {
            console.error('Erreur chargement dine-in:', err);
        } finally {
            setLoading(false);
        }
    }, [session]);

    useEffect(() => { loadSettings(); }, [loadSettings]);

    const handleSave = async () => {
        if (!session) return;
        setSaving(true);
        try {
            await apiFetch('/api/restaurant/dine-in', session.access_token, {
                method: 'PATCH',
                body: JSON.stringify({
                    has_dine_in: settings.has_dine_in,
                    dine_in_service_fee: settings.dine_in_service_fee,
                    total_tables: settings.total_tables,
                    qr_code_enabled: settings.qr_code_enabled,
                    table_numbering_enabled: settings.table_numbering_enabled,
                }),
            });
            Alert.alert('Succès', 'Paramètres enregistrés');
        } catch (err) {
            Alert.alert('Erreur', getErrorMessage(err, 'Impossible d\'enregistrer'));
        } finally {
            setSaving(false);
        }
    };

    const set = (key: keyof DineInSettings, value: boolean | number) =>
        setSettings((prev) => ({ ...prev, [key]: value }));

    const s = styles(theme);

    if (loading) {
        return (
            <SafeAreaView style={s.container} edges={['top']}>
                <ActivityIndicator style={{ marginTop: 40 }} size="large" color={theme.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={s.container} edges={['top']}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={s.title}>Service sur place</Text>
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

                    {/* Activation principale */}
                    <View style={s.section}>
                        <Text style={[s.sectionTitle, { color: theme.text }]}>Activation</Text>
                        <View style={[s.card, { backgroundColor: theme.surface }]}>
                            <View style={s.row}>
                                <View style={[s.iconWrap, { backgroundColor: theme.primary + '15' }]}>
                                    <Ionicons name="restaurant" size={20} color={theme.primary} />
                                </View>
                                <View style={s.rowText}>
                                    <Text style={[s.rowLabel, { color: theme.text }]}>Service sur place</Text>
                                    <Text style={[s.rowSub, { color: theme.textSecondary }]}>Les clients mangent au restaurant</Text>
                                </View>
                                <Switch
                                    value={settings.has_dine_in}
                                    onValueChange={(v) => set('has_dine_in', v)}
                                    trackColor={{ false: theme.border, true: theme.primary }}
                                    thumbColor="#fff"
                                />
                            </View>

                            {settings.has_dine_in && (
                                <>
                                    <View style={[s.divider, { backgroundColor: theme.border }]} />
                                    <View style={s.row}>
                                        <View style={[s.iconWrap, { backgroundColor: theme.primary + '15' }]}>
                                            <Ionicons name="calendar" size={20} color={theme.primary} />
                                        </View>
                                        <View style={s.rowText}>
                                            <Text style={[s.rowLabel, { color: theme.text }]}>Réservations</Text>
                                            <Text style={[s.rowSub, { color: theme.textSecondary }]}>Activer les réservations de tables</Text>
                                        </View>
                                        <Switch
                                            value={settings.has_reservations}
                                            onValueChange={(v) => set('has_reservations', v)}
                                            trackColor={{ false: theme.border, true: theme.primary }}
                                            thumbColor="#fff"
                                        />
                                    </View>
                                </>
                            )}
                        </View>
                    </View>

                    {/* Tarification */}
                    {settings.has_dine_in && (
                        <View style={s.section}>
                            <Text style={[s.sectionTitle, { color: theme.text }]}>Tarification</Text>
                            <View style={[s.card, { backgroundColor: theme.surface }]}>
                                <View style={s.fieldGroup}>
                                    <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>Frais de service (%)</Text>
                                    <TextInput
                                        style={[s.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background }]}
                                        value={settings.dine_in_service_fee.toString()}
                                        onChangeText={(v) => set('dine_in_service_fee', parseFloat(v) || 0)}
                                        keyboardType="numeric"
                                        placeholder="0"
                                        placeholderTextColor={theme.textSecondary}
                                    />
                                    <Text style={[s.fieldHint, { color: theme.textSecondary }]}>Pourcentage ajouté à la note (0 = désactivé)</Text>
                                </View>

                                <View style={[s.divider, { backgroundColor: theme.border }]} />

                                <View style={s.fieldGroup}>
                                    <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>Nombre de tables</Text>
                                    <TextInput
                                        style={[s.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background }]}
                                        value={settings.total_tables.toString()}
                                        onChangeText={(v) => set('total_tables', parseInt(v) || 0)}
                                        keyboardType="number-pad"
                                        placeholder="0"
                                        placeholderTextColor={theme.textSecondary}
                                    />
                                    <Text style={[s.fieldHint, { color: theme.textSecondary }]}>Capacité totale du restaurant</Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* QR Code & Numérotation */}
                    {settings.has_dine_in && (
                        <View style={s.section}>
                            <Text style={[s.sectionTitle, { color: theme.text }]}>Commande & Tables</Text>
                            <View style={[s.card, { backgroundColor: theme.surface }]}>
                                <View style={s.row}>
                                    <View style={[s.iconWrap, { backgroundColor: '#8B5CF615' }]}>
                                        <Ionicons name="qr-code" size={20} color="#8B5CF6" />
                                    </View>
                                    <View style={s.rowText}>
                                        <Text style={[s.rowLabel, { color: theme.text }]}>Codes QR pour tables</Text>
                                        <Text style={[s.rowSub, { color: theme.textSecondary }]}>Scanner pour accéder au menu</Text>
                                    </View>
                                    <Switch
                                        value={settings.qr_code_enabled}
                                        onValueChange={(v) => set('qr_code_enabled', v)}
                                        trackColor={{ false: theme.border, true: '#8B5CF6' }}
                                        thumbColor="#fff"
                                    />
                                </View>

                                <View style={[s.divider, { backgroundColor: theme.border }]} />

                                <View style={s.row}>
                                    <View style={[s.iconWrap, { backgroundColor: '#059669' + '15' }]}>
                                        <Ionicons name="grid" size={20} color="#059669" />
                                    </View>
                                    <View style={s.rowText}>
                                        <Text style={[s.rowLabel, { color: theme.text }]}>Numérotation des tables</Text>
                                        <Text style={[s.rowSub, { color: theme.textSecondary }]}>Gestion des tables du restaurant</Text>
                                    </View>
                                    <Switch
                                        value={settings.table_numbering_enabled}
                                        onValueChange={(v) => set('table_numbering_enabled', v)}
                                        trackColor={{ false: theme.border, true: '#059669' }}
                                        thumbColor="#fff"
                                    />
                                </View>
                            </View>

                            {settings.qr_code_enabled && (
                                <View style={[s.infoBox, { backgroundColor: '#8B5CF6' + '10', borderColor: '#8B5CF6' + '30' }]}>
                                    <Ionicons name="information-circle" size={15} color="#8B5CF6" />
                                    <Text style={[s.infoText, { color: '#8B5CF6' }]}>
                                        Imprimez les codes QR pour chaque table et collez-les visiblement
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Conseils */}
                    <View style={[s.tipsCard, { backgroundColor: theme.surface }]}>
                        <Text style={[s.tipTitle, { color: theme.text }]}>Configuration conseillée</Text>
                        <View style={s.tipRow}>
                            <Ionicons name="checkmark-circle" size={14} color={theme.primary} />
                            <Text style={[s.tipItem, { color: theme.textSecondary }]}>Activez QR + numérotation pour une meilleure expérience</Text>
                        </View>
                        <View style={s.tipRow}>
                            <Ionicons name="checkmark-circle" size={14} color={theme.primary} />
                            <Text style={[s.tipItem, { color: theme.textSecondary }]}>Les clients accèdent au menu via QR ou numéro de table</Text>
                        </View>
                        <View style={s.tipRow}>
                            <Ionicons name="checkmark-circle" size={14} color={theme.primary} />
                            <Text style={[s.tipItem, { color: theme.textSecondary }]}>Gérez les commandes en temps réel depuis la caisse</Text>
                        </View>
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
        sectionTitle: { fontSize: 13, fontWeight: '700', paddingHorizontal: 4 },

        card: { borderRadius: 14, overflow: 'hidden' },
        row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
        iconWrap: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
        rowText: { flex: 1 },
        rowLabel: { fontSize: 14, fontWeight: '600' },
        rowSub: { fontSize: 12, marginTop: 2 },
        divider: { height: 1, marginHorizontal: 14 },

        fieldGroup: { padding: 14, gap: 6 },
        fieldLabel: { fontSize: 12, fontWeight: '600' },
        input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, fontWeight: '600' },
        fieldHint: { fontSize: 11, lineHeight: 16 },

        infoBox: { borderWidth: 1, borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 8 },
        infoText: { flex: 1, fontSize: 12, lineHeight: 17 },

        tipsCard: { borderRadius: 14, padding: 14, gap: 8 },
        tipTitle: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
        tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
        tipItem: { fontSize: 12, lineHeight: 18, flex: 1 },
    });
