import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
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
import { PermissionGate } from '@/components/PermissionGate';

interface GiftCard {
    id: string;
    balance: number;
    initial_amount: number;
    beneficiary_name?: string;
    status: 'active' | 'expired' | 'depleted' | 'inactive';
    created_at: string;
}

interface GiftCardsResponse {
    cards: GiftCard[];
    stats: {
        active_count: number;
        total_balance: number;
    };
}

export default function GiftCardsScreen() {
    const { session } = useAuth();
    const router = useRouter();
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [cards, setCards] = useState<GiftCard[]>([]);
    const [stats, setStats] = useState({ active_count: 0, total_balance: 0 });
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [amount, setAmount] = useState('');
    const [beneficiary, setBeneficiary] = useState('');

    const loadCards = useCallback(async () => {
        if (!session) {
            setLoading(false);
            return;
        }

        try {
            const data = await apiFetch<GiftCardsResponse>('/api/gift-cards', session.access_token);
            setCards(data.cards || []);
            setStats(data.stats);
        } catch (err) {
            // API non implémentée
            console.log('Gift cards non disponibles');
            setCards([]);
            setStats({ active_count: 0, total_balance: 0 });
        } finally {
            setLoading(false);
        }
    }, [session]);

    useEffect(() => {
        loadCards();
    }, [loadCards]);

    const handleCreateCard = async () => {
        if (!amount.trim() || parseFloat(amount) <= 0) {
            Alert.alert('Erreur', 'Veuillez entrer un montant valide');
            return;
        }

        if (!session) return;

        setSaving(true);
        try {
            await apiFetch(
                '/api/gift-cards',
                session.access_token,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        initial_amount: parseFloat(amount),
                        beneficiary_name: beneficiary || undefined,
                    }),
                }
            );
            Alert.alert('Succès', 'Carte cadeau créée');
            setShowCreateModal(false);
            setAmount('');
            setBeneficiary('');
            await loadCards();
        } catch (err) {
            Alert.alert('Erreur', getErrorMessage(err, 'Impossible de créer la carte'));
        } finally {
            setSaving(false);
        }
    };

    const s = styles(theme);

    if (loading) {
        return (
            <SafeAreaView style={s.container} edges={['top']}>
                <ActivityIndicator style={{ marginTop: 40 }} size="large" color={theme.primary} />
            </SafeAreaView>
        );
    }

    return (
        <PermissionGate permission="marketing:read">
        <SafeAreaView style={s.container} edges={['top']}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={s.title}>Cartes cadeaux</Text>
                <TouchableOpacity onPress={() => setShowCreateModal(true)} style={s.backButton}>
                    <Ionicons name="add" size={22} color={theme.primary} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={cards}
                keyExtractor={(item) => item.id}
                contentContainerStyle={s.content}
                ListHeaderComponent={
                    <>
                        <View style={[s.statsRow, { gap: 12 }]}>
                            <View style={[s.statCard, { backgroundColor: theme.surface }]}>
                                <Text style={[s.statLabel, { color: theme.textSecondary }]}>Cartes actives</Text>
                                <Text style={[s.statValue, { color: theme.text }]}>{stats.active_count}</Text>
                            </View>
                            <View style={[s.statCard, { backgroundColor: theme.surface }]}>
                                <Text style={[s.statLabel, { color: theme.textSecondary }]}>Solde total</Text>
                                <Text style={[s.statValue, { color: theme.text }]}>{stats.total_balance.toLocaleString()} F</Text>
                            </View>
                        </View>
                    </>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity style={[s.card, { backgroundColor: theme.surface }]}>
                        <View style={s.cardHeader}>
                            <View>
                                <Text style={[s.cardTitle, { color: theme.text }]}>{item.beneficiary_name || 'Carte cadeau'}</Text>
                                <Text style={[s.cardDate, { color: theme.textSecondary }]}>
                                    {new Date(item.created_at).toLocaleDateString('fr-FR')}
                                </Text>
                            </View>
                            <View style={[s.statusBadge, { backgroundColor: item.status === 'active' ? '#22c55e20' : '#ef444420' }]}>
                                <Text style={[s.statusText, { color: item.status === 'active' ? '#16a34a' : '#991b1b' }]}>
                                    {item.status === 'active' ? 'Active' : 'Inactive'}
                                </Text>
                            </View>
                        </View>

                        <View style={s.cardProgress}>
                            <View style={[s.progressBar, { backgroundColor: theme.border }]}>
                                <View
                                    style={[
                                        s.progressFill,
                                        {
                                            backgroundColor: theme.primary,
                                            width: `${Math.max(0, Math.min(100, (item.balance / item.initial_amount) * 100))}%`,
                                        },
                                    ]}
                                />
                            </View>
                            <Text style={[s.progressText, { color: theme.text }]}>
                                {item.balance.toLocaleString()} F / {item.initial_amount.toLocaleString()} F
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View style={s.emptyState}>
                        <Text style={s.emptyIcon}>🎁</Text>
                        <Text style={[s.emptyText, { color: theme.text }]}>Aucune carte cadeau</Text>
                    </View>
                }
            />

            <Modal
                visible={showCreateModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowCreateModal(false)}
            >
                <View style={s.modalOverlay}>
                    <View style={[s.modalContent, { backgroundColor: theme.surface }]}>
                        <View style={s.modalHeader}>
                            <Text style={[s.modalTitle, { color: theme.text }]}>Nouvelle carte cadeau</Text>
                            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                                <Ionicons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={s.formContent}>
                            <Text style={[s.label, { color: theme.text }]}>Montant (FCFA)</Text>
                            <TextInput
                                style={[s.input, { color: theme.text, borderColor: theme.border }]}
                                placeholder="Ex: 10000"
                                placeholderTextColor={theme.textSecondary}
                                value={amount}
                                onChangeText={(text) => setAmount(text.replace(/[^0-9]/g, ''))}
                                keyboardType="number-pad"
                                editable={!saving}
                            />

                            <Text style={[s.label, { color: theme.text, marginTop: 16 }]}>Bénéficiaire (optionnel)</Text>
                            <TextInput
                                style={[s.input, { color: theme.text, borderColor: theme.border }]}
                                placeholder="Ex: Jean Dupont"
                                placeholderTextColor={theme.textSecondary}
                                value={beneficiary}
                                onChangeText={setBeneficiary}
                                editable={!saving}
                            />
                        </ScrollView>

                        <View style={s.formActions}>
                            <TouchableOpacity
                                style={s.cancelButton}
                                onPress={() => setShowCreateModal(false)}
                                disabled={saving}
                            >
                                <Text style={[s.buttonText, { color: theme.text }]}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[s.submitButton, { backgroundColor: theme.primary }]}
                                onPress={handleCreateCard}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator color="#fff" size={14} />
                                ) : (
                                    <Text style={s.submitButtonText}>Créer</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
        </PermissionGate>
    );
}

const styles = (theme: any) =>
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
        backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
        title: { fontSize: 17, fontWeight: '700', color: theme.text },
        content: { padding: 16, paddingBottom: 32 },
        statsRow: { marginBottom: 16, flexDirection: 'row' },
        statCard: { flex: 1, borderRadius: 12, padding: 12 },
        statLabel: { fontSize: 11, fontWeight: '600' },
        statValue: { fontSize: 16, fontWeight: '700', marginTop: 4 },
        card: { borderRadius: 12, padding: 14, marginBottom: 10 },
        cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
        cardTitle: { fontSize: 14, fontWeight: '600' },
        cardDate: { fontSize: 11, marginTop: 2 },
        statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
        statusText: { fontSize: 11, fontWeight: '600' },
        cardProgress: { gap: 8 },
        progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
        progressFill: { height: '100%', borderRadius: 3 },
        progressText: { fontSize: 12, fontWeight: '600' },
        emptyState: { alignItems: 'center', paddingVertical: 60 },
        emptyIcon: { fontSize: 48, marginBottom: 12 },
        emptyText: { fontSize: 16, fontWeight: '700' },
        modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
        modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 16, paddingVertical: 20 },
        modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
        modalTitle: { fontSize: 17, fontWeight: '700' },
        formContent: { maxHeight: 200, marginBottom: 20 },
        label: { fontSize: 12, fontWeight: '600' },
        input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, marginTop: 6 },
        formActions: { flexDirection: 'row', gap: 10 },
        cancelButton: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: theme.border },
        submitButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
        buttonText: { fontWeight: '600', fontSize: 13 },
        submitButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
    });
