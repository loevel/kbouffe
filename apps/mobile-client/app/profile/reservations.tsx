import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Radii, Typography, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getMyReservations, cancelReservation, type Reservation } from '@/lib/api';

const STATUS_CONFIG: Record<Reservation['status'], { label: string; color: string; icon: string }> = {
    pending:   { label: 'En attente',  color: '#f59e0b', icon: 'hourglass-outline' },
    confirmed: { label: 'Confirmée',   color: '#10b981', icon: 'checkmark-circle-outline' },
    cancelled: { label: 'Annulée',     color: '#ef4444', icon: 'close-circle-outline' },
    seated:    { label: 'En cours',    color: '#3b82f6', icon: 'restaurant-outline' },
    completed: { label: 'Terminée',    color: '#64748b', icon: 'checkmark-done-outline' },
    no_show:   { label: 'Non présenté', color: '#94a3b8', icon: 'alert-circle-outline' },
};

const OCCASION_LABELS: Record<string, string> = {
    birthday:    'Anniversaire 🎂',
    anniversary: 'Anniversaire de mariage 💍',
    business:    'Repas d\'affaires 💼',
    date:        'Rendez-vous 💑',
    other:       'Autre',
};

export default function ReservationsScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();

    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [cancelling, setCancelling] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

    const load = useCallback(async () => {
        try {
            const data = await getMyReservations();
            setReservations(data);
        } catch {
            // Empty state fallback
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleCancel = (reservation: Reservation) => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
            'Annuler la réservation',
            `Voulez-vous annuler votre réservation du ${formatDate(reservation.date)} à ${reservation.time} ?`,
            [
                { text: 'Non', style: 'cancel' },
                {
                    text: 'Oui, annuler',
                    style: 'destructive',
                    onPress: async () => {
                        setCancelling(reservation.id);
                        try {
                            await cancelReservation(reservation.id);
                            setReservations(prev =>
                                prev.map(r => r.id === reservation.id ? { ...r, status: 'cancelled' } : r)
                            );
                            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        } catch (err) {
                            Alert.alert('Erreur', err instanceof Error ? err.message : 'Impossible d\'annuler. Réessayez.');
                        } finally {
                            setCancelling(null);
                        }
                    },
                },
            ]
        );
    };

    function formatDate(dateStr: string) {
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
        });
    }

    function isUpcoming(r: Reservation) {
        return !['cancelled', 'completed', 'no_show'].includes(r.status);
    }

    const filtered = reservations.filter(r => activeTab === 'upcoming' ? isUpcoming(r) : !isUpcoming(r));

    const tabs = [
        { id: 'upcoming' as const, label: 'À venir' },
        { id: 'past' as const, label: 'Passées' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { paddingTop: Math.max(insets.top, Spacing.md) }]}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Mes réservations</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Tabs */}
            <View style={styles.tabBar}>
                {tabs.map(tab => (
                    <Pressable
                        key={tab.id}
                        onPress={() => { Haptics.selectionAsync(); setActiveTab(tab.id); }}
                        style={[
                            styles.tab,
                            activeTab === tab.id && { borderBottomColor: theme.primary, borderBottomWidth: 2 },
                        ]}
                    >
                        <Text style={[styles.tabLabel, { color: activeTab === tab.id ? theme.primary : theme.icon }]}>
                            {tab.label}
                        </Text>
                    </Pressable>
                ))}
            </View>

            {loading ? (
                <View style={styles.loadingWrapper}>
                    <ActivityIndicator color={theme.primary} size="large" />
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={[styles.scrollContent, filtered.length === 0 && styles.emptyContent]}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); load(); }}
                            tintColor={theme.primary}
                        />
                    }
                >
                    {filtered.length === 0 ? (
                        <View style={styles.emptyState}>
                            <View style={[styles.emptyIcon, { backgroundColor: theme.border + '40' }]}>
                                <Ionicons name="calendar-outline" size={48} color={theme.icon} />
                            </View>
                            <Text style={[styles.emptyTitle, { color: theme.text }]}>
                                {activeTab === 'upcoming' ? 'Aucune réservation à venir' : 'Aucune réservation passée'}
                            </Text>
                            <Text style={[styles.emptyText, { color: theme.icon }]}>
                                {activeTab === 'upcoming'
                                    ? 'Réservez une table dans votre restaurant préféré.'
                                    : 'Vos réservations terminées apparaîtront ici.'}
                            </Text>
                            {activeTab === 'upcoming' && (
                                <Pressable
                                    style={[styles.exploreBtn, { backgroundColor: theme.primary }]}
                                    onPress={() => router.push('/(tabs)/explore')}
                                >
                                    <Text style={styles.exploreBtnText}>Explorer les restaurants</Text>
                                </Pressable>
                            )}
                        </View>
                    ) : (
                        filtered.map(reservation => {
                            const config = STATUS_CONFIG[reservation.status];
                            const canCancel = ['pending', 'confirmed'].includes(reservation.status);

                            return (
                                <View key={reservation.id} style={[styles.card, { backgroundColor: theme.surface }]}>
                                    {/* Status header */}
                                    <View style={[styles.cardHeader, { backgroundColor: config.color + '12' }]}>
                                        <View style={styles.statusRow}>
                                            <Ionicons name={config.icon as any} size={16} color={config.color} />
                                            <Text style={[styles.statusLabel, { color: config.color }]}>{config.label}</Text>
                                        </View>
                                        <Text style={[styles.reservationId, { color: theme.icon }]}>
                                            #{reservation.id.slice(-6).toUpperCase()}
                                        </Text>
                                    </View>

                                    <View style={styles.cardBody}>
                                        {/* Date & Time */}
                                        <View style={styles.detailRow}>
                                            <View style={[styles.detailIcon, { backgroundColor: theme.primary + '15' }]}>
                                                <Ionicons name="calendar-outline" size={18} color={theme.primary} />
                                            </View>
                                            <View>
                                                <Text style={[styles.detailLabel, { color: theme.icon }]}>Date</Text>
                                                <Text style={[styles.detailValue, { color: theme.text }]}>
                                                    {formatDate(reservation.date)}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.detailRow}>
                                            <View style={[styles.detailIcon, { backgroundColor: '#3b82f615' }]}>
                                                <Ionicons name="time-outline" size={18} color="#3b82f6" />
                                            </View>
                                            <View>
                                                <Text style={[styles.detailLabel, { color: theme.icon }]}>Heure</Text>
                                                <Text style={[styles.detailValue, { color: theme.text }]}>{reservation.time}</Text>
                                            </View>
                                        </View>

                                        <View style={styles.detailRow}>
                                            <View style={[styles.detailIcon, { backgroundColor: '#10b98115' }]}>
                                                <Ionicons name="people-outline" size={18} color="#10b981" />
                                            </View>
                                            <View>
                                                <Text style={[styles.detailLabel, { color: theme.icon }]}>Personnes</Text>
                                                <Text style={[styles.detailValue, { color: theme.text }]}>{reservation.party_size} convive{reservation.party_size > 1 ? 's' : ''}</Text>
                                            </View>
                                        </View>

                                        {reservation.occasion && (
                                            <View style={styles.detailRow}>
                                                <View style={[styles.detailIcon, { backgroundColor: '#ec489915' }]}>
                                                    <Ionicons name="ribbon-outline" size={18} color="#ec4899" />
                                                </View>
                                                <View>
                                                    <Text style={[styles.detailLabel, { color: theme.icon }]}>Occasion</Text>
                                                    <Text style={[styles.detailValue, { color: theme.text }]}>
                                                        {OCCASION_LABELS[reservation.occasion] ?? reservation.occasion}
                                                    </Text>
                                                </View>
                                            </View>
                                        )}

                                        {reservation.special_requests && (
                                            <View style={[styles.requestBox, { backgroundColor: theme.border + '30', borderColor: theme.border }]}>
                                                <Text style={[styles.requestLabel, { color: theme.icon }]}>Demandes spéciales</Text>
                                                <Text style={[styles.requestText, { color: theme.text }]}>{reservation.special_requests}</Text>
                                            </View>
                                        )}

                                        {canCancel && (
                                            <Pressable
                                                style={[styles.cancelBtn, cancelling === reservation.id && { opacity: 0.5 }]}
                                                onPress={() => handleCancel(reservation)}
                                                disabled={cancelling === reservation.id}
                                            >
                                                {cancelling === reservation.id ? (
                                                    <ActivityIndicator size="small" color="#ef4444" />
                                                ) : (
                                                    <Ionicons name="close-circle-outline" size={18} color="#ef4444" />
                                                )}
                                                <Text style={styles.cancelBtnText}>
                                                    {cancelling === reservation.id ? 'Annulation...' : 'Annuler la réservation'}
                                                </Text>
                                            </Pressable>
                                        )}
                                    </View>
                                </View>
                            );
                        })
                    )}
                </ScrollView>
            )}
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
        paddingBottom: Spacing.sm,
    },
    backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { ...Typography.title3 },
    tabBar: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#00000010',
        marginBottom: Spacing.sm,
    },
    tab: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabLabel: { ...Typography.captionSemibold },
    loadingWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.md },
    emptyContent: { flexGrow: 1 },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.md, marginTop: Spacing.xxl },
    emptyIcon: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
    emptyTitle: { ...Typography.title3, textAlign: 'center' },
    emptyText: { ...Typography.body, textAlign: 'center', lineHeight: 24 },
    exploreBtn: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm + 2, borderRadius: Radii.full, marginTop: Spacing.sm },
    exploreBtnText: { color: '#fff', ...Typography.bodySemibold },
    card: { borderRadius: Radii.xl, overflow: 'hidden', ...Shadows.sm },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    statusLabel: { ...Typography.captionSemibold },
    reservationId: { ...Typography.caption },
    cardBody: { padding: Spacing.md, gap: Spacing.sm },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    detailIcon: { width: 36, height: 36, borderRadius: Radii.sm, alignItems: 'center', justifyContent: 'center' },
    detailLabel: { ...Typography.small },
    detailValue: { ...Typography.bodySemibold },
    requestBox: { padding: Spacing.sm, borderRadius: Radii.md, borderWidth: 1, marginTop: Spacing.xs },
    requestLabel: { ...Typography.small, marginBottom: 2 },
    requestText: { ...Typography.caption },
    cancelBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        marginTop: Spacing.sm,
        paddingVertical: Spacing.sm,
        borderRadius: Radii.lg,
        borderWidth: 1,
        borderColor: '#ef444440',
        backgroundColor: '#ef444410',
    },
    cancelBtnText: { ...Typography.caption, fontWeight: '600', color: '#ef4444' },
});
