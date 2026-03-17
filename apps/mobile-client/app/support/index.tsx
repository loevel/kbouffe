import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSupport } from '@/contexts/support-context';

export default function SupportCenterScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const { faq, tickets } = useSupport();

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.background }]}
            contentContainerStyle={{ paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + Spacing.xl }}
        >
            <Text style={[styles.title, { color: theme.text }]}>Centre d'aide</Text>
            <Text style={[styles.subtitle, { color: theme.icon }]}>Contactez directement vos commerçants</Text>

            <View style={[styles.infoCard, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '30' }]}>
                <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
                <Text style={[styles.infoText, { color: theme.text }]}>
                    Kbouffe est une plateforme technique. Pour toute question sur votre repas ou sa livraison, contactez directement le restaurant concerné.
                </Text>
            </View>

            <View style={[styles.card, { borderColor: theme.border }]}> 
                <Text style={[styles.cardTitle, { color: theme.text }]}>Actions rapides</Text>
                <Pressable style={styles.actionRow} onPress={() => router.push('/support/new-ticket')}>
                    <Ionicons name="create-outline" size={18} color={theme.primary} />
                    <Text style={[styles.actionText, { color: theme.text }]}>Créer un ticket support</Text>
                </Pressable>
                <Pressable style={styles.actionRow} onPress={() => router.push('/support/tickets')}>
                    <Ionicons name="list-outline" size={18} color={theme.primary} />
                    <Text style={[styles.actionText, { color: theme.text }]}>Suivre mes tickets ({tickets.length})</Text>
                </Pressable>
                <Pressable style={styles.actionRow} onPress={() => router.push('/legal/client')}>
                    <Ionicons name="document-text-outline" size={18} color={theme.primary} />
                    <Text style={[styles.actionText, { color: theme.text }]}>Pages légales client</Text>
                </Pressable>
            </View>

            <View style={[styles.card, { borderColor: theme.border }]}> 
                <Text style={[styles.cardTitle, { color: theme.text }]}>FAQ ciblée</Text>
                {faq.map((item) => (
                    <View key={item.id} style={styles.faqItem}>
                        <Text style={[styles.question, { color: theme.text }]}>{item.question}</Text>
                        <Text style={[styles.answer, { color: theme.icon }]}>{item.answer}</Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    title: { ...Typography.title2, paddingHorizontal: Spacing.md },
    subtitle: { ...Typography.caption, paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
    card: {
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderRadius: Radii.lg,
        padding: Spacing.md,
        gap: Spacing.sm,
    },
    cardTitle: { ...Typography.body, fontWeight: '700' },
    infoCard: {
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.md,
        padding: Spacing.md,
        borderRadius: Radii.lg,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
    },
    infoText: { ...Typography.caption, flex: 1, lineHeight: 18 },
    actionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 2 },
    actionText: { ...Typography.body },
    faqItem: { gap: 2, paddingVertical: Spacing.xs },
    question: { ...Typography.caption, fontWeight: '700' },
    answer: { ...Typography.caption },
});
