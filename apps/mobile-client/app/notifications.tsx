import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Radii, Typography, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getNotifications, markNotificationRead, type AppNotification } from '@/lib/api';

const NOTIF_ICONS: Record<string, { icon: string; color: string }> = {
    order_update:   { icon: 'receipt-outline',        color: '#3b82f6' },
    delivery:       { icon: 'bicycle-outline',         color: '#10b981' },
    promotion:      { icon: 'pricetag-outline',        color: '#f59e0b' },
    loyalty:        { icon: 'star-outline',            color: '#a855f7' },
    reservation:    { icon: 'calendar-outline',        color: '#ec4899' },
    system:         { icon: 'notifications-outline',   color: '#64748b' },
};

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'À l\'instant';
    if (mins < 60) return `Il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Il y a ${days}j`;
}

export default function NotificationsScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();

    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadNotifications = useCallback(async () => {
        try {
            const data = await getNotifications();
            setNotifications(data);
        } catch {
            // Graceful fallback — show empty state
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { loadNotifications(); }, [loadNotifications]);

    const handlePress = async (notif: AppNotification) => {
        void Haptics.selectionAsync();
        // Mark as read
        if (!notif.isRead) {
            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
            markNotificationRead(notif.id).catch(() => {/* ignore */});
        }
        // Navigate based on type
        if (notif.type === 'order_update' && notif.relatedId) {
            router.push(`/order/${notif.relatedId}`);
        } else if (notif.type === 'reservation' && notif.relatedId) {
            router.push('/profile/reservations');
        } else if (notif.type === 'promotion') {
            router.push('/offers');
        }
    };

    const markAllRead = () => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const grouped = notifications.reduce<Record<string, AppNotification[]>>((acc, n) => {
        const date = new Date(n.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
        if (!acc[date]) acc[date] = [];
        acc[date].push(n);
        return acc;
    }, {});

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top, Spacing.md) }]}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </Pressable>
                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Notifications</Text>
                    {unreadCount > 0 && (
                        <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                            <Text style={styles.badgeText}>{unreadCount}</Text>
                        </View>
                    )}
                </View>
                {unreadCount > 0 ? (
                    <Pressable onPress={markAllRead} style={styles.readAllBtn}>
                        <Text style={[styles.readAllText, { color: theme.primary }]}>Tout lire</Text>
                    </Pressable>
                ) : (
                    <View style={{ width: 60 }} />
                )}
            </View>

            {loading ? (
                <View style={styles.loadingWrapper}>
                    <ActivityIndicator color={theme.primary} size="large" />
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={[styles.scrollContent, notifications.length === 0 && styles.emptyContent]}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); loadNotifications(); }}
                            tintColor={theme.primary}
                        />
                    }
                >
                    {notifications.length === 0 ? (
                        <View style={styles.emptyState}>
                            <View style={[styles.emptyIcon, { backgroundColor: theme.border + '40' }]}>
                                <Ionicons name="notifications-off-outline" size={48} color={theme.icon} />
                            </View>
                            <Text style={[styles.emptyTitle, { color: theme.text }]}>Aucune notification</Text>
                            <Text style={[styles.emptyText, { color: theme.icon }]}>
                                Vos mises à jour de commandes, promotions et rappels apparaîtront ici.
                            </Text>
                        </View>
                    ) : (
                        Object.entries(grouped).map(([date, items]) => (
                            <View key={date}>
                                <Text style={[styles.dateLabel, { color: theme.icon }]}>{date}</Text>
                                <View style={[styles.card, { backgroundColor: theme.surface }]}>
                                    {items.map((notif, index) => {
                                        const meta = NOTIF_ICONS[notif.type] ?? NOTIF_ICONS.system;
                                        return (
                                            <Pressable
                                                key={notif.id}
                                                style={({ pressed }) => [
                                                    styles.notifRow,
                                                    index !== items.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
                                                    !notif.isRead && { backgroundColor: theme.primary + '06' },
                                                    pressed && { opacity: 0.7 },
                                                ]}
                                                onPress={() => handlePress(notif)}
                                            >
                                                <View style={[styles.notifIcon, { backgroundColor: meta.color + '18' }]}>
                                                    <Ionicons name={meta.icon as any} size={22} color={meta.color} />
                                                </View>
                                                <View style={styles.notifBody}>
                                                    <View style={styles.notifTitleRow}>
                                                        <Text style={[styles.notifTitle, { color: theme.text }, !notif.isRead && { fontWeight: '700' }]}>
                                                            {notif.title}
                                                        </Text>
                                                        {!notif.isRead && (
                                                            <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
                                                        )}
                                                    </View>
                                                    <Text style={[styles.notifMessage, { color: theme.icon }]} numberOfLines={2}>
                                                        {notif.message}
                                                    </Text>
                                                    <Text style={[styles.notifTime, { color: theme.border }]}>
                                                        {timeAgo(notif.createdAt)}
                                                    </Text>
                                                </View>
                                                {notif.relatedId && (
                                                    <Ionicons name="chevron-forward" size={16} color={theme.border} />
                                                )}
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </View>
                        ))
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
        paddingBottom: Spacing.md,
    },
    backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerCenter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    headerTitle: { ...Typography.title3 },
    badge: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    readAllBtn: { width: 60, alignItems: 'flex-end' },
    readAllText: { ...Typography.caption, fontWeight: '600' },
    loadingWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xxl },
    emptyContent: { flex: 1 },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.md, marginTop: Spacing.xxl },
    emptyIcon: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
    emptyTitle: { ...Typography.title3, textAlign: 'center' },
    emptyText: { ...Typography.body, textAlign: 'center', lineHeight: 24 },
    dateLabel: {
        ...Typography.small,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: Spacing.sm,
        marginLeft: Spacing.xs,
        marginTop: Spacing.md,
    },
    card: { borderRadius: Radii.xl, overflow: 'hidden', ...Shadows.sm, marginBottom: Spacing.sm },
    notifRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        gap: Spacing.md,
    },
    notifIcon: { width: 44, height: 44, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center' },
    notifBody: { flex: 1 },
    notifTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: 2 },
    notifTitle: { ...Typography.caption, flex: 1 },
    unreadDot: { width: 8, height: 8, borderRadius: 4 },
    notifMessage: { ...Typography.small, lineHeight: 17 },
    notifTime: { ...Typography.small, marginTop: 4, fontSize: 11 },
});
