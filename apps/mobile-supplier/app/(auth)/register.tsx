import { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch, uploadImage } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { CAMEROON_REGIONS, type SupplierType } from '@/lib/types';
import { useTheme } from '@/hooks/use-theme';

const SUPPLIER_TYPES: { value: SupplierType; label: string; hint: string }[] = [
    { value: 'individual_farmer', label: 'Agriculteur', hint: 'Producteur individuel' },
    { value: 'cooperative', label: 'Coopérative', hint: 'Groupement ou union' },
    { value: 'wholesaler', label: 'Grossiste', hint: 'Fournisseur structuré B2B' },
];

export default function RegisterScreen() {
    const router = useRouter();
    const theme = useTheme();
    const { session, registerAccount, refreshProfile } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [uploadingIdentity, setUploadingIdentity] = useState(false);
    const [uploadingMinader, setUploadingMinader] = useState(false);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState(session?.user.email ?? '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [contactName, setContactName] = useState('');
    const [phone, setPhone] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [supplierType, setSupplierType] = useState<SupplierType>('individual_farmer');
    const [region, setRegion] = useState<string>(CAMEROON_REGIONS[0]);
    const [locality, setLocality] = useState('');
    const [description, setDescription] = useState('');
    const [identityDocUrl, setIdentityDocUrl] = useState('');
    const [minaderCertUrl, setMinaderCertUrl] = useState('');
    const [rccm, setRccm] = useState('');
    const [nif, setNif] = useState('');
    const [cooperativeNumber, setCooperativeNumber] = useState('');
    const [phytosanitaryDeclaration, setPhytosanitaryDeclaration] = useState('');

    const accountRequired = !session;
    const normalizedContactName = useMemo(() => contactName.trim() || fullName.trim(), [contactName, fullName]);

    const uploadDocument = async (setter: (url: string) => void, type: 'identity' | 'minader') => {
        const activeSession = (await supabase.auth.getSession()).data.session;
        const token = activeSession?.access_token ?? session?.access_token;

        if (!token) {
            Alert.alert('Connexion requise', 'Créez votre compte avant de téléverser un document.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (result.canceled) return;

        if (type === 'identity') {
            setUploadingIdentity(true);
        } else {
            setUploadingMinader(true);
        }

        try {
            const uploaded = await uploadImage(result.assets[0].uri, token);
            setter(uploaded.url);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erreur d’upload';
            Alert.alert('Document non envoyé', message);
        } finally {
            if (type === 'identity') {
                setUploadingIdentity(false);
            } else {
                setUploadingMinader(false);
            }
        }
    };

    const handleSubmit = async () => {
        if (accountRequired) {
            if (!fullName.trim() || !email.trim() || !phone.trim() || !password || !confirmPassword) {
                Alert.alert('Champs requis', 'Complétez les informations de compte.');
                return;
            }
            if (password.length < 6) {
                Alert.alert('Mot de passe', 'Le mot de passe doit contenir au moins 6 caractères.');
                return;
            }
            if (password !== confirmPassword) {
                Alert.alert('Mot de passe', 'Les mots de passe ne correspondent pas.');
                return;
            }
        }

        if (!businessName.trim() || !normalizedContactName || !phone.trim() || !locality.trim()) {
            Alert.alert('Champs requis', 'Complétez le nom commercial, le contact, le téléphone et la localité.');
            return;
        }

        if (supplierType === 'wholesaler' && (!rccm.trim() || !nif.trim())) {
            Alert.alert('Dossier incomplet', 'RCCM et NIF sont requis pour un grossiste.');
            return;
        }

        if (supplierType === 'cooperative' && !cooperativeNumber.trim()) {
            Alert.alert('Dossier incomplet', 'Le numéro de coopérative est requis.');
            return;
        }

        setSubmitting(true);

        try {
            if (accountRequired) {
                const accountResult = await registerAccount({
                    fullName: fullName.trim(),
                    email: email.trim().toLowerCase(),
                    phone: phone.trim(),
                    password,
                });

                if (accountResult.error) {
                    throw new Error(accountResult.error);
                }
            }

            const activeSession = (await supabase.auth.getSession()).data.session;
            const token = activeSession?.access_token ?? session?.access_token;

            if (!token) {
                throw new Error('Session introuvable après la création du compte.');
            }

            const response = await apiFetch(
                '/api/marketplace/suppliers/register',
                {
                    method: 'POST',
                    body: JSON.stringify({
                        name: businessName.trim(),
                        type: supplierType,
                        contact_name: normalizedContactName,
                        phone: phone.trim(),
                        email: email.trim().toLowerCase(),
                        description: description.trim() || undefined,
                        region,
                        locality: locality.trim(),
                        identity_doc_url: identityDocUrl || undefined,
                        rccm: rccm.trim() || undefined,
                        nif: nif.trim() || undefined,
                        minader_cert_url: minaderCertUrl || undefined,
                        cooperative_number: cooperativeNumber.trim() || undefined,
                        phytosanitary_declaration: phytosanitaryDeclaration.trim() || undefined,
                    }),
                },
                token,
            );

            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.error ?? 'Inscription fournisseur impossible');
            }

            await refreshProfile();
            Alert.alert('Onboarding finalisé', payload.message ?? 'Votre demande a été envoyée.');
            router.replace('/(auth)/awaiting-approval');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erreur serveur';
            Alert.alert('Impossible de terminer l’onboarding', message);
        } finally {
            setSubmitting(false);
        }
    };

    const styles = createStyles(theme);

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <StatusBar style="dark" />
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <Text style={styles.title}>{accountRequired ? 'Créer mon compte fournisseur' : 'Finaliser mon onboarding'}</Text>
                    <Text style={styles.subtitle}>
                        Préparez votre profil fournisseur et envoyez les informations nécessaires à la validation KYC.
                    </Text>
                </View>

                {accountRequired && (
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>1. Compte</Text>
                        <Text style={styles.label}>Nom complet</Text>
                        <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Ex. Jean Mbarga" placeholderTextColor={theme.textSecondary} />
                        <Text style={styles.label}>Email</Text>
                        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="vous@exemple.com" autoCapitalize="none" keyboardType="email-address" placeholderTextColor={theme.textSecondary} />
                        <Text style={styles.label}>Téléphone</Text>
                        <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+237 6XX XXX XXX" keyboardType="phone-pad" placeholderTextColor={theme.textSecondary} />
                        <Text style={styles.label}>Mot de passe</Text>
                        <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" placeholderTextColor={theme.textSecondary} />
                        <Text style={styles.label}>Confirmer le mot de passe</Text>
                        <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholder="••••••••" placeholderTextColor={theme.textSecondary} />
                    </View>
                )}

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>{accountRequired ? '2. Profil fournisseur' : 'Profil fournisseur'}</Text>

                    <Text style={styles.label}>Nom commercial</Text>
                    <TextInput style={styles.input} value={businessName} onChangeText={setBusinessName} placeholder="Ex. Coopérative du Noun" placeholderTextColor={theme.textSecondary} />

                    <Text style={styles.label}>Contact principal</Text>
                    <TextInput style={styles.input} value={contactName} onChangeText={setContactName} placeholder="Nom du responsable" placeholderTextColor={theme.textSecondary} />

                    {!accountRequired && (
                        <>
                            <Text style={styles.label}>Téléphone</Text>
                            <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+237 6XX XXX XXX" keyboardType="phone-pad" placeholderTextColor={theme.textSecondary} />
                        </>
                    )}

                    <Text style={styles.label}>Type de fournisseur</Text>
                    <View style={styles.typeGrid}>
                        {SUPPLIER_TYPES.map((item) => (
                            <Pressable key={item.value} style={[styles.typeCard, supplierType === item.value && styles.typeCardActive]} onPress={() => setSupplierType(item.value)}>
                                <Text style={[styles.typeTitle, supplierType === item.value && styles.typeTitleActive]}>{item.label}</Text>
                                <Text style={[styles.typeHint, supplierType === item.value && styles.typeHintActive]}>{item.hint}</Text>
                            </Pressable>
                        ))}
                    </View>

                    <Text style={styles.label}>Région</Text>
                    <View style={styles.regionGrid}>
                        {CAMEROON_REGIONS.map((item) => (
                            <Pressable key={item} style={[styles.regionChip, region === item && styles.regionChipActive]} onPress={() => setRegion(item)}>
                                <Text style={[styles.regionChipText, region === item && styles.regionChipTextActive]}>{item}</Text>
                            </Pressable>
                        ))}
                    </View>

                    <Text style={styles.label}>Ville / localité</Text>
                    <TextInput style={styles.input} value={locality} onChangeText={setLocality} placeholder="Ex. Bafoussam" placeholderTextColor={theme.textSecondary} />

                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        placeholder="Présentez votre activité, vos spécialités et votre zone d’approvisionnement."
                        placeholderTextColor={theme.textSecondary}
                    />

                    {supplierType === 'wholesaler' && (
                        <>
                            <Text style={styles.label}>RCCM</Text>
                            <TextInput style={styles.input} value={rccm} onChangeText={setRccm} placeholder="Numéro RCCM" placeholderTextColor={theme.textSecondary} />
                            <Text style={styles.label}>NIF</Text>
                            <TextInput style={styles.input} value={nif} onChangeText={setNif} placeholder="Numéro d’identification fiscale" placeholderTextColor={theme.textSecondary} />
                        </>
                    )}

                    {supplierType === 'cooperative' && (
                        <>
                            <Text style={styles.label}>Numéro de coopérative</Text>
                            <TextInput style={styles.input} value={cooperativeNumber} onChangeText={setCooperativeNumber} placeholder="Référence officielle" placeholderTextColor={theme.textSecondary} />
                        </>
                    )}

                    <Text style={styles.label}>Déclaration phytosanitaire</Text>
                    <TextInput
                        style={[styles.input, styles.textAreaSmall]}
                        value={phytosanitaryDeclaration}
                        onChangeText={setPhytosanitaryDeclaration}
                        placeholder="Informations complémentaires si nécessaire"
                        placeholderTextColor={theme.textSecondary}
                        multiline
                    />
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Documents KYC</Text>
                    <Text style={styles.hint}>Ajoutez vos justificatifs pour accélérer la validation du dossier.</Text>

                    <Pressable style={styles.uploadRow} onPress={() => uploadDocument(setIdentityDocUrl, 'identity')}>
                        <View style={styles.uploadInfo}>
                            <Ionicons name="document-outline" size={20} color={theme.primary} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.uploadTitle}>Pièce d’identité</Text>
                                <Text style={styles.uploadHint}>{identityDocUrl ? 'Document ajouté' : 'Téléverser une photo claire'}</Text>
                            </View>
                        </View>
                        {uploadingIdentity ? <ActivityIndicator color={theme.primary} /> : <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />}
                    </Pressable>

                    <Pressable style={styles.uploadRow} onPress={() => uploadDocument(setMinaderCertUrl, 'minader')}>
                        <View style={styles.uploadInfo}>
                            <Ionicons name="shield-checkmark-outline" size={20} color={theme.primary} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.uploadTitle}>Certificat MINADER</Text>
                                <Text style={styles.uploadHint}>{minaderCertUrl ? 'Certificat ajouté' : 'Optionnel mais recommandé'}</Text>
                            </View>
                        </View>
                        {uploadingMinader ? <ActivityIndicator color={theme.primary} /> : <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />}
                    </Pressable>
                </View>

                <Pressable style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]} onPress={handleSubmit} disabled={submitting}>
                    {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{accountRequired ? 'Créer mon compte et envoyer mon dossier' : 'Envoyer mon dossier fournisseur'}</Text>}
                </Pressable>
            </ScrollView>
        </KeyboardAvoidingView>
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
            gap: 16,
        },
        header: {
            gap: 8,
            marginTop: 8,
        },
        title: {
            fontSize: 26,
            fontWeight: '800',
            color: theme.text,
        },
        subtitle: {
            fontSize: 14,
            lineHeight: 21,
            color: theme.textSecondary,
        },
        card: {
            backgroundColor: theme.card,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 16,
            gap: 10,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: '700',
            color: theme.text,
        },
        label: {
            marginTop: 4,
            fontSize: 13,
            fontWeight: '700',
            color: theme.text,
        },
        input: {
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 14,
            backgroundColor: theme.background,
            color: theme.text,
            paddingHorizontal: 14,
            paddingVertical: 14,
            fontSize: 15,
        },
        textArea: {
            minHeight: 110,
            textAlignVertical: 'top',
        },
        textAreaSmall: {
            minHeight: 88,
            textAlignVertical: 'top',
        },
        typeGrid: {
            gap: 10,
        },
        typeCard: {
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 16,
            padding: 14,
            backgroundColor: theme.background,
        },
        typeCardActive: {
            borderColor: theme.primary,
            backgroundColor: theme.primaryLight,
        },
        typeTitle: {
            fontSize: 15,
            fontWeight: '700',
            color: theme.text,
        },
        typeTitleActive: {
            color: theme.primary,
        },
        typeHint: {
            marginTop: 4,
            fontSize: 12,
            color: theme.textSecondary,
        },
        typeHintActive: {
            color: theme.primary,
        },
        regionGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
        },
        regionChip: {
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.background,
        },
        regionChipActive: {
            backgroundColor: theme.primary,
            borderColor: theme.primary,
        },
        regionChipText: {
            color: theme.text,
            fontWeight: '600',
            fontSize: 13,
        },
        regionChipTextActive: {
            color: '#fff',
        },
        hint: {
            fontSize: 12,
            color: theme.textSecondary,
        },
        uploadRow: {
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 16,
            padding: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: theme.background,
        },
        uploadInfo: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            flex: 1,
        },
        uploadTitle: {
            fontSize: 15,
            fontWeight: '700',
            color: theme.text,
        },
        uploadHint: {
            fontSize: 12,
            color: theme.textSecondary,
            marginTop: 2,
        },
        primaryButton: {
            marginBottom: 24,
            borderRadius: 18,
            backgroundColor: theme.primary,
            paddingVertical: 17,
            alignItems: 'center',
            justifyContent: 'center',
        },
        primaryButtonDisabled: {
            opacity: 0.65,
        },
        primaryButtonText: {
            color: '#fff',
            fontWeight: '700',
            fontSize: 16,
            textAlign: 'center',
            paddingHorizontal: 12,
        },
    });
}
