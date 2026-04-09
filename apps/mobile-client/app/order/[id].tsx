import { StyleSheet, View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing, FadeInDown, FadeIn } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import { useOrders, type MobileOrderStatus } from '@/contexts/orders-context';
import { cancelOrder } from '@/lib/api';
import { Colors, Spacing, Radii, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSupport } from '@/contexts/support-context';

type StatusStepDef = { status: MobileOrderStatus; label: string; icon: string };

const deliverySteps: StatusStepDef[] = [
    { status: 'pending', label: 'En attente', icon: 'hourglass-outline' },
    { status: 'accepted', label: 'Acceptée', icon: 'checkmark-circle-outline' },
    { status: 'preparing', label: 'En préparation', icon: 'flame-outline' },
    { status: 'ready', label: 'Prête', icon: 'bag-check-outline' },
    { status: 'delivering', label: 'En livraison', icon: 'bicycle-outline' },
    { status: 'completed', label: 'Livrée', icon: 'home-outline' },
];

const pickupSteps: StatusStepDef[] = [
    { status: 'pending', label: 'En attente', icon: 'hourglass-outline' },
    { status: 'accepted', label: 'Acceptée', icon: 'checkmark-circle-outline' },
    { status: 'preparing', label: 'En préparation', icon: 'flame-outline' },
    { status: 'ready', label: 'Prête à retirer', icon: 'bag-check-outline' },
    { status: 'completed', label: 'Récupérée', icon: 'checkmark-done-outline' },
];

const dineInSteps: StatusStepDef[] = [
    { status: 'pending', label: 'En attente', icon: 'hourglass-outline' },
    { status: 'accepted', label: 'Acceptée', icon: 'checkmark-circle-outline' },
    { status: 'preparing', label: 'En préparation', icon: 'flame-outline' },
    { status: 'ready', label: 'Prête', icon: 'bag-check-outline' },
    { status: 'completed', label: 'Servie', icon: 'restaurant-outline' },
];

function getStepsForType(deliveryType: string): StatusStepDef[] {
    if (deliveryType === 'pickup') return pickupSteps;
    if (deliveryType === 'dine_in') return dineInSteps;
    return deliverySteps;
}

const supportStatusLabel = {
    open: 'Ouvert',
    in_review: 'En revue',
    waiting_customer: 'En attente client',
    resolved: 'Résolu',
    closed: 'Clôturé',
} as const;

const supportTypeLabel = {
    question: 'Question',
    incident: 'Incident',
    refund: 'Remboursement',
} as const;

const deliveryStatusIndex: Partial<Record<MobileOrderStatus, number>> = {
    pending: 0,
    confirmed: 0,
    accepted: 1,
    preparing: 2,
    ready: 3,
    delivering: 4,
    delivered: 5,
    completed: 5,
    cancelled: -1,
};

const shortStatusIndex: Partial<Record<MobileOrderStatus, number>> = {
    pending: 0,
    confirmed: 0,
    accepted: 1,
    preparing: 2,
    ready: 3,
    delivered: 4,
    completed: 4,
    cancelled: -1,
};

const ESTIMATED_MINUTES: Partial<Record<string, number>> = {
    pending:    30,
    confirmed:  28,
    accepted:   25,
    preparing:  20,
    ready:      10,
    delivering:  5,
    completed:   0,
    delivered:   0,
};

function LiveDeliveryBanner({ theme }: { theme: typeof Colors['light'] }) {
    const pulse = useSharedValue(1);
    useEffect(() => {
        pulse.value = withRepeat(
            withSequence(
                withTiming(1.15, { duration: 700, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
            ),
            -1,
            false,
        );
    }, [pulse]);

    const bikeAnim = useSharedValue(0);
    useEffect(() => {
        bikeAnim.value = withRepeat(
            withTiming(1, { duration: 2500, easing: Easing.linear }),
            -1,
            false,
        );
    }, [bikeAnim]);

    const bikeStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: bikeAnim.value * 220 }],
    }));

    const dotStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulse.value }],
        opacity: pulse.value > 1.05 ? 0.8 : 1,
    }));

    return (
        <View style={[liveBannerStyles.container, { backgroundColor: '#10b98115', borderColor: '#10b98130' }]}>
            <View style={liveBannerStyles.header}>
                <Animated.View style={[liveBannerStyles.dot, { backgroundColor: '#10b981' }, dotStyle]} />
                <Text style={[liveBannerStyles.title, { color: '#10b981' }]}>Votre commande est en route !</Text>
            </View>
            <View style={liveBannerStyles.track}>
                <View style={[liveBannerStyles.trackLine, { backgroundColor: '#10b98130' }]} />
                <Animated.View style={[liveBannerStyles.bikeWrapper, bikeStyle]}>
                    <Text style={liveBannerStyles.bikeIcon}>🚴</Text>
                </Animated.View>
                <View style={[liveBannerStyles.destination, { backgroundColor: '#10b981' }]}>
                    <Text style={liveBannerStyles.destinationIcon}>🏠</Text>
                </View>
            </View>
        </View>
    );
}

export default function OrderTrackingScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const { getOrderById, updateOrderStatus } = useOrders();
    const { getTicketsByOrderId } = useSupport();
    const [isCancelling, setIsCancelling] = useState(false);

    const order = getOrderById(id ?? '');

    const handleCancelOrder = () => {
        if (!order) return;
        Alert.alert(
            'Annuler la commande',
            'Êtes-vous sûr de vouloir annuler cette commande ?',
            [
                { text: 'Non', style: 'cancel' },
                {
                    text: 'Oui, annuler',
                    style: 'destructive',
                    onPress: async () => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                        setIsCancelling(true);
                        try {
                            await cancelOrder(order.id);
                            updateOrderStatus(order.id, 'cancelled');
                        } catch (err: any) {
                            Alert.alert(
                                'Erreur',
                                err?.message ?? 'Impossible d\'annuler la commande. Veuillez réessayer.',
                            );
                        } finally {
                            setIsCancelling(false);
                        }
                    },
                },
            ],
        );
    };

    if (!order) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator color={theme.primary} />
                <Text style={{ color: theme.icon, marginTop: Spacing.md }}>Recherche de la commande...</Text>
                <Pressable onPress={() => router.back()} style={{ marginTop: Spacing.md }}>
                    <Text style={{ color: theme.primary }}>Retour</Text>
                </Pressable>
            </View>
        );
    }

    const activeSteps = getStepsForType(order.deliveryType);
    const idxMap = order.deliveryType === 'delivery' ? deliveryStatusIndex : shortStatusIndex;
    const currentStepIndex = idxMap[order.status] ?? 0;
    const isCancelled = order.status === 'cancelled';
    const relatedTickets = getTicketsByOrderId(order.id);

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Commande #{order.id.slice(-4)}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Live delivery banner */}
                {order.deliveryType === 'delivery' && order.status === 'delivering' && (
                    <LiveDeliveryBanner theme={theme} />
                )}

                {/* Estimated time */}
                {!isCancelled && order.status !== 'completed' && order.status !== 'delivered' && (
                    <View style={[styles.estimatedCard, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '25' }]}>
                        <Ionicons name="time-outline" size={20} color={theme.primary} />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.estimatedLabel, { color: theme.icon }]}>Temps estimé</Text>
                            <Text style={[styles.estimatedValue, { color: theme.primary }]}>
                                ~{ESTIMATED_MINUTES[order.status] ?? 30} minutes restantes
                            </Text>
                        </View>
                        <View style={[styles.progressWrapper, { backgroundColor: theme.border }]}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        backgroundColor: theme.primary,
                                        width: `${Math.round((1 - (ESTIMATED_MINUTES[order.status] ?? 30) / 30) * 100)}%` as any,
                                    },
                                ]}
                            />
                        </View>
                    </View>
                )}

                {/* Delivery tracking map — shown when order is in delivery and restaurant has coordinates */}
                {order.deliveryType === 'delivery' && order.status === 'delivering' && order.restaurantLat && order.restaurantLng && (
                    <View style={styles.trackingMapContainer}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Suivi en direct</Text>
                        <MapView
                            style={styles.trackingMap}
                            provider={PROVIDER_DEFAULT}
                            mapType="none"
                            initialRegion={{
                                latitude: order.restaurantLat,
                                longitude: order.restaurantLng,
                                latitudeDelta: 0.02,
                                longitudeDelta: 0.02,
                            }}
                            scrollEnabled={false}
                            zoomEnabled={false}
                        >
                            <UrlTile
                                urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                                maximumZ={19}
                                flipY={false}
                                tileSize={256}
                            />
                            <Marker
                                coordinate={{ latitude: order.restaurantLat, longitude: order.restaurantLng }}
                                title={order.restaurantName}
                                pinColor="#f97316"
                            />
                        </MapView>
                    </View>
                )}

                {/* Restaurant */}
                <View style={[styles.restaurantCard, { borderColor: theme.border }]}>
                    <Ionicons name="restaurant-outline" size={20} color={theme.primary} />
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.restaurantName, { color: theme.text }]}>{order.restaurantName}</Text>
                        <Text style={[styles.orderDate, { color: theme.icon }]}>
                            {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                </View>

                {/* Timeline */}
                {isCancelled ? (
                    <View style={[styles.cancelledCard, { borderColor: '#ef4444' + '30', backgroundColor: '#ef4444' + '08' }]}>
                        <Ionicons name="close-circle" size={32} color="#ef4444" />
                        <Text style={[styles.cancelledTitle, { color: '#ef4444' }]}>Commande annulée</Text>
                    </View>
                ) : (
                    <View style={styles.timeline}>
                        {activeSteps.map((step, index) => {
                            const isDone = index <= currentStepIndex;
                            const isCurrent = index === currentStepIndex;
                            const color = isDone ? theme.primary : theme.border;

                            return (
                                <Animated.View entering={FadeInDown.delay(index * 100).duration(400).springify()} key={step.status} style={styles.timelineStep}>
                                    <View style={styles.timelineIndicator}>
                                        <View style={[
                                            styles.timelineDot,
                                            { backgroundColor: isDone ? theme.primary : 'transparent', borderColor: color },
                                            isCurrent && styles.timelineDotCurrent,
                                        ]}>
                                            {isDone && <Ionicons name="checkmark" size={14} color="#fff" />}
                                        </View>
                                        {index < activeSteps.length - 1 && (
                                            <View style={[styles.timelineLine, { backgroundColor: index < currentStepIndex ? theme.primary : theme.border }]} />
                                        )}
                                    </View>
                                    <View style={styles.timelineContent}>
                                        <View style={[styles.timelineIcon, { backgroundColor: isDone ? theme.primary + '15' : theme.border + '40' }]}>
                                            <Ionicons name={step.icon as any} size={20} color={isDone ? theme.primary : theme.icon} />
                                        </View>
                                        <Text style={[styles.timelineLabel, { color: isDone ? theme.text : theme.icon, fontWeight: isCurrent ? '700' : '400' }]}>
                                            {step.label}
                                        </Text>
                                    </View>
                                </Animated.View>
                            );
                        })}
                    </View>
                )}

                {/* Order items */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Articles commandés</Text>
                {order.items.map((item, i) => (
                    <Animated.View entering={FadeInDown.delay(activeSteps.length * 100 + i * 50).duration(400).springify()} key={i} style={[styles.itemRow, { borderColor: theme.border }]}>
                        <View style={[styles.itemQty, { backgroundColor: theme.primary + '15' }]}>
                            <Text style={[styles.itemQtyText, { color: theme.primary }]}>{item.quantity}x</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.itemName, { color: theme.text }]}>{item.name}</Text>
                        </View>
                        <Text style={[styles.itemPrice, { color: theme.text }]}>{(item.price * item.quantity).toLocaleString()} FCFA</Text>
                    </Animated.View>
                ))}

                {/* Total */}
                <Animated.View entering={FadeInDown.delay(500).duration(400).springify()} style={[styles.totalCard, { borderColor: theme.border }]}>
                    <View style={styles.totalRow}>
                        <Text style={[styles.totalLabel, { color: theme.icon }]}>Sous-total</Text>
                        <Text style={[styles.totalValue, { color: theme.text }]}>{order.subtotal.toLocaleString()} FCFA</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={[styles.totalLabel, { color: theme.icon }]}>Livraison</Text>
                        <Text style={[styles.totalValue, { color: theme.text }]}>{order.deliveryFee > 0 ? `${order.deliveryFee.toLocaleString()} FCFA` : 'Gratuit'}</Text>
                    </View>
                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
                    <View style={styles.totalRow}>
                        <Text style={[styles.totalBold, { color: theme.text }]}>Total</Text>
                        <Text style={[styles.totalBold, { color: theme.primary }]}>{order.total.toLocaleString()} FCFA</Text>
                    </View>
                </Animated.View>

                {/* Delivery info */}
                {order.deliveryAddress && (
                    <View style={[styles.infoCard, { borderColor: theme.border }]}>
                        <Ionicons name="location-outline" size={20} color={theme.primary} />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.infoLabel, { color: theme.icon }]}>Adresse de livraison</Text>
                            <Text style={[styles.infoValue, { color: theme.text }]}>{order.deliveryAddress}</Text>
                        </View>
                    </View>
                )}

                <View style={[styles.infoCard, { borderColor: theme.border }]}> 
                    <Ionicons name="help-circle-outline" size={20} color={theme.primary} />
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.infoLabel, { color: theme.icon }]}>Support & litiges</Text>
                        <Text style={[styles.infoValue, { color: theme.text }]}>Tickets liés: {relatedTickets.length}</Text>
                        {relatedTickets.map((ticket) => (
                            <Text key={ticket.id} style={[styles.ticketStatus, { color: theme.icon }]}>• {supportTypeLabel[ticket.type]} · {supportStatusLabel[ticket.status]}</Text>
                        ))}
                        <Pressable 
                            style={({ pressed }) => [
                                styles.supportButton, 
                                { backgroundColor: theme.primary + '12', borderColor: theme.primary + '40' },
                                pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
                            ]} 
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push({ pathname: '/support/new-ticket', params: { orderId: order.id } });
                            }}
                        >
                            <Text style={[styles.supportButtonText, { color: theme.primary }]}>Signaler un litige / demander un remboursement</Text>
                        </Pressable>
                        <Text style={[styles.refundNotice, { color: theme.icon }]}>Note: Les remboursements et la livraison sont traités directement par le restaurant. Kbouffe n'est pas responsable du transport.</Text>
                    </View>
                </View>

                {/* Review CTA — only when order is done */}
                {['completed', 'delivered'].includes(order.status) && (
                    <Animated.View entering={FadeInDown.delay(600).duration(400).springify()}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.reviewCta, 
                                { borderColor: '#f59e0b' + '50', backgroundColor: '#f59e0b' + '10' },
                                pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
                            ]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                router.push({
                                    pathname: '/review/[orderId]' as any,
                                    params: { orderId: order.id, restaurantId: order.restaurantId, restaurantName: order.restaurantName },
                                });
                            }}
                        >
                        <Ionicons name="star" size={22} color="#f59e0b" />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.reviewCtaTitle, { color: '#92400e' }]}>Votre avis compte !</Text>
                            <Text style={[styles.reviewCtaBody, { color: '#b45309' }]}>Évaluez votre expérience chez {order.restaurantName}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#f59e0b" />
                        </Pressable>
                    </Animated.View>
                )}

                {/* Cancel order — only when cancellable */}
                {(order.status === 'pending' || order.status === 'confirmed') && (
                    <Pressable
                        style={[styles.cancelButton, isCancelling && styles.cancelButtonDisabled]}
                        onPress={handleCancelOrder}
                        disabled={isCancelling}
                    >
                        {isCancelling ? (
                            <ActivityIndicator size="small" color="#ef4444" />
                        ) : (
                            <Ionicons name="close-circle-outline" size={20} color="#ef4444" />
                        )}
                        <Text style={styles.cancelButtonText}>
                            {isCancelling ? 'Annulation en cours…' : 'Annuler la commande'}
                        </Text>
                    </Pressable>
                )}
            </ScrollView>
        </View>
    );
}

const liveBannerStyles = StyleSheet.create({
    container: {
        borderWidth: 1,
        borderRadius: Radii.lg,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        overflow: 'hidden',
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
    dot: { width: 10, height: 10, borderRadius: 5 },
    title: { ...Typography.captionSemibold },
    track: { height: 36, justifyContent: 'center', overflow: 'hidden' },
    trackLine: { position: 'absolute', left: 0, right: 0, height: 3, borderRadius: 2 },
    bikeWrapper: { position: 'absolute', left: 0, top: 4 },
    bikeIcon: { fontSize: 22 },
    destination: { position: 'absolute', right: 4, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    destinationIcon: { fontSize: 14 },
});

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md },
    headerTitle: { ...Typography.title3 },
    scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xxl },
    estimatedCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        padding: Spacing.md,
        borderWidth: 1,
        borderRadius: Radii.lg,
        marginBottom: Spacing.md,
    },
    estimatedLabel: { ...Typography.small },
    estimatedValue: { ...Typography.bodySemibold },
    progressWrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        borderRadius: 0,
        borderBottomLeftRadius: Radii.lg,
        borderBottomRightRadius: Radii.lg,
    },
    progressFill: { height: '100%', borderRadius: 2 },
    restaurantCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        padding: Spacing.md,
        borderWidth: 1,
        borderRadius: Radii.lg,
        marginBottom: Spacing.lg,
    },
    restaurantName: { ...Typography.body, fontWeight: '600' },
    orderDate: { ...Typography.caption, marginTop: 2 },
    cancelledCard: {
        borderWidth: 1,
        borderRadius: Radii.lg,
        padding: Spacing.lg,
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    cancelledTitle: { ...Typography.title3, marginTop: Spacing.sm },
    timeline: { marginBottom: Spacing.lg },
    timelineStep: { flexDirection: 'row', minHeight: 60 },
    timelineIndicator: { width: 30, alignItems: 'center' },
    timelineDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    timelineDotCurrent: {
        shadowColor: '#f97316',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 4,
    },
    timelineLine: { width: 2, flex: 1, marginTop: -2, marginBottom: -2 },
    timelineContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1, paddingLeft: Spacing.md, paddingBottom: Spacing.lg },
    timelineIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    timelineLabel: { ...Typography.body },
    sectionTitle: { ...Typography.title3, marginBottom: Spacing.md },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        padding: Spacing.md,
        borderWidth: 1,
        borderRadius: Radii.md,
        marginBottom: Spacing.sm,
    },
    itemQty: { width: 36, height: 36, borderRadius: Radii.sm, alignItems: 'center', justifyContent: 'center' },
    itemQtyText: { ...Typography.caption, fontWeight: '700' },
    itemName: { ...Typography.body, fontWeight: '500' },
    itemOptions: { ...Typography.small, marginTop: 2 },
    itemPrice: { ...Typography.caption, fontWeight: '600' },
    totalCard: { borderWidth: 1, borderRadius: Radii.lg, padding: Spacing.md, marginTop: Spacing.md },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
    totalLabel: { ...Typography.caption },
    totalValue: { ...Typography.caption, fontWeight: '500' },
    divider: { height: 1, marginVertical: Spacing.sm },
    totalBold: { ...Typography.body, fontWeight: '700' },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.md,
        padding: Spacing.md,
        borderWidth: 1,
        borderRadius: Radii.lg,
        marginTop: Spacing.md,
    },
    infoLabel: { ...Typography.small },
    infoValue: { ...Typography.body, fontWeight: '500', marginTop: 2 },
    ticketStatus: { ...Typography.small, marginTop: 2 },
    supportButton: {
        marginTop: Spacing.sm,
        borderWidth: 1,
        borderRadius: Radii.md,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
    },
    supportButtonText: { ...Typography.small, fontWeight: '700' },
    refundNotice: { ...Typography.small, fontSize: 11, marginTop: Spacing.xs, fontStyle: 'italic' },
    reviewCta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        borderWidth: 1,
        borderRadius: Radii.lg,
        padding: Spacing.md,
        marginTop: Spacing.md,
    },
    reviewCtaTitle: { ...Typography.body, fontWeight: '700' },
    reviewCtaBody: { ...Typography.small, marginTop: 2 },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        marginTop: Spacing.lg,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        borderWidth: 1.5,
        borderColor: '#ef4444' + '60',
        borderRadius: Radii.lg,
        backgroundColor: '#ef4444' + '08',
    },
    cancelButtonDisabled: {
        opacity: 0.5,
    },
    cancelButtonText: {
        ...Typography.body,
        fontWeight: '600',
        color: '#ef4444',
    },
    trackingMapContainer: {
        marginBottom: Spacing.md,
        gap: Spacing.sm,
    },
    trackingMap: {
        height: 180,
        borderRadius: Radii.lg,
        overflow: 'hidden',
    },
});
