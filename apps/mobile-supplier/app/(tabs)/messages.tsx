import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';
import { relativeTime } from '@/lib/format';
import type { MessageStatus, SupplierMessage } from '@/lib/types';

const FILTERS: { key: 'all' | MessageStatus; label: string }[] = [
    { key: 'all', label: 'Tous' },
    { key: 'unread', label: 'Non lus' },
    { key: 'replied', label: 'Répondus' },
    { key: 'archived', label: 'Archivés' },
];

export default function MessagesScreen() {
    const theme = useTheme();
    const { profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [messages, setMessages] = useState<SupplierMessage[]>([]);
    const [activeFilter, setActiveFilter] = useState<'all' | MessageStatus>('all');
    const [selected, setSelected] = useState<SupplierMessage | null>(null);
    const [replyBody, setReplyBody] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const loadMessages = useCallback(async () => {
        if (!profile?.id) return;

        const query = supabase
            .from('supplier_messages')
            .select('*, restaurants:restaurant_id (id, name, city, logo_url)')
            .eq('supplier_id', profile.id)
            .order('created_at', { ascending: false });

        if (activeFilter !== 'all') {
            query.eq('status', activeFilter);
        }

        const { data, error } = await query;

        if (error) throw error;

        setMessages((data ?? []) as SupplierMessage[]);
    }, [activeFilter, profile?.id]);

    useEffect(() => {
        loadMessages()
            .catch(() => undefined)
            .finally(() => setLoading(false));
    }, [loadMessages]);

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await loadMessages();
        } finally {
            setRefreshing(false);
        }
    };

    const updateMessage = async (message: SupplierMessage, nextStatus: MessageStatus, nextReply?: string) => {
        const updates: Record<string, unknown> = { status: nextStatus };
        if (nextReply && nextStatus === 'replied') {
            updates.reply_body = nextReply;
            updates.replied_at = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('supplier_messages')
            .update(updates)
            .eq('id', message.id)
            .eq('supplier_id', profile?.id ?? '')
            .select('*, restaurants:restaurant_id (id, name, city, logo_url)')
            .single();

        if (error) throw error;

        const nextMessage = data as SupplierMessage;
        setMessages((current) => current.map((item) => (item.id === nextMessage.id ? nextMessage : item)));
        setSelected(nextMessage);
    };

    const openMessage = async (message: SupplierMessage) => {
        setSelected(message);
        setReplyBody(message.reply_body ?? '');

        if (message.status === 'unread') {
            try {
                await updateMessage(message, 'read');
            } catch {
                // Keep modal open even if read marking fails.
            }
        }
    };

    const submitReply = async () => {
        if (!selected || !replyBody.trim()) return;

        setSubmitting(true);
        try {
            await updateMessage(selected, 'replied', replyBody.trim());
        } finally {
            setSubmitting(false);
        }
    };

    const archiveSelected = async () => {
        if (!selected) return;
        setSubmitting(true);
        try {
            await updateMessage(selected, 'archived');
        } finally {
            setSubmitting(false);
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

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
            >
                <Text style={styles.title}>Messages & devis</Text>
                <View style={styles.filters}>
                    {FILTERS.map((item) => (
                        <Pressable key={item.key} style={[styles.filterChip, activeFilter === item.key && styles.filterChipActive]} onPress={() => setActiveFilter(item.key)}>
                            <Text style={[styles.filterText, activeFilter === item.key && styles.filterTextActive]}>{item.label}</Text>
                        </Pressable>
                    ))}
                </View>

                {messages.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyTitle}>Boîte vide</Text>
                        <Text style={styles.emptyText}>Les demandes de devis des restaurants apparaîtront ici.</Text>
                    </View>
                ) : (
                    messages.map((message) => (
                        <Pressable key={message.id} style={styles.card} onPress={() => openMessage(message)}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>{message.subject ?? 'Demande de devis'}</Text>
                                <Text style={styles.cardStatus}>{message.status}</Text>
                            </View>
                            <Text style={styles.cardMeta}>{message.restaurants?.name ?? 'Restaurant'} · {relativeTime(message.created_at)}</Text>
                            <Text numberOfLines={2} style={styles.cardBody}>{message.body}</Text>
                        </Pressable>
                    ))
                )}
            </ScrollView>

            <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.modalTitle}>{selected?.subject ?? 'Demande de devis'}</Text>
                                <Text style={styles.modalMeta}>{selected?.restaurants?.name ?? 'Restaurant'} · {selected ? relativeTime(selected.created_at) : ''}</Text>
                            </View>
                            <Pressable onPress={() => setSelected(null)}>
                                <Ionicons name="close" size={22} color={theme.text} />
                            </Pressable>
                        </View>

                        <ScrollView contentContainerStyle={{ gap: 12 }}>
                            <Text style={styles.modalBody}>{selected?.body}</Text>
                            <TextInput
                                style={styles.replyInput}
                                value={replyBody}
                                onChangeText={setReplyBody}
                                multiline
                                placeholder="Répondez au restaurant…"
                                placeholderTextColor={theme.textSecondary}
                            />
                            <View style={styles.modalActions}>
                                <Pressable style={styles.secondaryButton} onPress={archiveSelected} disabled={submitting}>
                                    <Text style={styles.secondaryButtonText}>Archiver</Text>
                                </Pressable>
                                <Pressable style={styles.primaryButton} onPress={submitReply} disabled={submitting || !replyBody.trim()}>
                                    {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Répondre</Text>}
                                </Pressable>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
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
            gap: 14,
        },
        title: {
            fontSize: 24,
            fontWeight: '800',
            color: theme.text,
        },
        filters: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
        },
        filterChip: {
            paddingHorizontal: 12,
            paddingVertical: 9,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.card,
        },
        filterChipActive: {
            backgroundColor: theme.primary,
            borderColor: theme.primary,
        },
        filterText: {
            color: theme.text,
            fontWeight: '700',
            fontSize: 13,
        },
        filterTextActive: {
            color: '#fff',
        },
        emptyCard: {
            borderRadius: 20,
            backgroundColor: theme.card,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 20,
            gap: 6,
        },
        emptyTitle: {
            fontSize: 18,
            fontWeight: '700',
            color: theme.text,
        },
        emptyText: {
            color: theme.textSecondary,
            lineHeight: 20,
        },
        card: {
            borderRadius: 18,
            backgroundColor: theme.card,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 16,
            gap: 8,
        },
        cardHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: 12,
        },
        cardTitle: {
            flex: 1,
            color: theme.text,
            fontWeight: '800',
            fontSize: 15,
        },
        cardStatus: {
            color: theme.primary,
            fontWeight: '700',
            textTransform: 'capitalize',
        },
        cardMeta: {
            color: theme.textSecondary,
            fontSize: 12,
        },
        cardBody: {
            color: theme.text,
            lineHeight: 20,
        },
        modalBackdrop: {
            flex: 1,
            backgroundColor: 'rgba(2, 6, 23, 0.6)',
            justifyContent: 'flex-end',
        },
        modalCard: {
            maxHeight: '85%',
            backgroundColor: theme.card,
            borderTopLeftRadius: 26,
            borderTopRightRadius: 26,
            padding: 18,
            gap: 14,
        },
        modalHeader: {
            flexDirection: 'row',
            gap: 12,
            alignItems: 'flex-start',
        },
        modalTitle: {
            color: theme.text,
            fontSize: 18,
            fontWeight: '800',
        },
        modalMeta: {
            color: theme.textSecondary,
            marginTop: 4,
        },
        modalBody: {
            color: theme.text,
            lineHeight: 22,
        },
        replyInput: {
            minHeight: 130,
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 16,
            backgroundColor: theme.background,
            color: theme.text,
            padding: 14,
            textAlignVertical: 'top',
        },
        modalActions: {
            flexDirection: 'row',
            gap: 10,
        },
        secondaryButton: {
            flex: 1,
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: 'center',
            backgroundColor: theme.background,
        },
        secondaryButtonText: {
            color: theme.text,
            fontWeight: '700',
        },
        primaryButton: {
            flex: 1,
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: 'center',
            backgroundColor: theme.primary,
        },
        primaryButtonText: {
            color: '#fff',
            fontWeight: '700',
        },
    });
}
