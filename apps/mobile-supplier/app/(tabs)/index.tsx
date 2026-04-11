import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/contexts/auth-context';
import { authApiFetch } from '@/lib/api';
import { formatFCFA, relativeTime } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import type { SupplierMessage, SupplierOrder, SupplierProduct } from '@/lib/types';

interface DashboardState {
    products: SupplierProduct[];
    orders: SupplierOrder[];
    unreadMessages: number;
}

const statusLabels: Record<string, string> = {
    pending: 'En attente',
    confirmed: 'Confirmée',
    delivered: 'Livrée',
    disputed: 'En litige',
    cancelled: 'Annulée',
};

export default function DashboardScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [state, setState] = useState<DashboardState>({
        products: [],
        orders: [],
        unreadMessages: 0,
    });

    const loadDashboard = useCallback(async () => {
        if (!profile?.id) return;

        const [productsResponse, ordersResponse, messageResponse] = await Promise.all([
            authApiFetch('/api/marketplace/suppliers/me/products'),
            authApiFetch('/api/marketplace/suppliers/me/orders'),
            supabase
                .from('supplier_messages')
                .select('id, status')
                .eq('supplier_id', profile.id)
                .order('created_at', { ascending: false }),
        ]);

        const productsPayload = await productsResponse.json();
        const ordersPayload = await ordersResponse.json();

        if (!productsResponse.ok) {
            throw new Error(productsPayload.error ?? 'Impossible de charger les produits');
        }

        if (!ordersResponse.ok) {
            throw new Error(ordersPayload.error ?? 'Impossible de charger les commandes');
        }

        const messages = (messageResponse.data ?? []) as Pick<SupplierMessage, 'id' | 'status'>[];

        setState({
            products: productsPayload.products ?? [],
            orders: ordersPayload.orders ?? [],
            unreadMessages: messages.filter((message) => message.status === 'unread').length,
        });
    }, [profile?.id]);

    useEffect(() => {
        loadDashboard()
            .catch(() => undefined)
            .finally(() => setLoading(false));
    }, [loadDashboard]);

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await loadDashboard();
        } finally {
            setRefreshing(false);
        }
    };

    const styles = createStyles(theme);
    const activeProducts = state.products.filter((product) => product.is_active).length;
    const totalRevenue = state.orders
        .filter((order) => order.delivery_status !== 'cancelled')
        .reduce((sum, order) => sum + (order.total_price ?? 0), 0);
    const pendingOrders = state.orders.filter((order) => order.delivery_status === 'pending').length;
    const lowStock = state.products.filter((product) => (product.available_quantity ?? 0) > 0 && (product.available_quantity ?? 0) <= 10).length;
    const recentOrders = state.orders.slice(0, 4);

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator color={theme.primary} size="large" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
            >
                <View style={styles.hero}>
                    <Text style={styles.greeting}>Bonjour {profile?.contact_name ?? 'partenaire'}</Text>
                    <Text style={styles.heroTitle}>{profile?.name ?? 'Votre espace fournisseur'}</Text>
                    <Text style={styles.heroSubtitle}>
                        Statut KYC : {profile?.kyc_status === 'approved' ? 'approuvé' : 'en validation'}
                    </Text>
                </View>

                <View style={styles.grid}>
                    <StatCard title="CA généré" value={formatFCFA(totalRevenue)} icon="cash-outline" theme={theme} />
                    <StatCard title="Produits actifs" value={String(activeProducts)} icon="cube-outline" theme={theme} />
                    <StatCard title="Commandes à traiter" value={String(pendingOrders)} icon="receipt-outline" theme={theme} />
                    <StatCard title="Messages non lus" value={String(state.unreadMessages)} icon="chatbubble-outline" theme={theme} />
                </View>

                <View style={styles.alertCard}>
                    <Text style={styles.sectionTitle}>Priorités du jour</Text>
                    <AlertRow
                        theme={theme}
                        icon="shield-checkmark-outline"
                        label={profile?.kyc_status === 'approved' ? 'Dossier validé' : 'Dossier KYC en attente'}
                        hint={profile?.kyc_status === 'approved' ? 'Vous pouvez gérer librement votre catalogue.' : 'Surveillez les demandes de correction éventuelles.'}
                    />
                    <AlertRow
                        theme={theme}
                        icon="warning-outline"
                        label={lowStock > 0 ? `${lowStock} produit(s) avec stock faible` : 'Alerte stock maîtrisée'}
                        hint={lowStock > 0 ? 'Mettez à jour les quantités disponibles.' : 'Aucun produit critique aujourd’hui.'}
                    />
                </View>

                <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Activité récente</Text>
                        <Pressable onPress={() => router.push('/(tabs)/orders')}>
                            <Text style={styles.link}>Voir tout</Text>
                        </Pressable>
                    </View>

                    {recentOrders.length === 0 ? (
                        <Text style={styles.emptyText}>Aucune commande reçue pour le moment.</Text>
                    ) : (
                        recentOrders.map((order) => (
                            <Pressable key={order.id} style={styles.timelineRow} onPress={() => router.push(`/order/${order.id}`)}>
                                <View style={styles.timelineIcon}>
                                    <Ionicons name="receipt-outline" size={16} color={theme.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.timelineTitle}>
                                        {order.supplier_products?.name ?? 'Produit'} · {statusLabels[order.delivery_status] ?? order.delivery_status}
                                    </Text>
                                    <Text style={styles.timelineSubtitle}>
                                        {formatFCFA(order.total_price)} · {relativeTime(order.created_at)}
                                    </Text>
                                </View>
                            </Pressable>
                        ))
                    )}
                </View>

                <View style={styles.quickActions}>
                    <QuickAction theme={theme} icon="add-circle-outline" label="Ajouter un produit" onPress={() => router.push('/product/new')} />
                    <QuickAction theme={theme} icon="person-circle-outline" label="Compléter le profil" onPress={() => router.push('/(tabs)/profile')} />
                    <QuickAction theme={theme} icon="chatbubble-ellipses-outline" label="Ouvrir les messages" onPress={() => router.push('/(tabs)/messages')} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function StatCard({
    title,
    value,
    icon,
    theme,
}: {
    title: string;
    value: string;
    icon: keyof typeof Ionicons.glyphMap;
    theme: ReturnType<typeof useTheme>;
}) {
    const styles = createStyles(theme);
    return (
        <View style={styles.statCard}>
            <View style={styles.statIcon}>
                <Ionicons name={icon} size={18} color={theme.primary} />
            </View>
            <Text style={styles.statLabel}>{title}</Text>
            <Text style={styles.statValue}>{value}</Text>
        </View>
    );
}

function AlertRow({
    theme,
    icon,
    label,
    hint,
}: {
    theme: ReturnType<typeof useTheme>;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    hint: string;
}) {
    const styles = createStyles(theme);
    return (
        <View style={styles.alertRow}>
            <Ionicons name={icon} size={18} color={theme.primary} />
            <View style={{ flex: 1 }}>
                <Text style={styles.alertTitle}>{label}</Text>
                <Text style={styles.alertHint}>{hint}</Text>
            </View>
        </View>
    );
}

function QuickAction({
    theme,
    icon,
    label,
    onPress,
}: {
    theme: ReturnType<typeof useTheme>;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
}) {
    const styles = createStyles(theme);
    return (
        <Pressable style={styles.actionCard} onPress={onPress}>
            <Ionicons name={icon} size={24} color={theme.primary} />
            <Text style={styles.actionLabel}>{label}</Text>
        </Pressable>
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
        hero: {
            backgroundColor: theme.primary,
            padding: 20,
            borderRadius: 24,
            gap: 6,
        },
        greeting: {
            color: 'rgba(255,255,255,0.82)',
            fontSize: 13,
            fontWeight: '600',
        },
        heroTitle: {
            color: '#fff',
            fontSize: 26,
            fontWeight: '800',
        },
        heroSubtitle: {
            color: 'rgba(255,255,255,0.82)',
            fontSize: 14,
        },
        grid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12,
        },
        statCard: {
            width: '48%',
            backgroundColor: theme.card,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 16,
            gap: 8,
        },
        statIcon: {
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: theme.primaryLight,
            alignItems: 'center',
            justifyContent: 'center',
        },
        statLabel: {
            fontSize: 12,
            color: theme.textSecondary,
            fontWeight: '600',
        },
        statValue: {
            fontSize: 19,
            fontWeight: '800',
            color: theme.text,
        },
        alertCard: {
            backgroundColor: theme.card,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 16,
            gap: 12,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: '700',
            color: theme.text,
        },
        alertRow: {
            flexDirection: 'row',
            gap: 12,
            alignItems: 'flex-start',
        },
        alertTitle: {
            color: theme.text,
            fontWeight: '700',
            fontSize: 14,
        },
        alertHint: {
            color: theme.textSecondary,
            fontSize: 12,
            marginTop: 2,
            lineHeight: 18,
        },
        card: {
            backgroundColor: theme.card,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 16,
            gap: 12,
        },
        sectionHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        link: {
            color: theme.primary,
            fontWeight: '700',
        },
        emptyText: {
            color: theme.textSecondary,
            lineHeight: 20,
        },
        timelineRow: {
            flexDirection: 'row',
            gap: 12,
            alignItems: 'center',
            paddingVertical: 6,
        },
        timelineIcon: {
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: theme.primaryLight,
            alignItems: 'center',
            justifyContent: 'center',
        },
        timelineTitle: {
            color: theme.text,
            fontSize: 14,
            fontWeight: '700',
        },
        timelineSubtitle: {
            color: theme.textSecondary,
            fontSize: 12,
            marginTop: 2,
        },
        quickActions: {
            flexDirection: 'row',
            gap: 12,
            marginBottom: 16,
        },
        actionCard: {
            flex: 1,
            backgroundColor: theme.card,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 16,
            gap: 10,
            alignItems: 'flex-start',
        },
        actionLabel: {
            color: theme.text,
            fontSize: 13,
            fontWeight: '700',
            lineHeight: 18,
        },
    });
}
