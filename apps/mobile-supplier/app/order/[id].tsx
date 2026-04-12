import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authApiFetch } from '@/lib/api';
import { formatDate, formatFCFA } from '@/lib/format';
import { useTheme } from '@/hooks/use-theme';
import type { SupplierDeliveryStatus, SupplierOrder } from '@/lib/types';

const STATUS_LABELS: Record<SupplierDeliveryStatus, string> = {
    pending: 'En attente',
    confirmed: 'Confirmée',
    delivered: 'Livrée',
    disputed: 'En litige',
    cancelled: 'Annulée',
};

async function readJson<T>(response: Response): Promise<T> {
    return (await response.json().catch(() => ({}))) as T;
}

async function fetchOrderById(orderId: string) {
    const directResponse = await authApiFetch(`/api/marketplace/suppliers/me/orders/${orderId}`);
    const directPayload = await readJson<{ error?: string; order?: SupplierOrder }>(directResponse);

    if (directResponse.ok) {
        return directPayload.order ?? null;
    }

    if (![404, 405].includes(directResponse.status)) {
        throw new Error(directPayload.error ?? 'Impossible de charger la commande');
    }

    const listResponse = await authApiFetch('/api/marketplace/suppliers/me/orders');
    const listPayload = await readJson<{ error?: string; orders?: SupplierOrder[] }>(listResponse);

    if (!listResponse.ok) {
        throw new Error(listPayload.error ?? 'Impossible de charger la commande');
    }

    return (listPayload.orders ?? []).find((item) => item.id === orderId) ?? null;
}

export default function OrderDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState<SupplierOrder | null>(null);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        let mounted = true;

        fetchOrderById(id)
            .then((nextOrder) => {
                if (mounted) setOrder(nextOrder);
            })
            .catch((error) => {
                if (!mounted) return;
                const message = error instanceof Error ? error.message : 'Impossible de charger la commande';
                Alert.alert('Erreur', message);
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [id]);

    const changeStatus = async () => {
        if (!order) return;

        const next =
            order.delivery_status === 'pending'
                ? 'confirmed'
                : order.delivery_status === 'confirmed'
                  ? 'delivered'
                  : null;
        if (!next) return;

        setUpdating(true);
        try {
            const response = await authApiFetch(`/api/marketplace/suppliers/me/orders/${order.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ delivery_status: next }),
            });
            const payload = await readJson<{ error?: string; order?: SupplierOrder }>(response);

            if (!response.ok || !payload.order) {
                throw new Error(payload.error ?? 'Impossible de mettre à jour la commande');
            }

            setOrder(payload.order);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erreur serveur';
            Alert.alert('Erreur', message);
        } finally {
            setUpdating(false);
        }
    };

    const styles = createStyles(theme);

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator color={theme.primary} size="large" />
            </View>
        );
    }

    if (!order) {
        return (
            <View style={styles.centered}>
                <Text style={{ color: theme.text }}>Commande introuvable.</Text>
            </View>
        );
    }

    const nextLabel =
        order.delivery_status === 'pending'
            ? 'Confirmer la commande'
            : order.delivery_status === 'confirmed'
              ? 'Marquer comme livrée'
              : null;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <Pressable style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={20} color={theme.text} />
                    </Pressable>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.title}>{order.supplier_products?.name ?? 'Commande fournisseur'}</Text>
                        <Text style={styles.subtitle}>
                            Suivez la progression et la livraison de cette commande.
                        </Text>
                    </View>
                </View>

                <View style={styles.card}>
                    <DetailRow label="Statut" value={STATUS_LABELS[order.delivery_status]} theme={theme} />
                    <DetailRow label="Quantité" value={`${order.quantity} ${order.unit}`} theme={theme} />
                    <DetailRow label="Prix unitaire" value={formatFCFA(order.unit_price)} theme={theme} />
                    <DetailRow label="Montant total" value={formatFCFA(order.total_price)} theme={theme} />
                    <DetailRow label="Créée le" value={formatDate(order.created_at)} theme={theme} />
                    <DetailRow label="Livraison prévue" value={formatDate(order.expected_delivery_date)} theme={theme} />
                    <DetailRow
                        label="Livraison effective"
                        value={formatDate(order.actual_delivery_date)}
                        theme={theme}
                    />
                </View>

                {order.notes ? (
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Notes</Text>
                        <Text style={styles.bodyText}>{order.notes}</Text>
                    </View>
                ) : null}

                {nextLabel ? (
                    <Pressable style={styles.primaryButton} onPress={changeStatus} disabled={updating}>
                        {updating ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.primaryButtonText}>{nextLabel}</Text>
                        )}
                    </Pressable>
                ) : null}
            </ScrollView>
        </SafeAreaView>
    );
}

function DetailRow({
    label,
    value,
    theme,
}: {
    label: string;
    value: string;
    theme: ReturnType<typeof useTheme>;
}) {
    return (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
            <Text style={{ color: theme.textSecondary }}>{label}</Text>
            <Text style={{ color: theme.text, fontWeight: '700', flexShrink: 1, textAlign: 'right' }}>
                {value}
            </Text>
        </View>
    );
}

function createStyles(theme: ReturnType<typeof useTheme>) {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
        },
        centered: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.background,
        },
        content: {
            padding: 16,
            gap: 16,
        },
        header: {
            flexDirection: 'row',
            gap: 12,
        },
        backButton: {
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.card,
        },
        title: {
            color: theme.text,
            fontSize: 24,
            fontWeight: '800',
        },
        subtitle: {
            marginTop: 4,
            color: theme.textSecondary,
            lineHeight: 20,
        },
        card: {
            backgroundColor: theme.card,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 16,
            gap: 12,
        },
        sectionTitle: {
            color: theme.text,
            fontSize: 17,
            fontWeight: '700',
        },
        bodyText: {
            color: theme.text,
            lineHeight: 22,
        },
        primaryButton: {
            borderRadius: 16,
            backgroundColor: theme.primary,
            paddingVertical: 16,
            alignItems: 'center',
        },
        primaryButtonText: {
            color: '#fff',
            fontWeight: '700',
            fontSize: 16,
        },
    });
}
