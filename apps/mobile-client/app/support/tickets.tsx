import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSupport, type SupportTicketStatus } from '@/contexts/support-context';

const typeLabel = {
    question: 'Question',
    incident: 'Incident',
    refund: 'Remboursement',
} as const;

const statusLabel: Record<SupportTicketStatus, string> = {
    open: 'Ouvert',
    in_review: 'En revue',
    waiting_customer: 'En attente client',
    resolved: 'Résolu',
    closed: 'Clôturé',
};

const statusColor: Record<SupportTicketStatus, string> = {
    open: '#f59e0b',
    in_review: '#3b82f6',
    waiting_customer: '#8b5cf6',
    resolved: '#10b981',
    closed: '#6b7280',
};

export default function SupportTicketsScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const { tickets } = useSupport();

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top + Spacing.md }]}> 
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>Mes tickets</Text>
                <Pressable onPress={() => router.push('/support/new-ticket')}>
                    <Ionicons name="add-circle-outline" size={24} color={theme.primary} />
                </Pressable>
            </View>

            <FlatList
                data={tickets}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: Spacing.md, paddingBottom: insets.bottom + Spacing.xl, gap: Spacing.sm }}
                renderItem={({ item }) => (
                    <Pressable
                        onPress={() => router.push(`/support/${item.id}`)}
                        style={({ pressed }) => [
                            styles.card,
                            { borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
                        ]}
                    >
                        <View style={styles.row}>
                            <Text style={[styles.ticketTitle, { color: theme.text }]} numberOfLines={1}>{item.subject}</Text>
                            <View style={[styles.badge, { backgroundColor: statusColor[item.status] + '20' }]}> 
                                <Text style={[styles.badgeText, { color: statusColor[item.status] }]}>{statusLabel[item.status]}</Text>
                            </View>
                        </View>
                        <Text style={[styles.ticketMeta, { color: theme.icon }]}>#{item.id.slice(-6)} · {typeLabel[item.type]}{item.orderId ? ` · cmd #${item.orderId.slice(-4)}` : ''}</Text>
                        <Text style={[styles.ticketMessage, { color: theme.icon }]} numberOfLines={2}>{item.description}</Text>
                        <View style={styles.cardFooter}>
                            <Ionicons name="chevron-forward" size={14} color={theme.icon} />
                        </View>
                    </Pressable>
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="help-buoy-outline" size={44} color={theme.icon} />
                        <Text style={[styles.emptyTitle, { color: theme.text }]}>Aucun ticket</Text>
                        <Text style={[styles.emptySubtitle, { color: theme.icon }]}>Le support devient traçable dès votre première demande.</Text>
                    </View>
                }
            />
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
        marginBottom: Spacing.sm,
    },
    title: { ...Typography.title2 },
    card: {
        borderWidth: 1,
        borderRadius: Radii.lg,
        padding: Spacing.md,
        gap: 4,
    },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
    ticketTitle: { ...Typography.body, fontWeight: '700', flex: 1 },
    badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radii.full },
    badgeText: { ...Typography.small, fontWeight: '700' },
    ticketMeta: { ...Typography.small },
    ticketMessage: { ...Typography.caption },
    resolveButton: {
        marginTop: Spacing.sm,
        borderWidth: 1,
        borderRadius: Radii.full,
        paddingVertical: Spacing.xs,
        alignItems: 'center',
    },
    resolveButtonText: { ...Typography.small, fontWeight: '700' },
    cardFooter: { alignItems: 'flex-end', marginTop: 2 },
    empty: { alignItems: 'center', paddingTop: Spacing.xxl, gap: Spacing.sm },
    emptyTitle: { ...Typography.title3 },
    emptySubtitle: { ...Typography.caption, textAlign: 'center', maxWidth: 280 },
});
