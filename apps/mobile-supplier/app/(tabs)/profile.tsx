import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/contexts/auth-context';
import { useFontScale, scaled } from '@/hooks/use-font-scale';
import { authApiFetch, uploadImage } from '@/lib/api';

const KYC_STATUS_LABELS = {
    pending: 'En attente',
    approved: 'Approuvé',
    rejected: 'Rejeté',
    suspended: 'Suspendu',
} as const;

export default function ProfileScreen() {
    const router = useRouter();
    const theme = useTheme();
    const fontScale = useFontScale();
    const { profile, session, refreshProfile, signOut } = useAuth();
    const [locality, setLocality] = useState(profile?.locality ?? '');
    const [address, setAddress] = useState(profile?.address ?? '');
    const [description, setDescription] = useState(profile?.description ?? '');
    const [logoUrl, setLogoUrl] = useState(profile?.logo_url ?? '');
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const pickLogo = async () => {
        if (!session?.access_token) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (result.canceled) return;

        setUploading(true);
        try {
            const uploaded = await uploadImage(result.assets[0].uri, session.access_token);
            setLogoUrl(uploaded.url);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erreur d’upload';
            Alert.alert('Logo non téléversé', message);
        } finally {
            setUploading(false);
        }
    };

    const saveProfile = async () => {
        setSaving(true);
        try {
            const response = await authApiFetch('/api/marketplace/suppliers/me', {
                method: 'PATCH',
                body: JSON.stringify({
                    locality: locality.trim() || null,
                    address: address.trim() || null,
                    description: description.trim() || null,
                    logo_url: logoUrl || null,
                }),
            });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.error ?? 'Impossible de mettre à jour le profil');
            }

            await refreshProfile();
            Alert.alert('Profil mis à jour', 'Vos modifications ont bien été enregistrées.');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erreur serveur';
            Alert.alert('Erreur', message);
        } finally {
            setSaving(false);
        }
    };

    const styles = createStyles(theme, fontScale);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>Profil fournisseur</Text>

                <View style={styles.card}>
                    <View style={styles.identityRow}>
                        <Pressable style={styles.logoBox} onPress={pickLogo}>
                            {uploading ? (
                                <ActivityIndicator color={theme.primary} />
                            ) : logoUrl ? (
                                <Image source={{ uri: logoUrl }} style={styles.logoImage} />
                            ) : (
                                <Ionicons name="camera-outline" size={28} color={theme.primary} />
                            )}
                        </Pressable>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.name}>{profile?.name ?? 'Profil fournisseur'}</Text>
                            <Text style={styles.meta}>{profile?.contact_name ?? 'Contact principal'}</Text>
                            <Text style={styles.badge}>
                                KYC : {profile?.kyc_status ? KYC_STATUS_LABELS[profile.kyc_status] : KYC_STATUS_LABELS.pending}
                            </Text>
                        </View>
                    </View>

                    <InfoRow label="Téléphone" value={profile?.phone ?? 'Non défini'} theme={theme} />
                    <InfoRow label="Email" value={profile?.email ?? 'Non défini'} theme={theme} />
                    <InfoRow label="Type" value={profile?.type ?? 'Non défini'} theme={theme} />
                    <InfoRow label="Région" value={profile?.region ?? 'Non définie'} theme={theme} />
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Mettre à jour le profil</Text>
                    <Text style={styles.label}>Localité</Text>
                    <TextInput style={styles.input} value={locality} onChangeText={setLocality} placeholder="Ville / localité" placeholderTextColor={theme.textSecondary} />
                    <Text style={styles.label}>Adresse</Text>
                    <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Adresse complète" placeholderTextColor={theme.textSecondary} />
                    <Text style={styles.label}>Description</Text>
                    <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline placeholder="Présentez votre activité" placeholderTextColor={theme.textSecondary} />
                    <Pressable style={styles.primaryButton} onPress={saveProfile} disabled={saving}>
                        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Enregistrer</Text>}
                    </Pressable>
                </View>

                {profile?.kyc_rejection_reason ? (
                    <View style={styles.warningCard}>
                        <Text style={styles.warningTitle}>Motif de rejet KYC</Text>
                        <Text style={styles.warningText}>{profile.kyc_rejection_reason}</Text>
                    </View>
                ) : null}

                <Pressable style={styles.secondaryButton} onPress={() => router.replace('/(auth)/awaiting-approval')}>
                    <Text style={styles.secondaryButtonText}>Voir le statut d’onboarding</Text>
                </Pressable>

                <Pressable style={styles.secondaryButton} onPress={() => signOut()}>
                    <Text style={styles.secondaryButtonText}>Se déconnecter</Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}

function InfoRow({
    label,
    value,
    theme,
}: {
    label: string;
    value: string;
    theme: ReturnType<typeof useTheme>;
}) {
    return (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
            <Text style={{ color: theme.textSecondary }}>{label}</Text>
            <Text style={{ color: theme.text, fontWeight: '700', flexShrink: 1, textAlign: 'right' }}>{value}</Text>
        </View>
    );
}

function createStyles(theme: ReturnType<typeof useTheme>, fontScale: number) {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
        },
        content: {
            padding: 16,
            gap: 16,
            paddingBottom: 32,
        },
        title: {
            fontSize: scaled(24, fontScale),
            fontWeight: '800',
            color: theme.text,
        },
        card: {
            backgroundColor: theme.card,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 16,
            gap: 12,
        },
        identityRow: {
            flexDirection: 'row',
            gap: 14,
            alignItems: 'center',
        },
        logoBox: {
            width: 82,
            height: 82,
            borderRadius: 20,
            backgroundColor: theme.primaryLight,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
        },
        logoImage: {
            width: '100%',
            height: '100%',
        },
        name: {
            color: theme.text,
            fontSize: scaled(19, fontScale),
            fontWeight: '800',
        },
        meta: {
            color: theme.textSecondary,
            marginTop: 4,
        },
        badge: {
            color: theme.primary,
            marginTop: 6,
            fontWeight: '700',
            textTransform: 'capitalize',
        },
        sectionTitle: {
            color: theme.text,
            fontSize: scaled(18, fontScale),
            fontWeight: '700',
        },
        label: {
            color: theme.text,
            fontSize: scaled(13, fontScale),
            fontWeight: '700',
        },
        input: {
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 14,
            backgroundColor: theme.background,
            color: theme.text,
            paddingHorizontal: 14,
            paddingVertical: 14,
        },
        textArea: {
            minHeight: 110,
            textAlignVertical: 'top',
        },
        primaryButton: {
            marginTop: 8,
            borderRadius: 16,
            backgroundColor: theme.primary,
            paddingVertical: 16,
            alignItems: 'center',
        },
        primaryButtonText: {
            color: '#fff',
            fontWeight: '700',
            fontSize: scaled(16, fontScale),
        },
        secondaryButton: {
            borderRadius: 16,
            backgroundColor: theme.card,
            borderWidth: 1,
            borderColor: theme.border,
            paddingVertical: 15,
            alignItems: 'center',
        },
        secondaryButtonText: {
            color: theme.text,
            fontWeight: '700',
        },
        warningCard: {
            backgroundColor: '#fff7ed',
            borderRadius: 18,
            padding: 16,
            gap: 6,
            borderWidth: 1,
            borderColor: '#fdba74',
        },
        warningTitle: {
            color: '#c2410c',
            fontWeight: '800',
            fontSize: scaled(15, fontScale),
        },
        warningText: {
            color: '#9a3412',
            lineHeight: 20,
        },
    });
}
