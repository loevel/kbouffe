import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Pressable, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radii, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { submitReview, trackOrder, type OrderTracking } from '@/lib/api';

export default function ReviewOrderScreen() {
    const router = useRouter();
    const { orderId, restaurantId, restaurantName } = useLocalSearchParams<{
        orderId: string;
        restaurantId?: string;
        restaurantName?: string;
    }>();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();

    const [order, setOrder] = useState<OrderTracking | null>(null);
    const [loadingOrder, setLoadingOrder] = useState(!!orderId);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    const resolvedRestaurantId = restaurantId ?? order?.restaurant_id;
    const resolvedRestaurantName = restaurantName ?? order?.restaurant_name ?? 'Restaurant';

    useEffect(() => {
        if (orderId) {
            trackOrder(orderId)
                .then(setOrder)
                .catch(() => {})
                .finally(() => setLoadingOrder(false));
        }
    }, [orderId]);

    const handleSubmit = async () => {
        if (rating < 1) {
            Alert.alert('Avis incomplet', 'Veuillez sélectionner une note.');
            return;
        }
        if (!resolvedRestaurantId) {
            Alert.alert('Erreur', 'Restaurant introuvable.');
            return;
        }
        setLoading(true);
        try {
            await submitReview({
                orderId: orderId || undefined,
                restaurantId: resolvedRestaurantId,
                rating,
                comment: comment.trim() || undefined,
            });
            Alert.alert('Merci ✨', 'Votre avis a bien été envoyé.', [
                { text: 'OK', onPress: () => router.back() },
            ]);
        } catch (err: any) {
            Alert.alert('Erreur', err?.message ?? 'Impossible d\'envoyer votre avis.');
        } finally {
            setLoading(false);
        }
    };

    if (loadingOrder) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Laisser un avis</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={[styles.card, { borderColor: theme.border }]}> 
                    <Text style={[styles.restaurantName, { color: theme.text }]}>
                        {resolvedRestaurantName}
                    </Text>
                    <Text style={[styles.meta, { color: theme.icon }]}>Commande #{orderId?.slice(-4) ?? '----'}</Text>
                </View>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>Votre note</Text>
                <View style={styles.starRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Pressable key={star} onPress={() => setRating(star)}>
                            <Ionicons
                                name={star <= rating ? 'star' : 'star-outline'}
                                size={34}
                                color={star <= rating ? '#f59e0b' : theme.border}
                                style={{ marginRight: Spacing.sm }}
                            />
                        </Pressable>
                    ))}
                </View>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>Commentaire (optionnel)</Text>
                <TextInput
                    style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                    placeholder="Partagez votre expérience..."
                    placeholderTextColor={theme.icon}
                    value={comment}
                    onChangeText={setComment}
                    multiline
                    numberOfLines={5}
                />
            </ScrollView>

            <View style={[styles.footer, { borderTopColor: theme.border, paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
                <Pressable
                    style={[styles.submitBtn, { backgroundColor: theme.primary, opacity: loading ? 0.7 : 1 }]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    <Text style={styles.submitTxt}>{loading ? 'Envoi...' : 'Envoyer mon avis'}</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md },
    headerTitle: { ...Typography.title3 },
    content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
    card: {
        borderWidth: 1,
        borderRadius: Radii.lg,
        padding: Spacing.md,
        marginBottom: Spacing.lg,
    },
    restaurantName: { ...Typography.body, fontWeight: '700', marginBottom: 2 },
    meta: { ...Typography.caption },
    sectionTitle: { ...Typography.body, fontWeight: '600', marginBottom: Spacing.sm },
    starRow: { flexDirection: 'row', marginBottom: Spacing.lg },
    input: {
        borderWidth: 1,
        borderRadius: Radii.lg,
        minHeight: 120,
        padding: Spacing.md,
        textAlignVertical: 'top',
        ...Typography.body,
    },
    footer: { padding: Spacing.md, borderTopWidth: 1 },
    submitBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.md,
        borderRadius: Radii.full,
    },
    submitTxt: { color: '#fff', ...Typography.body, fontWeight: '700' },
});
