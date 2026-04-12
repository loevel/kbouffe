import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';

const STATUS_COPY = {
    pending: {
        title: 'Dossier en cours de vérification',
        message: 'Votre onboarding est bien reçu. Notre équipe valide actuellement vos informations et vos pièces KYC.',
        icon: 'time-outline',
    },
    rejected: {
        title: 'Dossier à corriger',
        message: 'Votre dossier nécessite des ajustements avant validation. Ouvrez votre profil pour consulter les détails.',
        icon: 'alert-circle-outline',
    },
    suspended: {
        title: 'Compte suspendu',
        message: 'Votre accès fournisseur est suspendu. Contactez le support KBouffe pour plus d’informations.',
        icon: 'pause-circle-outline',
    },
    approved: {
        title: 'Compte approuvé',
        message: 'Votre compte est actif.',
        icon: 'checkmark-circle-outline',
    },
} as const;

const STATUS_LABELS = {
    pending: 'En attente',
    rejected: 'Rejeté',
    suspended: 'Suspendu',
    approved: 'Approuvé',
} as const;

export default function AwaitingApprovalScreen() {
    const router = useRouter();
    const theme = useTheme();
    const { profile, signOut } = useAuth();

    useEffect(() => {
        if (profile?.kyc_status === 'approved') {
            router.replace('/(tabs)');
        }
    }, [profile?.kyc_status, router]);

    const status = profile?.kyc_status ?? 'pending';
    const copy = STATUS_COPY[status];
    const styles = createStyles(theme);

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.hero}>
                    <View style={styles.iconWrap}>
                        <Ionicons name={copy.icon} size={42} color={theme.primary} />
                    </View>
                    <Text style={styles.title}>{copy.title}</Text>
                    <Text style={styles.message}>{copy.message}</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Résumé du dossier</Text>
                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>Nom commercial</Text>
                        <Text style={styles.rowValue}>{profile?.name ?? 'En attente'}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>Type</Text>
                        <Text style={styles.rowValue}>{profile?.type ?? 'Non défini'}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>Région</Text>
                        <Text style={styles.rowValue}>{profile?.region ?? 'Non définie'}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.rowLabel}>Statut KYC</Text>
                        <Text style={[styles.badge, status === 'rejected' && styles.badgeRejected]}>
                            {STATUS_LABELS[status]}
                        </Text>
                    </View>

                    {profile?.kyc_rejection_reason ? (
                        <View style={styles.reasonBox}>
                            <Text style={styles.reasonLabel}>Motif communiqué</Text>
                            <Text style={styles.reasonText}>{profile.kyc_rejection_reason}</Text>
                        </View>
                    ) : null}
                </View>

                <Pressable style={styles.primaryButton} onPress={() => router.replace('/(tabs)/profile')}>
                    <Text style={styles.primaryButtonText}>Voir mon profil fournisseur</Text>
                </Pressable>

                <Pressable style={styles.secondaryButton} onPress={() => signOut()}>
                    <Text style={styles.secondaryButtonText}>Se déconnecter</Text>
                </Pressable>
            </ScrollView>
        </View>
    );
}

function createStyles(theme: ReturnType<typeof useTheme>) {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
        },
        content: {
            padding: 16,
            justifyContent: 'center',
            gap: 16,
            flexGrow: 1,
        },
        hero: {
            backgroundColor: theme.card,
            borderRadius: 24,
            padding: 24,
            borderWidth: 1,
            borderColor: theme.border,
            alignItems: 'center',
            gap: 10,
        },
        iconWrap: {
            width: 84,
            height: 84,
            borderRadius: 42,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.primaryLight,
        },
        title: {
            fontSize: 24,
            fontWeight: '800',
            color: theme.text,
            textAlign: 'center',
        },
        message: {
            fontSize: 14,
            lineHeight: 21,
            color: theme.textSecondary,
            textAlign: 'center',
        },
        card: {
            backgroundColor: theme.card,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 18,
            gap: 12,
        },
        cardTitle: {
            fontSize: 18,
            fontWeight: '700',
            color: theme.text,
        },
        row: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: 12,
        },
        rowLabel: {
            color: theme.textSecondary,
            fontSize: 14,
        },
        rowValue: {
            color: theme.text,
            fontSize: 14,
            fontWeight: '700',
            flexShrink: 1,
            textAlign: 'right',
        },
        badge: {
            color: theme.primary,
            fontWeight: '700',
            textTransform: 'capitalize',
        },
        badgeRejected: {
            color: theme.error,
        },
        reasonBox: {
            marginTop: 8,
            borderRadius: 14,
            backgroundColor: theme.background,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 14,
            gap: 6,
        },
        reasonLabel: {
            fontSize: 12,
            fontWeight: '700',
            color: theme.textSecondary,
        },
        reasonText: {
            color: theme.text,
            lineHeight: 20,
        },
        primaryButton: {
            borderRadius: 18,
            backgroundColor: theme.primary,
            paddingVertical: 16,
            alignItems: 'center',
        },
        primaryButtonText: {
            color: '#fff',
            fontWeight: '700',
            fontSize: 16,
        },
        secondaryButton: {
            borderRadius: 18,
            borderWidth: 1,
            borderColor: theme.border,
            paddingVertical: 16,
            alignItems: 'center',
            backgroundColor: theme.card,
        },
        secondaryButtonText: {
            color: theme.text,
            fontWeight: '700',
            fontSize: 15,
        },
    });
}
