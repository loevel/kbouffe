import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSupport, type SupportTicketType } from '@/contexts/support-context';

export default function NewSupportTicketScreen() {
    const router = useRouter();
    const { orderId } = useLocalSearchParams<{ orderId?: string }>();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const isDark = colorScheme === 'dark';
    const { createTicket } = useSupport();

    const [type, setType] = useState<SupportTicketType>(orderId ? 'incident' : 'question');
    const [title, setTitle] = useState(orderId ? `Commande #${orderId.slice(-4)} - Incident` : '');
    const [message, setMessage] = useState('');

    const handleCreate = async () => {
        if (!title.trim() || !message.trim()) {
            Alert.alert('Informations manquantes', 'Ajoutez un titre et une description.');
            return;
        }

        try {
            await createTicket({
                type,
                subject: title.trim(),
                description: message.trim(),
                orderId,
            });
            Alert.alert('Ticket créé', 'Votre demande est maintenant traçable.', [
                { text: 'Voir mes tickets', onPress: () => router.replace('/support/tickets') },
            ]);
        } catch (error) {
            Alert.alert('Erreur', error instanceof Error ? error.message : 'Impossible de créer le ticket.');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { paddingTop: Math.max(insets.top, Spacing.md) }]}>
                <Pressable
                    onPress={() => router.back()}
                    hitSlop={8}
                    style={[styles.backBtn, { backgroundColor: isDark ? '#ffffff08' : '#e2e8f0' }]}
                >
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Nouveau ticket</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingTop: Spacing.md, paddingBottom: insets.bottom + Spacing.xl }}
                keyboardShouldPersistTaps="handled"
            >
            {orderId && (
                <Text style={[styles.orderHint, { color: theme.icon }]}>Lié à la commande #{orderId.slice(-4)}</Text>
            )}

            <View style={styles.typeRow}>
                {([
                    { id: 'question', label: 'Question' },
                    { id: 'incident', label: 'Incident' },
                    { id: 'refund', label: 'Remboursement' },
                ] as Array<{ id: SupportTicketType; label: string }>).map((option) => (
                    <Pressable
                        key={option.id}
                        style={[
                            styles.typeChip,
                            { borderColor: type === option.id ? theme.primary : theme.border },
                            type === option.id && { backgroundColor: theme.primary + '15' },
                        ]}
                        onPress={() => setType(option.id)}
                    >
                        <Text style={[styles.typeChipText, { color: type === option.id ? theme.primary : theme.icon }]}>{option.label}</Text>
                    </Pressable>
                ))}
            </View>

            <View style={[styles.card, { borderColor: theme.border }]}> 
                <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Objet de la demande"
                    placeholderTextColor={theme.icon}
                    style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                />
                <TextInput
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Décrivez votre demande (contexte, impact, détails utiles)"
                    placeholderTextColor={theme.icon}
                    multiline
                    numberOfLines={5}
                    style={[styles.input, styles.textArea, { borderColor: theme.border, color: theme.text }]}
                />
                <Pressable style={[styles.submit, { backgroundColor: theme.primary }]} onPress={handleCreate}>
                    <Ionicons name="send-outline" size={16} color="#fff" />
                    <Text style={styles.submitText}>Créer le ticket</Text>
                </Pressable>
            </View>
        </ScrollView>
    </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1 },
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
    headerTitle: {
        ...Typography.title3,
    },
    orderHint: { ...Typography.caption, paddingHorizontal: Spacing.md, marginTop: 2, marginBottom: Spacing.md },
    typeRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
    typeChip: { borderWidth: 1, borderRadius: Radii.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
    typeChipText: { ...Typography.caption, fontWeight: '600' },
    card: {
        borderWidth: 1,
        borderRadius: Radii.lg,
        marginHorizontal: Spacing.md,
        padding: Spacing.md,
        gap: Spacing.sm,
    },
    input: {
        borderWidth: 1,
        borderRadius: Radii.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        ...Typography.body,
    },
    textArea: { minHeight: 120, textAlignVertical: 'top' },
    submit: {
        borderRadius: Radii.full,
        paddingVertical: Spacing.sm,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: Spacing.xs,
    },
    submitText: { color: '#fff', ...Typography.body, fontWeight: '700' },
});
