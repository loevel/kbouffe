import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radii, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OrderConfirmationScreen() {
    const router = useRouter();
    const { orderId } = useLocalSearchParams<{ orderId: string }>();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
            <View style={styles.content}>
                <View style={[styles.iconCircle, { backgroundColor: '#10b981' + '20' }]}>
                    <Ionicons name="checkmark-circle" size={64} color="#10b981" />
                </View>

                <Text style={[styles.title, { color: theme.text }]}>Commande confirmee!</Text>
                <Text style={[styles.subtitle, { color: theme.icon }]}>
                    Votre commande a ete envoyee au restaurant. Vous recevrez une notification lorsqu'elle sera acceptee.
                </Text>

                <View style={[styles.estimateCard, { borderColor: theme.border }]}>
                    <Ionicons name="time-outline" size={24} color={theme.primary} />
                    <View>
                        <Text style={[styles.estimateLabel, { color: theme.icon }]}>Duree estimee</Text>
                        <Text style={[styles.estimateValue, { color: theme.text }]}>25 - 35 min</Text>
                    </View>
                </View>

                <Pressable
                    style={[styles.trackButton, { backgroundColor: theme.primary }]}
                    onPress={() => router.replace(orderId ? `/order/${orderId}` : '/order/o1')}
                >
                    <Ionicons name="navigate-outline" size={20} color="#fff" />
                    <Text style={styles.trackButtonText}>Suivre ma commande</Text>
                </Pressable>

                <Pressable
                    style={[styles.homeButton, { borderColor: theme.border }]}
                    onPress={() => router.replace('/(tabs)')}
                >
                    <Text style={[styles.homeButtonText, { color: theme.text }]}>Retour a l'accueil</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
    },
    title: { ...Typography.title1, textAlign: 'center', marginBottom: Spacing.sm },
    subtitle: { ...Typography.body, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.xl, maxWidth: 300 },
    estimateCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        borderWidth: 1,
        borderRadius: Radii.lg,
        padding: Spacing.md,
        width: '100%',
        marginBottom: Spacing.xl,
    },
    estimateLabel: { ...Typography.caption },
    estimateValue: { ...Typography.title3 },
    trackButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        width: '100%',
        padding: Spacing.md,
        borderRadius: Radii.full,
        marginBottom: Spacing.md,
    },
    trackButtonText: { color: '#fff', ...Typography.body, fontWeight: '700' },
    homeButton: {
        width: '100%',
        padding: Spacing.md,
        borderRadius: Radii.full,
        borderWidth: 1,
        alignItems: 'center',
    },
    homeButtonText: { ...Typography.body, fontWeight: '600' },
});
