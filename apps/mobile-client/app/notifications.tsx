import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Radii, Typography, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getNotifications, markNotificationRead, type AppNotification } from '@/lib/api';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ── Color-coded icon mapping per notification type ───────────────────────────
const NOTIF_META: Record<string, { icon: string; bgLight: string; bgDark: string; fg: string }> = {
    order_update:   { icon: 'receipt-outline',           bgLight: '#EFF6FF', bgDark: '#1e293b', fg: '#3b82f6' },
    delivery:       { icon: 'bicycle-outline',           bgLight: '#ECFDF5', bgDark: '#14261e', fg: '#10b981' },
    promotion:      { icon: 'megaphone-outline',         bgLight: '#FFFBEB', bgDark: '#2a2008', fg: '#f59e0b' },
    loyalty:        { icon: 'diamond-outline',            bgLight: '#FAF5FF', bgDark: '#231432', fg: '#a855f7' },
    reservation:    { icon: 'calendar-outline',          bgLight: '#FDF2F8', bgDark: '#2c1422', fg: '#ec4899' },
    system:         { icon: 'information-circle-outline', bgLight: '#F8FAFC', bgDark: '#1a1d24', fg: '#64748b' },
};

// ── Time formatting helpers ──────────────────────────────────────────────────
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

// ── Main component ───────────────────────────────────────────────────────────
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
            {/* ── Header ── */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top, Spacing.md), borderBottomColor: theme.border }]}>
                <Pressable
                    onPress={() => router.back()}
                    hitSlop={12}
                    style={({ pressed }) => [
                        styles.headerBtn,
                        { backgroundColor: theme.surfaceElevated },
                        Shadows.sm,
                        pressed && { opacity: 0.7 },
                    ]}
                >
                    <Ionicons name="arrow-back" size={20} color={theme.text} />
                </Pressable>

                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Notifications</Text>
                    {unreadCount > 0 && (
                        <View style={[styles.headerBadge, { backgroundColor: theme.primary }]}>
                            <Text style={styles.headerBadgeText}>{unreadCount}</Text>
                        </View>
                    )}
                </View>

                {unreadCount > 0 ? (
                    <Pressable
                        onPress={markAllRead}
                        hitSlop={12}
                        style={({ pressed }) => [
                            styles.headerBtn,
                            { backgroundColor: theme.primaryLight },
                            pressed && { opacity: 0.7 },
                        ]}
                    >
                        <Ionicons name="checkmark-done" size={18} color={theme.primary} />
                    </Pressable>
                ) : (
                    <View style={{ width: 40 }} />
                )}
            </View>

            {/* ── Content ── */}
            {loading ? (
                <View style={styles.loadingWrapper}>
                    <ActivityIndicator color={theme.primary} size="large" />
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        notifications.length === 0 && styles.emptyContent,
                    ]}
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
                        /* ── Empty state ── */
                        <Animated.View
                            entering={FadeInDown.duration(400).springify()}
                            style={styles.emptyState}
                        >
                            <View style={[styles.emptyIconRing, { borderColor: theme.border }]}>
                                <View style={[styles.emptyIconInner, { backgroundColor: theme.primaryLight }]}>
                                    <Ionicons name="notifications-off-outline" size={36} color={theme.primary} />
                                </View>
                            </View>
                            <Text style={[styles.emptyTitle, { color: theme.text }]}>
                                Aucune notification
                            </Text>
                            <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
                                Vos mises à jour de commandes, promotions et rappels apparaîtront ici.
                            </Text>
                        </Animated.View>
                    ) : (
                        /* ── Grouped notifications ── */
                        Object.entries(grouped).map(([dateKey, items], groupIndex) => (
                            <Animated.View
                                key={dateKey}
                                entering={FadeInDown.delay(groupIndex * 80).duration(350).springify()}
                            >
                                {/* Date section header */}
                                <Text style={[styles.dateLabel, { color: theme.textMuted }]}>
                                    {formatGroupDate(items[0].createdAt)}
                                </Text>

                                {/* Notification cards — each notification is its own card */}
                                {items.map((notif, index) => {
                                    const meta = NOTIF_META[notif.type] ?? NOTIF_META.system;
                                    const iconBg = isDark ? meta.bgDark : meta.bgLight;

                                    return (
                                        <AnimatedPressable
                                            key={notif.id}
                                            layout={LinearTransition.springify()}
                                            style={({ pressed }) => [
                                                styles.notifCard,
                                                {
                                                    backgroundColor: theme.surfaceElevated,
                                                    borderColor: !notif.isRead ? meta.fg + '30' : theme.border,
                                                },
                                                Shadows.sm,
                                                pressed && { transform: [{ scale: 0.98 }], opacity: 0.85 },
                                            ]}
                                            onPress={() => handlePress(notif)}
                                        >
                                            {/* Colored accent bar on the left for unread */}
                                            {!notif.isRead && (
                                                <View style={[styles.accentBar, { backgroundColor: meta.fg }]} />
                                            )}

                                            {/* Icon */}
                                            <View style={[styles.notifIcon, { backgroundColor: iconBg }]}>
                                                <Ionicons name={meta.icon as any} size={22} color={meta.fg} />
                                            </View>

                                            {/* Body */}
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
                                                        <View style={[styles.unreadDot, { backgroundColor: meta.fg }]} />
                                                    )}
                                                </View>
                                                <Text
                                                    style={[styles.notifMessage, { color: theme.textMuted }]}
                                                    numberOfLines={2}
                                                >
                                                    {notif.message}
                                                </Text>
                                                <View style={styles.notifFooter}>
                                                    <Ionicons name="time-outline" size={12} color={theme.tabIconDefault} />
                                                    <Text style={[styles.notifTime, { color: theme.tabIconDefault }]}>
                                                        {timeAgo(notif.createdAt)}
                                                    </Text>
                                                </View>
                                            </View>

                                            {/* Chevron for actionable items */}
                                            {notif.relatedId && (
                                                <View style={[styles.notifChevron, { backgroundColor: meta.fg + '10' }]}>
                                                    <Ionicons name="chevron-forward" size={20} color={meta.fg} />
                                                </View>
                                            )}
                                        </AnimatedPressable>
                                    );
                                })}
                            </Animated.View>
                        ))
                    )}
                </ScrollView>
            )}
        </View>
    );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    /* ── Header ── */
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    headerBtn: {
        width: 40,
        height: 40,
        borderRadius: Radii.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    headerTitle: {
        ...Typography.title3,
    },
    headerBadge: {
        minWidth: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
    },
    headerBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '800',
    },

    /* ── Loading ── */
    loadingWrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    /* ── Scroll ── */
    scrollContent: {
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.xxl,
    },
    emptyContent: {
        flex: 1,
    },

    /* ── Empty state ── */
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.xl,
        gap: Spacing.sm,
        marginTop: Spacing.xxl * 2,
    },
    emptyIconRing: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    emptyIconInner: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyTitle: {
        ...Typography.title3,
        textAlign: 'center',
    },
    emptySubtitle: {
        ...Typography.body,
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: 280,
    },

    /* ── Date section label ── */
    dateLabel: {
        ...Typography.smallSemibold,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: Spacing.lg,
        marginBottom: Spacing.sm,
        marginLeft: Spacing.xs,
    },

    /* ── Notification card ── */
    notifCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: Radii.xl,
        borderWidth: 1,
        marginBottom: Spacing.sm,
        gap: Spacing.md,
        overflow: 'hidden',
    },
    accentBar: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        borderTopLeftRadius: Radii.xl,
        borderBottomLeftRadius: Radii.xl,
    },
    notifIcon: {
        width: 46,
        height: 46,
        borderRadius: Radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notifBody: {
        flex: 1,
    },
    notifTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 3,
    },
    notifTitle: {
        ...Typography.captionSemibold,
        flex: 1,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    notifMessage: {
        ...Typography.small,
        lineHeight: 18,
        marginBottom: 6,
    },
    notifFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    notifTime: {
        fontSize: 11,
        fontWeight: '500',
    },
    notifChevron: {
        width: 36,
        height: 36,
        borderRadius: Radii.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: Spacing.xs,
    },
});
