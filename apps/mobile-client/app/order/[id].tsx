import { StyleSheet, View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOrders, type MobileOrderStatus } from '@/contexts/orders-context';
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

export default function OrderTrackingScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const { getOrderById } = useOrders();
    const { getTicketsByOrderId } = useSupport();

    const order = getOrderById(id ?? '');

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
                                <View key={step.status} style={styles.timelineStep}>
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
                                </View>
                            );
                        })}}
                    </View>
                )}

                {/* Order items */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Articles commandés</Text>
                {order.items.map((item, i) => (
                    <View key={i} style={[styles.itemRow, { borderColor: theme.border }]}>
                        <View style={[styles.itemQty, { backgroundColor: theme.primary + '15' }]}>
                            <Text style={[styles.itemQtyText, { color: theme.primary }]}>{item.quantity}x</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.itemName, { color: theme.text }]}>{item.name}</Text>
                        </View>
                        <Text style={[styles.itemPrice, { color: theme.text }]}>{(item.price * item.quantity).toLocaleString()} FCFA</Text>
                    </View>
                ))}

                {/* Total */}
                <View style={[styles.totalCard, { borderColor: theme.border }]}>
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
                </View>

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
                        <Pressable style={[styles.supportButton, { backgroundColor: theme.primary + '12', borderColor: theme.primary + '40' }]} onPress={() => router.push({ pathname: '/support/new-ticket', params: { orderId: order.id } })}>
                            <Text style={[styles.supportButtonText, { color: theme.primary }]}>Signaler un litige / demander un remboursement</Text>
                        </Pressable>
                        <Text style={[styles.refundNotice, { color: theme.icon }]}>Note: Les remboursements et la livraison sont traités directement par le restaurant. Kbouffe n'est pas responsable du transport.</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md },
    headerTitle: { ...Typography.title3 },
    scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xxl },
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
});
