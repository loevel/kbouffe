import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Radii, Typography, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getNotifications, markNotificationRead, type AppNotification } from '@/lib/api';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const NOTIF_ICONS: Record<string, { icon: string; color: string }> = {
    order_update:   { icon: 'receipt',               color: '#3b82f6' },
    delivery:       { icon: 'bicycle',               color: '#10b981' },
    promotion:      { icon: 'pricetag',              color: '#f59e0b' },
    loyalty:        { icon: 'star',                  color: '#a855f7' },
    reservation:    { icon: 'calendar',              color: '#ec4899' },
    system:         { icon: 'notifications',         color: '#64748b' },
};

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'À l\'instant';
    if (mins < 60) return `Il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Hier';
    return `Il y a ${days}j`;
}

function formatGroupDate(dateStr: string) {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Aujourd\'hui';
    if (date.toDateString() === yesterday.toDateString()) return 'Hier';
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

export default function NotificationsScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const isDark = colorScheme === 'dark';

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
        Haptics.selectionAsync();
        if (!notif.isRead) {
            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
            markNotificationRead(notif.id).catch(() => {/* ignore */});
        }
        if (notif.type === 'order_update' && notif.relatedId) {
            router.push(`/order/${notif.relatedId}`);
        } else if (notif.type === 'reservation' && notif.relatedId) {
            router.push('/profile/reservations');
        } else if (notif.type === 'promotion') {
            router.push('/offers');
        }
    };

    const markAllRead = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const grouped = notifications.reduce<Record<string, AppNotification[]>>((acc, n) => {
        const date = new Date(n.createdAt).toDateString();
        if (!acc[date]) acc[date] = [];
        acc[date].push(n);
        return acc;
    }, {});

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top, Spacing.md) }]}>
                <Pressable onPress={() => router.back()} hitSlop={8} style={[styles.backBtn, { backgroundColor: isDark ? '#ffffff08' : '#f1f5f9' }]}>
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
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
                    <Pressable
                        onPress={markAllRead}
                        hitSlop={8}
                        style={({ pressed }) => [
                            styles.readAllBtn,
                            { backgroundColor: theme.primary + '10' },
                            pressed && { opacity: 0.7 },
                        ]}
                    >
                        <Ionicons name="checkmark-done" size={16} color={theme.primary} />
                    </Pressable>
                ) : (
                    <View style={{ width: 40 }} />
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
                        <Animated.View
                            entering={FadeInDown.duration(400).springify()}
                            style={styles.emptyState}
                        >
                            <View style={[styles.emptyIconCircle, { backgroundColor: theme.primary + '12' }]}>
                                <Ionicons name="notifications-off-outline" size={48} color={theme.primary} />
                            </View>
                            <Text style={[styles.emptyTitle, { color: theme.text }]}>Aucune notification</Text>
                            <Text style={[styles.emptyText, { color: theme.icon }]}>
                                Vos mises à jour de commandes,{'\n'}promotions et rappels apparaîtront ici.
                            </Text>
                        </Animated.View>
                    ) : (
                        Object.entries(grouped).map(([dateKey, items], groupIndex) => (
                            <Animated.View
                                key={dateKey}
                                entering={FadeInDown.delay(groupIndex * 100).duration(400).springify()}
                            >
                                <Text style={[styles.dateLabel, { color: theme.icon }]}>{formatGroupDate(items[0].createdAt)}</Text>
                                <View style={[styles.card, { backgroundColor: theme.surface }]}>
                                    {items.map((notif, index) => {
                                        const meta = NOTIF_ICONS[notif.type] ?? NOTIF_ICONS.system;
                                        return (
                                            <AnimatedPressable
                                                key={notif.id}
                                                layout={LinearTransition.springify()}
                                                style={({ pressed }) => [
                                                    styles.notifRow,
                                                    index !== items.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border + '30' },
                                                    !notif.isRead && { backgroundColor: theme.primary + '04' },
                                                    pressed && { opacity: 0.7 },
                                                ]}
                                                onPress={() => handlePress(notif)}
                                            >
                                                <View style={[styles.notifIcon, { backgroundColor: meta.color + '15' }]}>
                                                    <Ionicons name={meta.icon as any} size={20} color={meta.color} />
                                                </View>
                                                <View style={styles.notifBody}>
                                                    <View style={styles.notifTitleRow}>
                                                        <Text
                                                            style={[
                                                                styles.notifTitle,
                                                                { color: theme.text },
                                                                !notif.isRead && { fontWeight: '700' },
                                                            ]}
                                                            numberOfLines={1}
                                                        >
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
                                                    <Ionicons name="chevron-forward" size={14} color={theme.border} />
                                                )}
                                            </AnimatedPressable>
                                        );
                                    })}
                                </View>
                            </Animated.View>
                        ))
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    /* Header */
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    headerTitle: { ...Typography.title3 },
    badge: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 5,
    },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    readAllBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },

    /* Loading */
    loadingWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    /* List */
    scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xxl },
    emptyContent: { flex: 1 },

    /* Empty State */
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.xl,
        gap: Spacing.md,
        marginTop: Spacing.xxl,
    },
    emptyIconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
    },
    emptyTitle: { ...Typography.title3, textAlign: 'center' },
    emptyText: { ...Typography.body, textAlign: 'center', lineHeight: 22 },

    /* Date labels */
    dateLabel: {
        ...Typography.small,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: Spacing.sm,
        marginLeft: Spacing.xs,
        marginTop: Spacing.md,
    },

    /* Card */
    card: { borderRadius: Radii.xl, overflow: 'hidden', ...Shadows.sm, marginBottom: Spacing.sm },

    /* Notification row */
    notifRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        gap: Spacing.md,
    },
    notifIcon: {
        width: 44,
        height: 44,
        borderRadius: Radii.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notifBody: { flex: 1 },
    notifTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
    notifTitle: { ...Typography.caption, fontWeight: '600', flex: 1 },
    unreadDot: { width: 8, height: 8, borderRadius: 4 },
    notifMessage: { ...Typography.small, lineHeight: 18 },
    notifTime: { ...Typography.small, marginTop: 4, fontSize: 11, fontWeight: '500' },
});
