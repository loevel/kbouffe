import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radii, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLoyalty } from '@/contexts/loyalty-context';

export default function LoyaltyScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const {
        favoriteRestaurantIds,
        favoriteProductIds,
        referralCode,
        referralInvites,
        referralRewards,
        registerReferralReward,
    } = useLoyalty();

    const promos: any[] = []; // Temporary fix or remove promos section if unused

    const handleShareReferral = async () => {
        const link = `https://kbouffe.com/r/${referralCode}`;
        await Linking.openURL(link);
    };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.background }]}
            contentContainerStyle={{ paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + Spacing.xl }}
        >
            <Text style={[styles.pageTitle, { color: theme.text }]}>Fidélisation</Text>

            <View style={[styles.card, { borderColor: theme.border }]}> 
                <Text style={[styles.cardTitle, { color: theme.text }]}>Favoris</Text>
                <View style={styles.statRow}>
                    <Text style={[styles.statLabel, { color: theme.icon }]}>Restaurants</Text>
                    <Text style={[styles.statValue, { color: theme.text }]}>{favoriteRestaurantIds.length}</Text>
                </View>
                <View style={styles.statRow}>
                    <Text style={[styles.statLabel, { color: theme.icon }]}>Plats</Text>
                    <Text style={[styles.statValue, { color: theme.text }]}>{favoriteProductIds.length}</Text>
                </View>
            </View>

            <View style={[styles.card, { borderColor: theme.border }]}> 
                <Text style={[styles.cardTitle, { color: theme.text }]}>Promotions actives</Text>
                {promos.map((promo) => (
                    <View key={promo.code} style={styles.promoRow}>
                        <View>
                            <Text style={[styles.promoCode, { color: theme.primary }]}>{promo.code}</Text>
                            <Text style={[styles.promoDesc, { color: theme.icon }]}>{promo.description}</Text>
                        </View>
                        <Text style={[styles.promoExpiry, { color: theme.icon }]}>Expire le {new Date(promo.expiresAt).toLocaleDateString('fr-FR')}</Text>
                    </View>
                ))}
            </View>


            <View style={[styles.card, { borderColor: theme.border }]}> 
                <Text style={[styles.cardTitle, { color: theme.text }]}>Parrainage</Text>
                <Text style={[styles.statLabel, { color: theme.icon }]}>Code: {referralCode}</Text>
                <View style={styles.statRow}>
                    <Text style={[styles.statLabel, { color: theme.icon }]}>Invitations</Text>
                    <Text style={[styles.statValue, { color: theme.text }]}>{referralInvites}</Text>
                </View>
                <View style={styles.statRow}>
                    <Text style={[styles.statLabel, { color: theme.icon }]}>Récompenses</Text>
                    <Text style={[styles.statValue, { color: theme.primary }]}>{referralRewards.toLocaleString()} FCFA</Text>
                </View>
                <View style={styles.rowButtons}>
                    <Pressable style={[styles.outlineButton, { borderColor: theme.border }]} onPress={handleShareReferral}>
                        <Text style={[styles.outlineButtonText, { color: theme.text }]}>Partager le lien</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.button, { backgroundColor: theme.primary, flex: 1 }]}
                        onPress={() => registerReferralReward(1000)}
                    >
                        <Text style={styles.buttonText}>Simuler récompense</Text>
                    </Pressable>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    pageTitle: { ...Typography.title2, paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
    card: {
        borderWidth: 1,
        borderRadius: Radii.lg,
        padding: Spacing.md,
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.md,
        gap: Spacing.xs,
    },
    cardTitle: { ...Typography.body, fontWeight: '700', marginBottom: Spacing.xs },
    statRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    statLabel: { ...Typography.caption },
    statValue: { ...Typography.body, fontWeight: '600' },
    promoRow: { gap: 2, marginBottom: Spacing.sm },
    promoCode: { ...Typography.body, fontWeight: '700' },
    promoDesc: { ...Typography.caption },
    promoExpiry: { ...Typography.small },
    walletBalance: { ...Typography.title2, fontWeight: '700' },
    walletLabel: { ...Typography.caption, marginBottom: Spacing.sm },
    button: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: Radii.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: { color: '#fff', ...Typography.caption, fontWeight: '700' },
    benefitRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    rowButtons: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm },
    outlineButton: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: Radii.full,
        borderWidth: 1,
    },
    outlineButtonText: { ...Typography.caption, fontWeight: '600' },
});
