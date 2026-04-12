import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch, getErrorMessage } from '@/lib/api';
import { useTheme } from '@/hooks/use-theme';

interface PaymentProvider {
    code: string;
    label: string;
    supports: string[];
    configured: boolean;
}

interface ProvidersResponse {
    success: boolean;
    providers: PaymentProvider[];
    defaultProvider: string;
}

interface RestaurantPaymentSettings {
    payment_methods: unknown;
    payment_provider: string | null;
    payment_account_id: string | null;
}

interface PaymentMethods {
    cash: boolean;
    mtn_momo: boolean;
    orange_money: boolean;
    card: boolean;
}

const DEFAULT_METHODS: PaymentMethods = {
    cash: true,
    mtn_momo: true,
    orange_money: false,
    card: false,
};

function normalizeMethods(value: unknown): PaymentMethods {
    if (!value || typeof value !== 'object') return DEFAULT_METHODS;
    const source = value as Record<string, unknown>;
    return {
        cash: typeof source.cash === 'boolean' ? source.cash : DEFAULT_METHODS.cash,
        mtn_momo: typeof source.mtn_momo === 'boolean' ? source.mtn_momo : DEFAULT_METHODS.mtn_momo,
        orange_money: typeof source.orange_money === 'boolean' ? source.orange_money : DEFAULT_METHODS.orange_money,
        card: typeof source.card === 'boolean' ? source.card : DEFAULT_METHODS.card,
    };
}

export default function PaymentSettingsScreen() {
    const { session } = useAuth();
    const router = useRouter();
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [providers, setProviders] = useState<PaymentProvider[]>([]);
    const [defaultProvider, setDefaultProvider] = useState<string>('');
    const [paymentProvider, setPaymentProvider] = useState<string | null>(null);
    const [paymentAccountId, setPaymentAccountId] = useState<string | null>(null);
    const [methods, setMethods] = useState<PaymentMethods>(DEFAULT_METHODS);

    const loadData = useCallback(async () => {
        if (!session) {
            setLoading(false);
            return;
        }

        try {
            const [providersData, restaurantData] = await Promise.all([
                apiFetch<ProvidersResponse>('/api/payments/mtn/providers', session.access_token),
                apiFetch<RestaurantPaymentSettings>('/api/restaurant', session.access_token),
            ]);

            setProviders(providersData.providers ?? []);
            setDefaultProvider(providersData.defaultProvider ?? '');
            setPaymentProvider(restaurantData.payment_provider);
            setPaymentAccountId(restaurantData.payment_account_id);
            setMethods(normalizeMethods(restaurantData.payment_methods));
        } catch (error) {
            Alert.alert('Erreur', getErrorMessage(error, 'Impossible de charger les paramètres de paiement'));
        } finally {
            setLoading(false);
        }
    }, [session]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const methodRows = useMemo(
        () => [
            { key: 'cash', label: 'Espèces', description: 'Paiement comptant à la livraison' },
            { key: 'mtn_momo', label: 'MTN Mobile Money', description: 'Encaissement via MoMo' },
            { key: 'orange_money', label: 'Orange Money', description: 'Disponible quand configuré' },
            { key: 'card', label: 'Carte bancaire', description: 'Paiement carte (si activé)' },
        ] as const,
        []
    );

    const handleSave = async () => {
        if (!session) return;
        if (!Object.values(methods).some(Boolean)) {
            Alert.alert('Validation', 'Activez au moins un mode de paiement.');
            return;
        }

        setSaving(true);
        try {
            await apiFetch('/api/restaurant', session.access_token, {
                method: 'PATCH',
                body: JSON.stringify({
                    payment_methods: methods,
                }),
            });
            Alert.alert('Succès', 'Modes de paiement mis à jour.');
            router.back();
        } catch (error) {
            Alert.alert('Erreur', getErrorMessage(error, 'Impossible de sauvegarder les modes de paiement'));
        } finally {
            setSaving(false);
        }
    };

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
                <Text style={s.title}>Modes de paiement</Text>
                <View style={s.backButton} />
            </View>

            <ScrollView contentContainerStyle={s.content}>
                <View style={s.card}>
                    <Text style={s.sectionTitle}>Configuration fournisseur</Text>
                    {(providers.length ? providers : []).map((provider) => (
                        <View key={provider.code} style={s.providerRow}>
                            <View style={s.providerInfo}>
                                <Text style={s.providerName}>
                                    {provider.label} {provider.code === defaultProvider ? '(par défaut)' : ''}
                                </Text>
                                <Text style={s.providerMeta}>
                                    {provider.supports.join(', ')} · {provider.configured ? 'Configuré' : 'Non configuré'}
                                </Text>
                            </View>
                            <View style={[s.statusBadge, { backgroundColor: provider.configured ? `${theme.success}20` : `${theme.error}20` }]}>
                                <Text style={[s.statusBadgeText, { color: provider.configured ? theme.success : theme.error }]}>
                                    {provider.configured ? 'OK' : 'KO'}
                                </Text>
                            </View>
                        </View>
                    ))}
                    <Text style={s.helpText}>
                        Fournisseur actif: {paymentProvider ?? defaultProvider ?? 'mtn_momo'} · Compte: {paymentAccountId ?? 'non renseigné'}
                    </Text>
                </View>

                <View style={s.card}>
                    <Text style={s.sectionTitle}>Méthodes affichées aux clients</Text>
                    {methodRows.map((row) => (
                        <View key={row.key} style={s.methodRow}>
                            <View style={s.methodInfo}>
                                <Text style={s.methodLabel}>{row.label}</Text>
                                <Text style={s.methodDescription}>{row.description}</Text>
                            </View>
                            <Switch
                                value={methods[row.key]}
                                onValueChange={(value) => setMethods((prev) => ({ ...prev, [row.key]: value }))}
                                trackColor={{ false: theme.border, true: `${theme.primary}99` }}
                                thumbColor={methods[row.key] ? theme.primary : theme.textSecondary}
                            />
                        </View>
                    ))}
                </View>

                <TouchableOpacity style={[s.saveButton, saving && s.saveButtonDisabled]} onPress={handleSave} disabled={saving}>
                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveButtonText}>Enregistrer</Text>}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = (theme: ReturnType<typeof useTheme>) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: theme.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        backButton: {
            width: 36,
            height: 36,
            alignItems: 'center',
            justifyContent: 'center',
        },
        title: { fontSize: 17, fontWeight: '700', color: theme.text },
        content: { padding: 14, gap: 12, paddingBottom: 28 },
        card: {
            backgroundColor: theme.surface,
            borderRadius: 14,
            padding: 14,
            gap: 12,
        },
        sectionTitle: { fontSize: 14, fontWeight: '700', color: theme.text },
        providerRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
        },
        providerInfo: { flex: 1 },
        providerName: { color: theme.text, fontWeight: '700', fontSize: 13 },
        providerMeta: { color: theme.textSecondary, fontSize: 12, marginTop: 2 },
        statusBadge: {
            borderRadius: 999,
            paddingHorizontal: 8,
            paddingVertical: 4,
        },
        statusBadgeText: { fontSize: 11, fontWeight: '700' },
        helpText: { color: theme.textSecondary, fontSize: 12, marginTop: 4 },
        methodRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
        },
        methodInfo: { flex: 1 },
        methodLabel: { color: theme.text, fontSize: 13, fontWeight: '700' },
        methodDescription: { color: theme.textSecondary, fontSize: 11, marginTop: 2 },
        saveButton: {
            backgroundColor: theme.primary,
            borderRadius: 12,
            alignItems: 'center',
            paddingVertical: 14,
        },
        saveButtonDisabled: { opacity: 0.6 },
        saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    });
