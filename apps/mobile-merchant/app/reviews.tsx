import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
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
import { apiFetch, getErrorMessage } from '@/lib/api';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

interface Review {
    id: string;
    orderId?: string;
    customerId: string;
    customerName: string;
    rating: number;
    comment: string;
    response?: string;
    isVisible: boolean;
    createdAt: string;
}

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
    return (
        <View style={{ flexDirection: 'row', gap: 2 }}>
            {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                    key={star}
                    name={star <= Math.round(rating) ? 'star' : 'star-outline'}
                    size={size}
                    color={star <= Math.round(rating) ? '#fbbf24' : '#d1d5db'}
                />
            ))}
        </View>
    );
}

export default function ReviewsScreen() {
    const { session, profile } = useAuth();
    const theme = useTheme();
    const router = useRouter();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'unanswered'>('unanswered');
    const [respondingToId, setRespondingToId] = useState<string | null>(null);
    const [responseText, setResponseText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const loadReviews = useCallback(async () => {
        if (!session || !profile?.restaurantId) {
            setLoading(false);
            return;
        }

        try {
            const { data: reviewData, error } = await supabase
                .from('reviews')
                .select('*')
                .eq('restaurant_id', profile.restaurantId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Get customer names
            const customerIds = [...new Set((reviewData || []).map((r: any) => r.customer_id).filter(Boolean))];
            const customerMap: Record<string, string> = {};

            if (customerIds.length > 0) {
                const { data: customers } = await supabase
                    .from('users')
                    .select('id, full_name')
                    .in('id', customerIds);

                (customers || []).forEach((c: any) => {
                    customerMap[c.id] = c.full_name || 'Client';
                });
            }

            const processed: Review[] = (reviewData || []).map((r: any) => ({
                id: r.id,
                orderId: r.order_id,
                customerId: r.customer_id,
                customerName: customerMap[r.customer_id] || 'Client',
                rating: r.rating,
                comment: r.comment,
                response: r.response,
                isVisible: r.is_visible !== false,
                createdAt: r.created_at,
            }));

            setReviews(processed);
        } catch (error) {
            console.error('Erreur lors du chargement des avis:', error);
        } finally {
            setLoading(false);
        }
    }, [session, profile?.restaurantId]);

    useEffect(() => {
        loadReviews();
        const interval = setInterval(loadReviews, 30_000);
        return () => clearInterval(interval);
    }, [loadReviews]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadReviews();
        setRefreshing(false);
    };

    const handleRespond = async (reviewId: string) => {
        if (!responseText.trim() || !session) return;

        setSubmitting(true);
        try {
            await apiFetch(`/api/restaurant/reviews/${reviewId}`, session.access_token, {
                method: 'PATCH',
                body: JSON.stringify({ response: responseText.trim() }),
            });

            Alert.alert('Succès', 'Votre réponse a été enregistrée');
            setRespondingToId(null);
            setResponseText('');
            await loadReviews();
        } catch (error) {
            Alert.alert('Erreur', getErrorMessage(error, 'Impossible d\'enregistrer la réponse'));
        } finally {
            setSubmitting(false);
        }
    };

    const filteredReviews = filter === 'unanswered' ? reviews.filter((r) => !r.response) : reviews;
    const s = styles(theme);

    if (loading) {
        return (
            <SafeAreaView style={s.container} edges={['top']}>
                <ActivityIndicator style={{ marginTop: 40 }} size="large" color={theme.primary} />
            </SafeAreaView>
        );
    }

    const renderReview = ({ item }: { item: Review }) => {
        const isResponding = respondingToId === item.id;

        return (
            <View style={s.reviewCard}>
                <View style={s.reviewHeader}>
                    <View style={s.customerInfo}>
                        <Text style={s.customerName}>{item.customerName}</Text>
                        <StarRating rating={item.rating} size={14} />
                    </View>
                    <Text style={s.date}>
                        {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                    </Text>
                </View>

                <Text style={s.comment}>{item.comment}</Text>

                {item.response && (
                    <View style={[s.response, { backgroundColor: `${theme.success}10` }]}>
                        <View style={s.responseHeader}>
                            <Ionicons name="checkmark-circle" size={16} color={theme.success} />
                            <Text style={[s.responseLabel, { color: theme.success }]}>Votre réponse</Text>
                        </View>
                        <Text style={s.responseText}>{item.response}</Text>
                    </View>
                )}

                {!item.response && (
                    <>
                        {isResponding ? (
                            <View style={s.responseForm}>
                                <TextInput
                                    style={[
                                        s.responseInput,
                                        { borderColor: theme.border, color: theme.text, backgroundColor: theme.surface },
                                    ]}
                                    placeholder="Votre réponse..."
                                    placeholderTextColor={theme.textSecondary}
                                    value={responseText}
                                    onChangeText={setResponseText}
                                    multiline
                                    numberOfLines={3}
                                    editable={!submitting}
                                />
                                <View style={s.formActions}>
                                    <TouchableOpacity
                                        style={[s.formButton, s.cancelButton]}
                                        onPress={() => {
                                            setRespondingToId(null);
                                            setResponseText('');
                                        }}
                                        disabled={submitting}
                                    >
                                        <Text style={[s.formButtonText, { color: theme.text }]}>Annuler</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            s.formButton,
                                            s.submitButton,
                                            { backgroundColor: theme.primary, opacity: !responseText.trim() || submitting ? 0.6 : 1 },
                                        ]}
                                        onPress={() => handleRespond(item.id)}
                                        disabled={!responseText.trim() || submitting}
                                    >
                                        {submitting ? (
                                            <ActivityIndicator color="#fff" size={14} />
                                        ) : (
                                            <Text style={s.submitButtonText}>Envoyer</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={s.respondButton}
                                onPress={() => {
                                    setRespondingToId(item.id);
                                    setResponseText('');
                                }}
                            >
                                <Ionicons name="chatbubble-outline" size={14} color={theme.primary} />
                                <Text style={[s.respondButtonText, { color: theme.primary }]}>Répondre</Text>
                            </TouchableOpacity>
                        )}
                    </>
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
                <Text style={s.title}>Avis clients</Text>
                <View style={s.backButton} />
            </View>

            <View style={s.filterBar}>
                {(['all', 'unanswered'] as const).map((f) => (
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
                            {f === 'all' ? 'Tous' : 'Non répondus'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={filteredReviews}
                keyExtractor={(item) => item.id}
                renderItem={renderReview}
                contentContainerStyle={s.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
                ListEmptyComponent={
                    <View style={s.empty}>
                        <Text style={s.emptyIcon}>⭐</Text>
                        <Text style={s.emptyText}>
                            {filter === 'unanswered' ? 'Aucun avis en attente de réponse' : 'Aucun avis pour le moment'}
                        </Text>
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
        reviewCard: { backgroundColor: theme.surface, borderRadius: 12, padding: 14, gap: 10 },
        reviewHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
        },
        customerInfo: { flex: 1, gap: 6 },
        customerName: { fontSize: 14, fontWeight: '700', color: theme.text },
        date: { fontSize: 11, color: theme.textSecondary },
        comment: { fontSize: 13, color: theme.text, lineHeight: 18 },
        response: { borderRadius: 8, padding: 10, gap: 6 },
        responseHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
        responseLabel: { fontSize: 11, fontWeight: '600' },
        responseText: { fontSize: 12, color: theme.text, lineHeight: 16 },
        respondButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingVertical: 8,
            borderTopWidth: 1,
            borderTopColor: theme.border,
            marginTop: 4,
        },
        respondButtonText: { fontSize: 12, fontWeight: '600' },
        responseForm: { gap: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: theme.border },
        responseInput: {
            borderWidth: 1,
            borderRadius: 8,
            padding: 10,
            fontSize: 12,
            minHeight: 60,
        },
        formActions: { flexDirection: 'row', gap: 8 },
        formButton: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
        cancelButton: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
        submitButton: {},
        formButtonText: { fontSize: 12, fontWeight: '600' },
        submitButtonText: { fontSize: 12, fontWeight: '600', color: '#fff' },
        empty: { alignItems: 'center', marginTop: 70, paddingHorizontal: 20 },
        emptyIcon: { fontSize: 46, marginBottom: 10 },
        emptyText: { fontSize: 14, color: theme.textSecondary, textAlign: 'center' },
    });
