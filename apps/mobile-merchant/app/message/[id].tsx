import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch, getErrorMessage } from '@/lib/api';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

interface Message {
    id: string;
    conversationId: string;
    content: string;
    senderId: string;
    isRead: boolean;
    createdAt: string;
    isMe: boolean;
}

interface Conversation {
    id: string;
    orderId?: string;
    customerName: string;
    metadata?: any;
}

function formatMessageTime(timestamp: string) {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (isYesterday) {
        return 'Hier';
    } else {
        return date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
    }
}

export default function MessageScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { session, profile } = useAuth();
    const router = useRouter();
    const theme = useTheme();
    const flatListRef = useRef<FlatList>(null);

    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [inputValue, setInputValue] = useState('');

    const loadConversation = useCallback(async () => {
        if (!session || !id) {
            setLoading(false);
            return;
        }

        try {
            // Fetch conversation
            const { data: convData, error: convError } = await supabase
                .from('conversations')
                .select('*')
                .eq('id', id)
                .single();

            if (convError) throw convError;
            if (!convData) {
                setLoading(false);
                return;
            }

            setConversation({
                id: convData.id,
                orderId: convData.order_id,
                customerName: convData.metadata?.customer_name || 'Client',
                metadata: convData.metadata,
            });

            // Fetch messages
            const { data: msgData, error: msgError } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', id)
                .order('created_at', { ascending: true });

            if (msgError) throw msgError;

            const processedMessages: Message[] = (msgData || []).map((msg: any) => ({
                id: msg.id,
                conversationId: msg.conversation_id,
                content: msg.content,
                senderId: msg.sender_id,
                isRead: msg.is_read,
                createdAt: msg.created_at,
                isMe: msg.sender_id === session.user.id,
            }));

            setMessages(processedMessages);

            // Mark unread messages as read
            const unreadIds = processedMessages
                .filter((m) => !m.isRead && !m.isMe)
                .map((m) => m.id);

            if (unreadIds.length > 0) {
                await supabase
                    .from('messages')
                    .update({ is_read: true })
                    .in('id', unreadIds);
            }

            // Scroll to bottom
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: false });
            }, 100);
        } catch (error) {
            console.error('Erreur lors du chargement de la conversation:', error);
        } finally {
            setLoading(false);
        }
    }, [session, id]);

    useEffect(() => {
        loadConversation();
    }, [loadConversation]);

    // Setup Realtime subscription
    useEffect(() => {
        if (!id) return;

        const channel = supabase
            .channel(`messages:${id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${id}`,
                },
                (payload) => {
                    const newMsg = payload.new as any;
                    const message: Message = {
                        id: newMsg.id,
                        conversationId: newMsg.conversation_id,
                        content: newMsg.content,
                        senderId: newMsg.sender_id,
                        isRead: newMsg.is_read,
                        createdAt: newMsg.created_at,
                        isMe: newMsg.sender_id === session?.user.id,
                    };

                    setMessages((prev) => [...prev, message]);
                    setTimeout(() => {
                        flatListRef.current?.scrollToEnd({ animated: true });
                    }, 100);

                    // Mark as read if from customer
                    if (newMsg.sender_id !== session?.user.id && !newMsg.is_read) {
                        supabase
                            .from('messages')
                            .update({ is_read: true })
                            .eq('id', newMsg.id)
                            .catch(() => {});
                    }
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [id, session?.user.id]);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || !session || !id) return;

        const content = inputValue.trim();
        setInputValue('');
        setSending(true);

        try {
            const { data: message, error } = await supabase
                .from('messages')
                .insert({
                    conversation_id: id,
                    sender_id: session.user.id,
                    content,
                    is_read: true,
                })
                .select('*')
                .single();

            if (error) throw error;

            // Update conversation timestamp
            await supabase
                .from('conversations')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', id);

            const newMsg: Message = {
                id: message.id,
                conversationId: message.conversation_id,
                content: message.content,
                senderId: message.sender_id,
                isRead: message.is_read,
                createdAt: message.created_at,
                isMe: true,
            };

            setMessages((prev) => [...prev, newMsg]);
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        } catch (error) {
            console.error('Erreur lors de l\'envoi du message:', error);
            setInputValue(content); // Restore input on error
        } finally {
            setSending(false);
        }
    };

    const s = styles(theme);

    if (loading) {
        return (
            <SafeAreaView style={s.container} edges={['top']}>
                <ActivityIndicator style={{ marginTop: 40 }} size="large" color={theme.primary} />
            </SafeAreaView>
        );
    }

    if (!conversation) {
        return (
            <SafeAreaView style={s.container} edges={['top']}>
                <View style={s.header}>
                    <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
                        <Ionicons name="arrow-back" size={22} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={s.title}>Conversation</Text>
                    <View style={s.backButton} />
                </View>
                <View style={s.center}>
                    <Text style={s.errorText}>Conversation introuvable</Text>
                </View>
            </SafeAreaView>
        );
    }

    const renderMessage = ({ item }: { item: Message }) => (
        <View style={[s.messageRow, item.isMe && s.messageRowMe]}>
            <View
                style={[
                    s.messageBubble,
                    item.isMe
                        ? { backgroundColor: theme.primary }
                        : { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
                ]}
            >
                <Text
                    style={[
                        s.messageText,
                        item.isMe ? { color: '#fff' } : { color: theme.text },
                    ]}
                >
                    {item.content}
                </Text>
                <Text
                    style={[
                        s.messageTime,
                        item.isMe ? { color: 'rgba(255,255,255,0.7)' } : { color: theme.textSecondary },
                    ]}
                >
                    {formatMessageTime(item.createdAt)}
                </Text>
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={s.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <SafeAreaView style={s.container} edges={['top']}>
                <View style={s.header}>
                    <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
                        <Ionicons name="arrow-back" size={22} color={theme.text} />
                    </TouchableOpacity>
                    <View style={s.headerContent}>
                        <Text style={s.title}>{conversation.customerName}</Text>
                        {conversation.orderId && (
                            <Text style={s.subtitle}>Commande #{conversation.orderId.slice(-6).toUpperCase()}</Text>
                        )}
                    </View>
                    <View style={s.backButton} />
                </View>

                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={s.messageList}
                    scrollIndicatorInsets={{ right: 1 }}
                    ListEmptyComponent={
                        <View style={s.emptyChat}>
                            <Text style={s.emptyIcon}>💬</Text>
                            <Text style={s.emptyText}>Aucun message pour le moment</Text>
                        </View>
                    }
                />

                <View style={[s.inputArea, { borderTopColor: theme.border }]}>
                    <TextInput
                        style={[
                            s.input,
                            {
                                borderColor: theme.border,
                                color: theme.text,
                                backgroundColor: theme.surface,
                            },
                        ]}
                        placeholder="Votre message..."
                        placeholderTextColor={theme.textSecondary}
                        value={inputValue}
                        onChangeText={setInputValue}
                        multiline
                        maxLength={500}
                        editable={!sending}
                    />
                    <TouchableOpacity
                        style={[
                            s.sendButton,
                            {
                                backgroundColor: theme.primary,
                                opacity: !inputValue.trim() || sending ? 0.6 : 1,
                            },
                        ]}
                        onPress={handleSendMessage}
                        disabled={!inputValue.trim() || sending}
                    >
                        {sending ? (
                            <ActivityIndicator size={18} color="#fff" />
                        ) : (
                            <Ionicons name="send" size={18} color="#fff" />
                        )}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
}

const styles = (theme: ReturnType<typeof useTheme>) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: theme.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        headerContent: { flex: 1, alignItems: 'center' },
        backButton: {
            width: 36,
            height: 36,
            alignItems: 'center',
            justifyContent: 'center',
        },
        title: { fontSize: 17, fontWeight: '700', color: theme.text },
        subtitle: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },
        center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
        errorText: { fontSize: 15, color: theme.textSecondary, textAlign: 'center' },
        messageList: {
            padding: 12,
            gap: 8,
            paddingBottom: 12,
        },
        messageRow: {
            flexDirection: 'row',
            justifyContent: 'flex-start',
            paddingHorizontal: 4,
        },
        messageRowMe: {
            justifyContent: 'flex-end',
        },
        messageBubble: {
            maxWidth: '80%',
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 14,
            gap: 4,
        },
        messageText: {
            fontSize: 14,
            lineHeight: 20,
        },
        messageTime: {
            fontSize: 11,
        },
        emptyChat: { alignItems: 'center', marginTop: 60, paddingHorizontal: 20 },
        emptyIcon: { fontSize: 46, marginBottom: 10 },
        emptyText: { fontSize: 14, color: theme.textSecondary, textAlign: 'center' },
        inputArea: {
            flexDirection: 'row',
            gap: 8,
            padding: 12,
            borderTopWidth: 1,
            alignItems: 'flex-end',
        },
        input: {
            flex: 1,
            borderWidth: 1,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
            fontSize: 14,
            maxHeight: 100,
        },
        sendButton: {
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
        },
    });
