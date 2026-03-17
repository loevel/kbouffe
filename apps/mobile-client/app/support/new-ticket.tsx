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
    const { createTicket } = useSupport();

    const [type, setType] = useState<SupportTicketType>(orderId ? 'incident' : 'question');
    const [title, setTitle] = useState(orderId ? `Commande #${orderId.slice(-4)} - Incident` : '');
    const [message, setMessage] = useState('');

    const handleCreate = () => {
        if (!title.trim() || !message.trim()) {
            Alert.alert('Informations manquantes', 'Ajoutez un titre et une description.');
            return;
        }

        createTicket({
            type,
            title: title.trim(),
            message: message.trim(),
            orderId,
        });
        Alert.alert('Ticket créé', 'Votre demande est maintenant traçable.', [
            { text: 'Voir mes tickets', onPress: () => router.replace('/support/tickets') },
        ]);
    };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.background }]}
            contentContainerStyle={{ paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + Spacing.xl }}
        >
            <Text style={[styles.title, { color: theme.text }]}>Nouveau ticket</Text>
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
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    title: { ...Typography.title2, paddingHorizontal: Spacing.md },
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
