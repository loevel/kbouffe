/**
 * app/support/[id].tsx
 *
 * Chat-style message thread for a single support ticket.
 *
 * Layout
 * ──────
 *  ┌──────────────────────────────────┐
 *  │  ← Subject          [status]  ↺  │  ← sticky header
 *  ├──────────────────────────────────┤
 *  │                                  │
 *  │   [support bubble]               │  ← FlatList
 *  │              [customer bubble]   │
 *  │   ...                            │
 *  │                                  │
 *  ├──────────────────────────────────┤
 *  │  [  message input...  ] [➤]      │  ← reply bar (hidden when closed)
 *  └──────────────────────────────────┘
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSupport, type SupportTicketStatus } from '@/contexts/support-context';
import { getTicketMessages, sendTicketMessage, type TicketMessage } from '@/lib/api';

// ── Status display maps (mirrors tickets.tsx) ─────────────────────────────────

const statusLabel: Record<SupportTicketStatus, string> = {
    open: 'Ouvert',
    in_review: 'En cours',
    waiting_customer: 'En attente',
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

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns a human-readable relative time string in French:
 * "à l'instant", "il y a 5 min", "il y a 2h", "hier", "il y a 3 j", or a date.
 */
function formatRelativeTime(dateStr: string): string {
    try {
        const now = new Date();
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'date invalide';
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60_000);

        if (diffMins < 1) return "à l'instant";
        if (diffMins < 60) return `il y a ${diffMins} min`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `il y a ${diffHours}h`;

        const diffDays = Math.floor(diffHours / 24);
        if (diffDays === 1) return 'hier';
        if (diffDays < 7) return `il y a ${diffDays} j`;

        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    } catch {
        return 'date invalide';
    }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SupportTicketDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const { getTicketById } = useSupport();

    // Ticket metadata comes from the support context (already fetched on mount)
    const ticket = getTicketById(id);

    const [messages, setMessages] = useState<TicketMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [inputText, setInputText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const flatListRef = useRef<FlatList<TicketMessage>>(null);

    // A ticket is "closed" when no further replies are allowed
    const isClosed =
        ticket?.status === 'closed' || ticket?.status === 'resolved';

    // ── Fetch messages ────────────────────────────────────────────────────────

    const fetchMessages = useCallback(async () => {
        if (!id) return;
        try {
            const msgs = await getTicketMessages(id);
            setMessages(msgs);
            setError(null);
        } catch (err) {
            console.error('[SupportTicketDetail] fetch messages:', err);
            setError('Impossible de charger les messages.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    // ── Send message ──────────────────────────────────────────────────────────

    const handleSend = async () => {
        const text = inputText.trim();
        if (!text || sending || !id) return;

        setSending(true);
        try {
            await sendTicketMessage(id, text);
            setInputText('');
            await fetchMessages();
        } catch (err) {
            console.error('[SupportTicketDetail] send message:', err);
        } finally {
            setSending(false);
        }
    };

    // ── Auto-scroll to bottom when messages load / change ─────────────────────

    const scrollToBottom = useCallback(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
    }, []);

    useEffect(() => {
        if (!loading && messages.length > 0) {
            // Small delay lets the FlatList finish its layout pass first
            const t = setTimeout(scrollToBottom, 120);
            return () => clearTimeout(t);
        }
    }, [loading, messages.length, scrollToBottom]);

    // ── Render helpers ────────────────────────────────────────────────────────

    const renderMessage = ({
        item,
        index,
    }: {
        item: TicketMessage;
        index: number;
    }) => {
        const isCustomer = item.senderType === 'customer';
        const prevMsg = index > 0 ? messages[index - 1] : null;
        const showSender =
            !prevMsg || prevMsg.senderType !== item.senderType;

        // Avatar initial letter: "V" (vous) for customer, "S" (support) for admin
        const avatarLetter = isCustomer ? 'V' : 'S';
        const avatarBg = isCustomer
            ? theme.primary + '25'
            : (colorScheme === 'dark' ? '#334155' : '#e2e8f0');
        const avatarTextColor = isCustomer ? theme.primary : theme.icon;

        return (
            <View
                style={[
                    styles.messageRow,
                    isCustomer ? styles.messageRowRight : styles.messageRowLeft,
                ]}
            >
                {/* Support avatar — only shown on first message in a group */}
                {!isCustomer && (
                    <View
                        style={[
                            styles.avatar,
                            { backgroundColor: avatarBg },
                            !showSender && styles.avatarHidden,
                        ]}
                    >
                        {showSender && (
                            <Text style={[styles.avatarText, { color: avatarTextColor }]}>
                                {avatarLetter}
                            </Text>
                        )}
                    </View>
                )}

                {/* Bubble column */}
                <View
                    style={[
                        styles.bubbleWrapper,
                        isCustomer ? styles.bubbleWrapperRight : styles.bubbleWrapperLeft,
                    ]}
                >
                    {showSender && (
                        <Text
                            style={[
                                styles.senderName,
                                { color: theme.icon },
                                isCustomer && styles.senderNameRight,
                            ]}
                        >
                            {isCustomer ? 'Vous' : 'Support KBouffe'}
                        </Text>
                    )}

                    <View
                        style={[
                            styles.bubble,
                            isCustomer
                                ? [styles.bubbleUser, { backgroundColor: theme.primary }]
                                : [
                                      styles.bubbleSupport,
                                      {
                                          backgroundColor:
                                              colorScheme === 'dark' ? '#1e293b' : '#f1f5f9',
                                          borderColor: theme.border,
                                      },
                                  ],
                        ]}
                    >
                        <Text
                            style={[
                                styles.bubbleText,
                                { color: isCustomer ? '#fff' : theme.text },
                            ]}
                        >
                            {item.content}
                        </Text>
                    </View>

                    <Text
                        style={[
                            styles.timestamp,
                            { color: theme.icon },
                            isCustomer && styles.timestampRight,
                        ]}
                    >
                        {formatRelativeTime(item.createdAt)}
                    </Text>
                </View>

                {/* Customer avatar — shown on first message in a group */}
                {isCustomer && (
                    <View
                        style={[
                            styles.avatar,
                            { backgroundColor: avatarBg },
                            !showSender && styles.avatarHidden,
                        ]}
                    >
                        {showSender && (
                            <Text style={[styles.avatarText, { color: avatarTextColor }]}>
                                {avatarLetter}
                            </Text>
                        )}
                    </View>
                )}
            </View>
        );
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>

            {/* ── Header ── */}
            <View
                style={[
                    styles.header,
                    {
                        paddingTop: insets.top + Spacing.sm,
                        borderBottomColor: theme.border,
                        backgroundColor: theme.background,
                    },
                ]}
            >
                <Pressable
                    onPress={() => router.back()}
                    style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.6 : 1 }]}
                    hitSlop={8}
                >
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </Pressable>

                <View style={styles.headerCenter}>
                    <Text
                        style={[styles.headerTitle, { color: theme.text }]}
                        numberOfLines={1}
                    >
                        {ticket?.subject ?? 'Ticket support'}
                    </Text>

                    {ticket && (
                        <View
                            style={[
                                styles.statusBadge,
                                {
                                    backgroundColor:
                                        statusColor[ticket.status] + '20',
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.statusText,
                                    { color: statusColor[ticket.status] },
                                ]}
                            >
                                {statusLabel[ticket.status]}
                            </Text>
                        </View>
                    )}
                </View>

                <Pressable
                    onPress={fetchMessages}
                    style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.6 : 1 }]}
                    hitSlop={8}
                >
                    <Ionicons name="refresh-outline" size={20} color={theme.icon} />
                </Pressable>
            </View>

            {/* ── Body (messages + reply bar) ── */}
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                {/* Loading state */}
                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color={theme.primary} />
                    </View>

                ) : error ? (
                    /* Error state */
                    <View style={styles.centered}>
                        <Ionicons name="alert-circle-outline" size={44} color={theme.icon} />
                        <Text style={[styles.errorText, { color: theme.icon }]}>
                            {error}
                        </Text>
                        <Pressable
                            onPress={fetchMessages}
                            style={[styles.retryButton, { borderColor: theme.primary }]}
                        >
                            <Text style={[styles.retryText, { color: theme.primary }]}>
                                Réessayer
                            </Text>
                        </Pressable>
                    </View>

                ) : (
                    /* Messages list */
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={(item) => item.id}
                        renderItem={renderMessage}
                        contentContainerStyle={[
                            styles.messageList,
                            { paddingBottom: Spacing.sm },
                        ]}
                        onContentSizeChange={scrollToBottom}
                        ListEmptyComponent={
                            <View style={styles.emptyMessages}>
                                <Ionicons
                                    name="chatbubble-ellipses-outline"
                                    size={44}
                                    color={theme.icon}
                                />
                                <Text
                                    style={[styles.emptyText, { color: theme.icon }]}
                                >
                                    {'Votre ticket a bien été créé.\nNotre équipe vous répondra bientôt.'}
                                </Text>
                            </View>
                        }
                    />
                )}

                {/* ── Reply input or closed banner ── */}
                {!loading && !error && (
                    isClosed ? (
                        <View
                            style={[
                                styles.closedBanner,
                                {
                                    backgroundColor:
                                        colorScheme === 'dark' ? '#1e293b' : '#f1f5f9',
                                    borderTopColor: theme.border,
                                    paddingBottom: insets.bottom + Spacing.sm,
                                },
                            ]}
                        >
                            <Ionicons
                                name={ticket?.status === 'resolved' ? 'checkmark-circle' : 'lock-closed'}
                                size={16}
                                color={statusColor[ticket?.status ?? 'closed']}
                            />
                            <Text style={[styles.closedText, { color: theme.icon }]}>
                                {ticket?.status === 'resolved'
                                    ? 'Ticket résolu'
                                    : 'Ticket clôturé'}
                                {'  ·  '}
                                <Text
                                    style={{ color: theme.primary }}
                                    onPress={() => router.push('/support/new-ticket')}
                                >
                                    Créer un nouveau ticket
                                </Text>
                            </Text>
                        </View>
                    ) : (
                        <View
                            style={[
                                styles.inputContainer,
                                {
                                    borderTopColor: theme.border,
                                    backgroundColor: theme.background,
                                    paddingBottom: insets.bottom + Spacing.xs,
                                },
                            ]}
                        >
                            <TextInput
                                value={inputText}
                                onChangeText={setInputText}
                                placeholder="Votre message…"
                                placeholderTextColor={theme.icon}
                                multiline
                                maxLength={2000}
                                style={[
                                    styles.input,
                                    {
                                        color: theme.text,
                                        backgroundColor:
                                            colorScheme === 'dark' ? '#1e293b' : '#f1f5f9',
                                        borderColor: theme.border,
                                    },
                                ]}
                            />
                            <Pressable
                                onPress={handleSend}
                                disabled={!inputText.trim() || sending}
                                style={({ pressed }) => [
                                    styles.sendButton,
                                    {
                                        backgroundColor: theme.primary,
                                        opacity:
                                            !inputText.trim() || sending
                                                ? 0.45
                                                : pressed
                                                ? 0.8
                                                : 1,
                                    },
                                ]}
                            >
                                {sending ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Ionicons name="send" size={18} color="#fff" />
                                )}
                            </Pressable>
                        </View>
                    )
                )}
            </KeyboardAvoidingView>
        </View>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const AVATAR_SIZE = 32;

const styles = StyleSheet.create({
    // Layout
    container: { flex: 1 },
    flex: { flex: 1 },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        padding: Spacing.xl,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
        gap: Spacing.sm,
    },
    headerCenter: {
        flex: 1,
        gap: 4,
    },
    headerTitle: {
        ...Typography.bodySemibold,
        fontWeight: '700',
    },
    iconButton: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: Radii.sm,
    },

    // Status badge
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: Radii.full,
    },
    statusText: { ...Typography.small, fontWeight: '700' },

    // Message list
    messageList: {
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.md,
        gap: 4,
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 2,
        gap: Spacing.xs,
    },
    messageRowLeft: { justifyContent: 'flex-start' },
    messageRowRight: { justifyContent: 'flex-end' },

    // Avatar
    avatar: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    avatarHidden: { opacity: 0 },
    avatarText: { ...Typography.small, fontWeight: '700' },

    // Bubble wrapper
    bubbleWrapper: {
        maxWidth: '75%',
        gap: 3,
    },
    bubbleWrapperLeft: { alignItems: 'flex-start' },
    bubbleWrapperRight: { alignItems: 'flex-end' },

    senderName: {
        ...Typography.small,
        fontWeight: '600',
        paddingHorizontal: 2,
    },
    senderNameRight: { textAlign: 'right' },

    // Bubble
    bubble: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: Radii.xl,
    },
    bubbleUser: {
        borderBottomRightRadius: Radii.sm,
    },
    bubbleSupport: {
        borderWidth: StyleSheet.hairlineWidth,
        borderBottomLeftRadius: Radii.sm,
    },
    bubbleText: {
        ...Typography.body,
        lineHeight: 22,
    },

    // Timestamp
    timestamp: {
        ...Typography.small,
        fontSize: 11,
        paddingHorizontal: 2,
    },
    timestampRight: { textAlign: 'right' },

    // Empty state
    emptyMessages: {
        alignItems: 'center',
        paddingTop: Spacing.xxl,
        gap: Spacing.sm,
        paddingHorizontal: Spacing.xl,
    },
    emptyText: {
        ...Typography.caption,
        textAlign: 'center',
        lineHeight: 20,
    },

    // Error state
    errorText: {
        ...Typography.caption,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: Spacing.xs,
        borderWidth: 1,
        borderRadius: Radii.full,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
    },
    retryText: { ...Typography.caption, fontWeight: '700' },

    // Reply input bar
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.sm,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderRadius: Radii.xl,
        paddingHorizontal: Spacing.md,
        paddingVertical: Platform.OS === 'ios' ? Spacing.sm : Spacing.xs,
        ...Typography.body,
        maxHeight: 120,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },

    // Closed banner
    closedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.xs,
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.sm,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    closedText: {
        ...Typography.caption,
        textAlign: 'center',
        flex: 1,
    },
});
