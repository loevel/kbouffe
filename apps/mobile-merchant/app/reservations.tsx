import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch, getErrorMessage } from '@/lib/api';
import { useTheme } from '@/hooks/use-theme';

interface Reservation {
    id: string;
    customerName: string;
    customerPhone: string;
    partySize: number;
    date: string;
    time: string;
    duration?: number;
    status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';
    occasion?: string;
}

interface ReservationsResponse {
    reservations: Array<{
        id: string;
        customer_name: string;
        customer_phone: string;
        party_size: number;
        date: string;
        time: string;
        duration?: number;
        status: string;
        occasion?: string;
    }>;
    total: number;
}

const STATUS_META: Record<string, { label: string; color: string }> = {
    pending: { label: 'En attente', color: '#f59e0b' },
    confirmed: { label: 'Confirmée', color: '#3b82f6' },
    seated: { label: 'Installée', color: '#8b5cf6' },
    completed: { label: 'Terminée', color: '#10b981' },
    cancelled: { label: 'Annulée', color: '#ef4444' },
    no_show: { label: 'Non présentée', color: '#6b7280' },
};

const STATUS_ACTIONS: Record<string, string[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['seated', 'no_show', 'cancelled'],
    seated: ['completed'],
    completed: [],
    cancelled: [],
    no_show: [],
};

export default function ReservationsScreen() {
    const { session } = useAuth();
    const theme = useTheme();
    const router = useRouter();

    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'today' | 'week' | 'all'>('today');
    const [actioningId, setActioningId] = useState<string | null>(null);

    const getFilteredDate = useCallback(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (filter === 'today') {
            return today.toISOString().split('T')[0];
        } else if (filter === 'week') {
            const nextWeek = new Date(today);
            nextWeek.setDate(nextWeek.getDate() + 7);
            return null; // Will filter in JS
        }
        return null;
    }, [filter]);

    const loadReservations = useCallback(async () => {
        if (!session) {
            setLoading(false);
            return;
        }

        try {
            const dateParam = getFilteredDate();
            let url = '/api/reservations?status=all';
            if (dateParam) {
                url += `&date=${dateParam}`;
            }

            const response = await apiFetch<ReservationsResponse>(url, session.access_token);

            let processed = (response.reservations || []).map((r: any) => ({
                id: r.id,
                customerName: r.customer_name,
                customerPhone: r.customer_phone,
                partySize: r.party_size,
                date: r.date,
                time: r.time,
                duration: r.duration,
                status: r.status,
                occasion: r.occasion,
            }));

            // Filter by date range if week filter
            if (filter === 'week') {
                const today = new Date();
                const nextWeek = new Date(today);
                nextWeek.setDate(nextWeek.getDate() + 7);
                today.setHours(0, 0, 0, 0);
                nextWeek.setHours(23, 59, 59, 999);

                processed = processed.filter((r) => {
                    const reservationDate = new Date(r.date);
                    return reservationDate >= today && reservationDate <= nextWeek;
                });
            }

            setReservations(processed.sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.time}`);
                const dateB = new Date(`${b.date}T${b.time}`);
                return dateA.getTime() - dateB.getTime();
            }));
        } catch (error) {
            console.error('Erreur lors du chargement des réservations:', error);
        } finally {
            setLoading(false);
        }
    }, [session, filter, getFilteredDate]);

    useEffect(() => {
        loadReservations();
    }, [loadReservations]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadReservations();
        setRefreshing(false);
    };

    const handleStatusChange = async (reservationId: string, newStatus: string) => {
        if (!session) return;

        setActioningId(reservationId);
        try {
            await apiFetch('/api/reservations', session.access_token, {
                method: 'PATCH',
                body: JSON.stringify({ id: reservationId, status: newStatus }),
            });

            setReservations((prev) =>
                prev.map((r) =>
                    r.id === reservationId ? { ...r, status: newStatus as any } : r
                )
            );
            Alert.alert('Succès', 'Le statut a été mis à jour');
        } catch (error) {
            Alert.alert('Erreur', getErrorMessage(error, 'Impossible de mettre à jour la réservation'));
        } finally {
            setActioningId(null);
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

    const renderReservation = ({ item }: { item: Reservation }) => {
        const statusMeta = STATUS_META[item.status] || STATUS_META.pending;
        const possibleActions = STATUS_ACTIONS[item.status] || [];

        return (
            <View style={s.reservationCard}>
                <View style={s.reservationHeader}>
                    <View style={s.reservationInfo}>
                        <Text style={s.customerName}>{item.customerName}</Text>
                        <View style={s.reservationDetails}>
                            <Ionicons name="people" size={12} color={theme.textSecondary} />
                            <Text style={s.detailText}>{item.partySize} personnes</Text>
                            <Text style={s.dot}>•</Text>
                            <Ionicons name="time" size={12} color={theme.textSecondary} />
                            <Text style={s.detailText}>{item.time}</Text>
                        </View>
                    </View>

                    <View
                        style={[
                            s.statusBadge,
                            { backgroundColor: `${statusMeta.color}20`, borderColor: statusMeta.color },
                        ]}
                    >
                        <Text style={[s.statusText, { color: statusMeta.color }]}>
                            {statusMeta.label}
                        </Text>
                    </View>
                </View>

                {item.occasion && (
                    <Text style={s.occasion}>Occasion: {item.occasion}</Text>
                )}

                {possibleActions.length > 0 && (
                    <View style={s.actionsContainer}>
                        {possibleActions.map((action) => (
                            <TouchableOpacity
                                key={action}
                                style={[s.actionButton, s.actionButtonSmall]}
                                onPress={() => handleStatusChange(item.id, action)}
                                disabled={actioningId === item.id}
                            >
                                {actioningId === item.id ? (
                                    <ActivityIndicator color={theme.primary} size={12} />
                                ) : (
                                    <Text style={[s.actionButtonText, s.actionButtonTextSmall]}>
                                        {STATUS_META[action]?.label || action}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={s.container} edges={['top']}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={s.title}>Réservations</Text>
                <View style={s.backButton} />
            </View>

            <View style={s.filterBar}>
                {(['today', 'week', 'all'] as const).map((f) => (
                    <TouchableOpacity
                        key={f}
                        style={[s.filterButton, filter === f && s.filterButtonActive]}
                        onPress={() => setFilter(f)}
                    >
                        <Text
                            style={[
                                s.filterButtonText,
                                filter === f && s.filterButtonTextActive,
                            ]}
                        >
                            {f === 'today' ? 'Aujourd\'hui' : f === 'week' ? '7 jours' : 'Toutes'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={reservations}
                keyExtractor={(item) => item.id}
                renderItem={renderReservation}
                contentContainerStyle={s.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
                ListEmptyComponent={
                    <View style={s.empty}>
                        <Text style={s.emptyIcon}>📅</Text>
                        <Text style={s.emptyText}>Aucune réservation pour cette période</Text>
                    </View>
                }
            />
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
        backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
        title: { fontSize: 17, fontWeight: '700', color: theme.text },
        filterBar: {
            flexDirection: 'row',
            gap: 8,
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: theme.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        filterButton: {
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16,
            backgroundColor: theme.background,
            borderWidth: 1,
            borderColor: theme.border,
        },
        filterButtonActive: {
            backgroundColor: theme.primary,
            borderColor: theme.primary,
        },
        filterButtonText: { fontSize: 12, fontWeight: '600', color: theme.textSecondary },
        filterButtonTextActive: { color: '#fff' },
        list: { padding: 12, gap: 12, paddingBottom: 24 },
        reservationCard: { backgroundColor: theme.surface, borderRadius: 12, padding: 14, gap: 10, borderWidth: 1, borderColor: theme.border },
        reservationHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
        },
        reservationInfo: { flex: 1, gap: 6 },
        customerName: { fontSize: 14, fontWeight: '700', color: theme.text },
        reservationDetails: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            flexWrap: 'wrap',
        },
        detailText: { fontSize: 11, color: theme.textSecondary },
        dot: { color: theme.textSecondary, marginHorizontal: 2 },
        statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
        statusText: { fontSize: 11, fontWeight: '600' },
        occasion: { fontSize: 11, color: theme.textSecondary, fontStyle: 'italic' },
        actionsContainer: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', paddingTopVertical: 8, borderTopWidth: 1, borderTopColor: theme.border },
        actionButton: {
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: theme.primary,
            alignItems: 'center',
        },
        actionButtonSmall: {
            paddingHorizontal: 10,
            paddingVertical: 6,
            minHeight: 30,
        },
        actionButtonText: { fontSize: 12, fontWeight: '600', color: '#fff' },
        actionButtonTextSmall: { fontSize: 10 },
        empty: { alignItems: 'center', marginTop: 70, paddingHorizontal: 20 },
        emptyIcon: { fontSize: 46, marginBottom: 10 },
        emptyText: { fontSize: 14, color: theme.textSecondary, textAlign: 'center' },
    });
