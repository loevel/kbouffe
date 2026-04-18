import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { PermissionGate } from '@/components/PermissionGate';

interface CashSession {
    id: string;
    restaurantId: string;
    openedAt: string;
    closedAt?: string;
    startingCash: number;
    expectedCash: number;
    actualCash?: number;
    variance?: number;
    notes?: string;
    status: 'open' | 'closed';
}

export default function CaisseScreen() {
    const { profile, session } = useAuth();
    const theme = useTheme();
    const router = useRouter();

    const [currentSession, setCurrentSession] = useState<CashSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [showOpenModal, setShowOpenModal] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [startingCash, setStartingCash] = useState('');
    const [actualCash, setActualCash] = useState('');
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);
    const [sessions, setSessions] = useState<CashSession[]>([]);

    const loadSession = useCallback(async () => {
        if (!profile?.restaurantId || !session) {
            setLoading(false);
            return;
        }

        try {
            // Get current open session
            const { data: sessionData, error } = await supabase
                .from('pos_cash_sessions')
                .select('*')
                .eq('restaurant_id', profile.restaurantId)
                .eq('status', 'open')
                .order('opened_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (!error && sessionData) {
                setCurrentSession({
                    id: sessionData.id,
                    restaurantId: sessionData.restaurant_id,
                    openedAt: sessionData.opened_at,
                    closedAt: sessionData.closed_at,
                    startingCash: sessionData.starting_cash,
                    expectedCash: sessionData.expected_cash || 0,
                    actualCash: sessionData.actual_cash,
                    variance: sessionData.variance,
                    notes: sessionData.notes,
                    status: sessionData.status,
                });
            }

            // Get recent sessions for history
            const { data: historyData, error: historyError } = await supabase
                .from('pos_cash_sessions')
                .select('*')
                .eq('restaurant_id', profile.restaurantId)
                .order('opened_at', { ascending: false })
                .limit(10);

            if (!historyError && historyData) {
                setSessions(historyData.map((s: any) => ({
                    id: s.id,
                    restaurantId: s.restaurant_id,
                    openedAt: s.opened_at,
                    closedAt: s.closed_at,
                    startingCash: s.starting_cash,
                    expectedCash: s.expected_cash || 0,
                    actualCash: s.actual_cash,
                    variance: s.variance,
                    notes: s.notes,
                    status: s.status,
                })));
            }
        } catch (error) {
            console.error('Erreur lors du chargement de la session:', error);
        } finally {
            setLoading(false);
        }
    }, [profile?.restaurantId, session]);

    useEffect(() => {
        loadSession();
    }, [loadSession]);

    const handleOpenSession = async () => {
        if (!startingCash.trim() || !profile?.restaurantId) {
            Alert.alert('Erreur', 'Veuillez entrer un montant de départ');
            return;
        }

        setProcessing(true);
        try {
            const amount = parseFloat(startingCash);
            await supabase.from('pos_cash_sessions').insert({
                restaurant_id: profile.restaurantId,
                opening_user_id: profile.id,
                opened_at: new Date().toISOString(),
                starting_cash: amount,
                expected_cash: amount,
                status: 'open',
            });

            Alert.alert('Succès', 'Session de caisse ouverte');
            setShowOpenModal(false);
            setStartingCash('');
            await loadSession();
        } catch (error) {
            console.error('Erreur:', error);
            Alert.alert('Erreur', 'Impossible d\'ouvrir la session');
        } finally {
            setProcessing(false);
        }
    };

    const handleCloseSession = async () => {
        if (!actualCash.trim() || !currentSession) {
            Alert.alert('Erreur', 'Veuillez entrer le montant réel');
            return;
        }

        setProcessing(true);
        try {
            const actual = parseFloat(actualCash);
            const variance = actual - currentSession.expectedCash;

            await supabase
                .from('pos_cash_sessions')
                .update({
                    status: 'closed',
                    closed_at: new Date().toISOString(),
                    actual_cash: actual,
                    variance: variance,
                    notes: notes || null,
                })
                .eq('id', currentSession.id);

            Alert.alert(
                variance === 0 ? '✓ Équilibré' : variance > 0 ? 'Excédent' : 'Manquant',
                `Variance: ${variance > 0 ? '+' : ''}${variance.toLocaleString('fr-FR')} FCFA`,
                [{ text: 'OK', onPress: () => {
                    setShowCloseModal(false);
                    setActualCash('');
                    setNotes('');
                    loadSession();
                }}]
            );
        } catch (error) {
            console.error('Erreur:', error);
            Alert.alert('Erreur', 'Impossible de fermer la session');
        } finally {
            setProcessing(false);
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

    const formatFcfa = (amount: number) => amount.toLocaleString('fr-FR') + ' FCFA';

    return (
        <PermissionGate permission="orders:manage">
        <SafeAreaView style={s.container} edges={['top']}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={s.title}>Caisse</Text>
                <View style={s.backButton} />
            </View>

            <ScrollView contentContainerStyle={s.content}>
                {currentSession ? (
                    <>
                        <View style={[s.sessionCard, { borderColor: '#22c55e' }]}>
                            <View style={s.sessionHeader}>
                                <View>
                                    <Text style={s.sessionStatus}>Session active</Text>
                                    <Text style={s.sessionTime}>
                                        Ouvert à {new Date(currentSession.openedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>
                                <View style={[s.statusBadge, { backgroundColor: '#22c55e' }]}>
                                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                </View>
                            </View>

                            <View style={s.sessionDivider} />

                            <View style={s.sessionRow}>
                                <View>
                                    <Text style={s.sessionLabel}>Montant initial</Text>
                                    <Text style={s.sessionValue}>{formatFcfa(currentSession.startingCash)}</Text>
                                </View>
                                <View style={s.sessionSpacer} />
                                <View style={s.sessionRightAlign}>
                                    <Text style={s.sessionLabel}>Attendu</Text>
                                    <Text style={s.sessionValue}>{formatFcfa(currentSession.expectedCash)}</Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[s.closeButton, { backgroundColor: theme.error }]}
                                onPress={() => setShowCloseModal(true)}
                                disabled={processing}
                            >
                                <Ionicons name="stop-circle" size={18} color="#fff" />
                                <Text style={s.closeButtonText}>Fermer la session</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                ) : (
                    <View style={s.emptyCard}>
                        <Text style={s.emptyIcon}>💰</Text>
                        <Text style={s.emptyText}>Aucune session active</Text>
                        <Text style={s.emptyDescription}>Ouvrez une nouvelle session de caisse pour commencer</Text>
                        <TouchableOpacity
                            style={[s.primaryButton, { backgroundColor: theme.primary }]}
                            onPress={() => setShowOpenModal(true)}
                        >
                            <Ionicons name="add-circle" size={18} color="#fff" />
                            <Text style={s.primaryButtonText}>Ouvrir une session</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {sessions.length > 0 && (
                    <View style={s.historySection}>
                        <Text style={s.historyTitle}>Historique</Text>
                        {sessions.map((sess) => {
                            const varianceColor = sess.variance === 0 ? '#22c55e' : sess.variance > 0 ? '#f59e0b' : '#ef4444';
                            return (
                                <View key={sess.id} style={[s.historyCard, { borderColor: theme.border }]}>
                                    <View style={s.historyHeader}>
                                        <View>
                                            <Text style={s.historyTime}>
                                                {new Date(sess.openedAt).toLocaleDateString('fr-FR')} • {new Date(sess.openedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                            {sess.status === 'closed' && (
                                                <Text style={[s.historyVariance, { color: varianceColor }]}>
                                                    Variance: {sess.variance > 0 ? '+' : ''}{formatFcfa(sess.variance || 0)}
                                                </Text>
                                            )}
                                        </View>
                                        <View style={s.historyAmount}>
                                            <Text style={s.historyAmountLabel}>{formatFcfa(sess.startingCash)}</Text>
                                            <Text style={[s.historyStatus, { color: sess.status === 'open' ? theme.primary : theme.textSecondary }]}>
                                                {sess.status === 'open' ? 'Active' : 'Fermée'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}
            </ScrollView>

            {!currentSession && (
                <TouchableOpacity
                    style={[s.fab, { backgroundColor: theme.primary }]}
                    onPress={() => setShowOpenModal(true)}
                >
                    <Ionicons name="add" size={28} color="#fff" />
                </TouchableOpacity>
            )}

            {/* Open Session Modal */}
            <Modal
                visible={showOpenModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowOpenModal(false)}
            >
                <View style={s.modalOverlay}>
                    <View style={[s.modalContent, { backgroundColor: theme.surface }]}>
                        <View style={s.modalHeader}>
                            <Text style={s.modalTitle}>Ouvrir une session</Text>
                            <TouchableOpacity onPress={() => setShowOpenModal(false)}>
                                <Ionicons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={s.formContent}>
                            <Text style={s.label}>Montant initial (FCFA)</Text>
                            <TextInput
                                style={[s.input, { color: theme.text, borderColor: theme.border }]}
                                placeholder="Ex: 50000"
                                placeholderTextColor={theme.textSecondary}
                                value={startingCash}
                                onChangeText={(text) => setStartingCash(text.replace(/[^0-9]/g, ''))}
                                keyboardType="number-pad"
                                editable={!processing}
                            />
                        </View>

                        <View style={s.formActions}>
                            <TouchableOpacity
                                style={s.cancelButton}
                                onPress={() => setShowOpenModal(false)}
                                disabled={processing}
                            >
                                <Text style={[s.buttonText, { color: theme.text }]}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[s.submitButton, { backgroundColor: theme.primary }]}
                                onPress={handleOpenSession}
                                disabled={processing}
                            >
                                {processing ? (
                                    <ActivityIndicator color="#fff" size={14} />
                                ) : (
                                    <Text style={s.submitButtonText}>Ouvrir</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Close Session Modal */}
            <Modal
                visible={showCloseModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowCloseModal(false)}
            >
                <View style={s.modalOverlay}>
                    <View style={[s.modalContent, { backgroundColor: theme.surface }]}>
                        <View style={s.modalHeader}>
                            <Text style={s.modalTitle}>Fermer la session</Text>
                            <TouchableOpacity onPress={() => setShowCloseModal(false)}>
                                <Ionicons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={s.formContent}>
                            <View style={s.expectedBox}>
                                <Text style={s.expectedLabel}>Montant attendu</Text>
                                <Text style={s.expectedValue}>{currentSession && formatFcfa(currentSession.expectedCash)}</Text>
                            </View>

                            <Text style={s.label}>Montant réel compté (FCFA)</Text>
                            <TextInput
                                style={[s.input, { color: theme.text, borderColor: theme.border }]}
                                placeholder="Ex: 50000"
                                placeholderTextColor={theme.textSecondary}
                                value={actualCash}
                                onChangeText={(text) => setActualCash(text.replace(/[^0-9]/g, ''))}
                                keyboardType="number-pad"
                                editable={!processing}
                            />

                            <Text style={s.label}>Notes (optionnel)</Text>
                            <TextInput
                                style={[s.input, s.textArea, { color: theme.text, borderColor: theme.border }]}
                                placeholder="Ex: Deux clients sans facture..."
                                placeholderTextColor={theme.textSecondary}
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                                editable={!processing}
                            />
                        </View>

                        <View style={s.formActions}>
                            <TouchableOpacity
                                style={s.cancelButton}
                                onPress={() => setShowCloseModal(false)}
                                disabled={processing}
                            >
                                <Text style={[s.buttonText, { color: theme.text }]}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[s.submitButton, { backgroundColor: theme.error }]}
                                onPress={handleCloseSession}
                                disabled={processing}
                            >
                                {processing ? (
                                    <ActivityIndicator color="#fff" size={14} />
                                ) : (
                                    <Text style={s.submitButtonText}>Fermer</Text>
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
        backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
        title: { fontSize: 17, fontWeight: '700', color: theme.text },
        content: { padding: 16, gap: 16, paddingBottom: 32 },
        sessionCard: {
            backgroundColor: theme.surface,
            borderRadius: 12,
            padding: 16,
            borderWidth: 2,
            gap: 12,
        },
        sessionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
        sessionStatus: { fontSize: 13, fontWeight: '700', color: theme.text },
        sessionTime: { fontSize: 11, color: theme.textSecondary, marginTop: 2 },
        statusBadge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
        sessionDivider: { height: 1, backgroundColor: theme.border, marginVertical: 4 },
        sessionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
        sessionLabel: { fontSize: 11, color: theme.textSecondary },
        sessionValue: { fontSize: 14, fontWeight: '700', color: theme.text, marginTop: 4 },
        sessionSpacer: { flex: 1 },
        sessionRightAlign: { alignItems: 'flex-end' },
        closeButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            borderRadius: 10,
            paddingVertical: 12,
            marginTop: 4,
        },
        closeButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
        emptyCard: {
            backgroundColor: theme.surface,
            borderRadius: 12,
            padding: 32,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: theme.border,
        },
        emptyIcon: { fontSize: 48, marginBottom: 12 },
        emptyText: { fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 4 },
        emptyDescription: { fontSize: 12, color: theme.textSecondary, marginBottom: 20, textAlign: 'center' },
        primaryButton: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 10,
        },
        primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
        historySection: { gap: 8 },
        historyTitle: { fontSize: 14, fontWeight: '700', color: theme.text, marginBottom: 4 },
        historyCard: {
            backgroundColor: theme.surface,
            borderRadius: 10,
            padding: 12,
            borderWidth: 1,
        },
        historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
        historyTime: { fontSize: 12, fontWeight: '600', color: theme.text },
        historyVariance: { fontSize: 11, marginTop: 4, fontWeight: '700' },
        historyAmount: { alignItems: 'flex-end' },
        historyAmountLabel: { fontSize: 12, fontWeight: '700', color: theme.text },
        historyStatus: { fontSize: 10, marginTop: 2 },
        fab: {
            position: 'absolute',
            bottom: 20,
            right: 20,
            width: 56,
            height: 56,
            borderRadius: 28,
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3,
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
        },
        modalContent: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 20,
        },
        modalHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
        },
        modalTitle: { fontSize: 17, fontWeight: '700', color: theme.text },
        formContent: { gap: 14, marginBottom: 20 },
        label: { fontSize: 12, fontWeight: '600', color: theme.text },
        input: {
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            fontSize: 13,
        },
        textArea: { minHeight: 80, paddingTop: 10, textAlignVertical: 'top' },
        expectedBox: {
            backgroundColor: theme.background,
            borderRadius: 8,
            padding: 12,
            marginBottom: 4,
        },
        expectedLabel: { fontSize: 11, color: theme.textSecondary },
        expectedValue: { fontSize: 16, fontWeight: '700', color: theme.primary, marginTop: 4 },
        formActions: { flexDirection: 'row', gap: 10 },
        cancelButton: {
            flex: 1,
            paddingVertical: 10,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: theme.border,
        },
        submitButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
        buttonText: { fontWeight: '600', fontSize: 13 },
        submitButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
    });
