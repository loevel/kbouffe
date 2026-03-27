import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ClientLegalScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.background }]}
            contentContainerStyle={{ paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + Spacing.xl }}
        >
            <Text style={[styles.title, { color: theme.text }]}>Informations légales client</Text>

            <View style={[styles.card, { borderColor: theme.border }]}>
                <Text style={[styles.heading, { color: theme.text }]}>Conditions d'utilisation</Text>
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
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    title: { ...Typography.title2, paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
    card: {
        borderWidth: 1,
        borderRadius: Radii.lg,
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.md,
        padding: Spacing.md,
        gap: Spacing.xs,
    },
    heading: { ...Typography.body, fontWeight: '700' },
    body: { ...Typography.caption, lineHeight: 20 },
});
