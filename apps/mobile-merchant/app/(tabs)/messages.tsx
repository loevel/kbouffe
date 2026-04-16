import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

interface Conversation {
    id: string;
    orderId?: string;
    type: 'order_support' | string;
    customerName: string;
    subject?: string;
    lastMessage?: {
        content: string;
        senderId: string;
        createdAt: string;
    };
    unreadCount: number;
    updatedAt: string;
}

function formatRelativeDate(timestamp: string) {
    const deltaMs = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.max(0, Math.floor(deltaMs / 60_000));
    if (minutes < 1) return 'À l'instant';
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}j`;
    const weeks = Math.floor(days / 7);
    return `${weeks}sem`;
}

export default function MessagesScreen() {
    const { session, profile } = useAuth();
    const theme = useTheme();
    const router = useRouter();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadConversations = useCallback(async () => {
        if (!session || !profile?.restaurantId) {
            setLoading(false);
            return;
        }

        try {
            // Fetch conversations with last message
            const { data: convData, error: convError } = await supabase
                .from('conversations')
                .select('*')
                .eq('restaurant_id', profile.restaurantId)
                .order('updated_at', { ascending: false });

            if (convError) throw convError;

            if (!convData || convData.length === 0) {
                setConversations([]);
                setLoading(false);
                return;
            }

            const convIds = convData.map((c: any) => c.id);

            // Fetch all messages for these conversations
            const { data: allMessages, error: msgError } = await supabase
                .from('messages')
                .select('*')
                .in('conversation_id', convIds)
                .order('created_at', { ascending: false });

            if (msgError) throw msgError;

            // Build conversations with last message and unread count
            const lastMessages = new Map<string, any>();
            const unreadCounts = new Map<string, number>();

            for (const msg of allMessages || []) {
                if (!lastMessages.has(msg.conversation_id)) {
                    lastMessages.set(msg.conversation_id, msg);
                }
                if (!msg.is_read && msg.sender_id !== session.user.id) {
                    unreadCounts.set(
                        msg.conversation_id,
                        (unreadCounts.get(msg.conversation_id) || 0) + 1
                    );
                }
            }

            const result: Conversation[] = convData.map((conv: any) => {
                const lastMsg = lastMessages.get(conv.id);
                const metadata = conv.metadata || {};

                return {
                    id: conv.id,
                    orderId: conv.order_id,
                    type: metadata.type || 'order_support',
                    customerName: metadata.customer_name || 'Client',
                    subject: metadata.subject,
                    lastMessage: lastMsg
                        ? {
                              content: lastMsg.content,
                              senderId: lastMsg.sender_id,
                              createdAt: lastMsg.created_at,
                          }
                        : undefined,
                    unreadCount: unreadCounts.get(conv.id) || 0,
                    updatedAt: conv.updated_at,
                };
            });

            setConversations(result);
        } catch (error) {
            console.error('Erreur lors du chargement des conversations:', error);
        } finally {
            setLoading(false);
        }
    }, [session, profile?.restaurantId]);

    useEffect(() => {
        loadConversations();
        const interval = setInterval(loadConversations, 30_000);
        return () => clearInterval(interval);
    }, [loadConversations]);

    // Setup Realtime subscription for new messages
    useEffect(() => {
        if (!profile?.restaurantId) return;

        const channel = supabase
            .channel(`messages:${profile.restaurantId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'messages',
                },
                () => {
                    loadConversations();
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [profile?.restaurantId, loadConversations]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadConversations();
        setRefreshing(false);
    };

    const s = styles(theme);

    if (loading) {
        return (
            <SafeAreaView style={s.container} edges={['top']}>
                <ActivityIndicator style={{ marginTop: 40 }} size="large" color={theme.primary} />
            </SafeAreaView>
        );
    }

    const renderConversation = ({ item }: { item: Conversation }) => {
        const preview = item.lastMessage?.content || 'Aucun message';
        const isUnread = item.unreadCount > 0;

        return (
            <TouchableOpacity
                style={s.conversationCard}
                onPress={() => router.push(`/message/${item.id}`)}
            >
                <View style={[s.avatar, { backgroundColor: `${theme.primary}20` }]}>
                    <Ionicons name="person-outline" size={18} color={theme.primary} />
                </View>

                <View style={s.content}>
                    <View style={s.nameRow}>
                        <Text style={[s.customerName, isUnread && s.bold]}>
                            {item.customerName}
                        </Text>
                        {isUnread && (
                            <View style={[s.badge, { backgroundColor: theme.primary }]}>
                                <Text style={s.badgeText}>
                                    {item.unreadCount > 99 ? '99+' : item.unreadCount}
                                </Text>
                            </View>
                        )}
                    </View>

                    <Text style={[s.preview, isUnread && s.bold]} numberOfLines={1}>
                        {preview}
                    </Text>

                    <Text style={s.time}>{formatRelativeDate(item.updatedAt)}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={s.container} edges={['top']}>
            <View style={s.header}>
                <Text style={s.title}>Messages</Text>
            </View>

            <FlatList
                data={conversations}
                keyExtractor={(item) => item.id}
                renderItem={renderConversation}
                contentContainerStyle={s.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
                ListEmptyComponent={
                    <View style={s.empty}>
                        <Text style={s.emptyIcon}>💬</Text>
                        <Text style={s.emptyText}>Aucune conversation pour le moment</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = (theme: ReturnType<typeof useTheme>) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },
        header: {
            padding: 16,
            backgroundColor: theme.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        title: { fontSize: 22, fontWeight: '700', color: theme.text },
        list: { padding: 8, gap: 6, paddingBottom: 24 },
        conversationCard: {
            flexDirection: 'row',
            gap: 12,
            padding: 12,
            borderRadius: 12,
            backgroundColor: theme.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        avatar: {
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
        },
        content: { flex: 1, gap: 4 },
        nameRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
        },
        customerName: {
            fontSize: 14,
            fontWeight: '600',
            color: theme.text,
            flex: 1,
        },
        bold: { fontWeight: '700' },
        preview: {
            fontSize: 12,
            color: theme.textSecondary,
        },
        time: {
            fontSize: 11,
            color: theme.textSecondary,
        },
        badge: {
            borderRadius: 8,
            minWidth: 20,
            height: 20,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 6,
        },
        badgeText: {
            color: '#fff',
            fontSize: 10,
            fontWeight: '700',
        },
        empty: { alignItems: 'center', marginTop: 70, paddingHorizontal: 20 },
        emptyIcon: { fontSize: 46, marginBottom: 10 },
        emptyText: { fontSize: 14, color: theme.textSecondary, textAlign: 'center' },
    });
