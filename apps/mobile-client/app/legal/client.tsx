import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ClientLegalScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const router = useRouter();

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header with back button */}
            <View style={[styles.header, { borderBottomColor: theme.border, paddingTop: insets.top }]}>
                <Pressable
                    style={({ pressed }) => [
                        styles.backButton,
                        { backgroundColor: pressed ? theme.border : 'transparent' },
                    ]}
                    onPress={() => router.back()}
                >
                    <Ionicons name="chevron-back" size={24} color={theme.text} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Informations légales</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scrollContent}
                contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
            >
                {/* Removed title from here since it's now in header */}

                <View style={[styles.card, { borderColor: theme.border }]}>
                    <Text style={[styles.heading, { color: theme.text }]}>Conditions d’utilisation</Text>
                    <Text style={[styles.body, { color: theme.icon }]}>Le client valide le panier, le mode de paiement et l’adresse avant confirmation. Toute commande confirmée devient traçable via l’historique et le support.</Text>
                </View>

                <View style={[styles.card, { borderColor: theme.border }]}>
                    <Text style={[styles.heading, { color: theme.text }]}>Politique de confidentialité</Text>
                    <Text style={[styles.body, { color: theme.icon }]}>Les données client utilisées pour la livraison et le support sont limitées au strict nécessaire : identité, téléphone, adresse et historique de commande.</Text>
                </View>

                <View style={[styles.card, { borderColor: theme.border }]}>
                    <Text style={[styles.heading, { color: theme.text }]}>Remboursements & litiges</Text>
                    <Text style={[styles.body, { color: theme.icon }]}>Kbouffe est une plateforme technique. Les transactions et remboursements sont sous la responsabilité directe du restaurant. Pour toute demande, contactez le restaurant via le bouton dédié sur votre commande.</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
    },
    headerTitle: { ...Typography.title3, flex: 1, textAlign: 'center', marginHorizontal: Spacing.md },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: { flex: 1 },
    card: {
        borderWidth: 1,
        borderRadius: Radii.lg,
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.md,
        marginTop: Spacing.md,
        padding: Spacing.md,
        gap: Spacing.xs,
    },
    heading: { ...Typography.body, fontWeight: '700' },
    body: { ...Typography.caption, lineHeight: 20 },
});
