import { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radii, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordScreen() {
    const router = useRouter();
    const { phone } = useLocalSearchParams<{ phone: string }>();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleReset = async () => {
        if (!otp.trim() || !newPassword || !confirmPassword) {
            Alert.alert('Champs requis', 'Veuillez remplir tous les champs.');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
            return;
        }
        if (newPassword.length < 8) {
            Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 8 caractères.');
            return;
        }
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setLoading(true);
        try {
            // Step 1: Verify OTP
            const { error: otpError } = await supabase.auth.verifyOtp({
                phone: phone ?? '',
                token: otp.trim(),
                type: 'sms',
            });
            if (otpError) throw otpError;

            // Step 2: Update password
            const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
            if (updateError) throw updateError;

            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
                'Succès',
                'Votre mot de passe a été mis à jour. Vous êtes maintenant connecté.',
                [{ text: 'Continuer', onPress: () => router.replace('/') }],
            );
        } catch (error) {
            Alert.alert(
                'Erreur',
                error instanceof Error ? error.message : 'Code invalide ou expiré. Réessayez.',
            );
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        void Haptics.selectionAsync();
        try {
            const { error } = await supabase.auth.signInWithOtp({ phone: phone ?? '' });
            if (error) throw error;
            Alert.alert('Code renvoyé', 'Un nouveau code a été envoyé par SMS.');
        } catch (error) {
            Alert.alert('Erreur', error instanceof Error ? error.message : 'Impossible de renvoyer le code.');
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView
                style={[styles.container, { backgroundColor: theme.background }]}
                contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.xl }]}
                keyboardShouldPersistTaps="handled"
            >
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </Pressable>

                <View style={styles.iconWrapper}>
                    <View style={[styles.iconCircle, { backgroundColor: theme.primaryLight }]}>
                        <Ionicons name="shield-checkmark-outline" size={40} color={theme.primary} />
                    </View>
                </View>

                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.text }]}>Vérification SMS</Text>
                    <Text style={[styles.subtitle, { color: theme.icon }]}>
                        Entrez le code reçu par SMS au {phone} et choisissez un nouveau mot de passe.
                    </Text>
                </View>

                <View style={styles.form}>
                    {/* OTP */}
                    <View>
                        <Text style={[styles.label, { color: theme.icon }]}>Code SMS</Text>
                        <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.background }]}>
                            <Ionicons name="keypad-outline" size={20} color={theme.icon} style={styles.inputIcon} />
                            <TextInput
                                placeholder="123456"
                                placeholderTextColor={theme.icon}
                                style={[styles.input, { color: theme.text, letterSpacing: 4 }]}
                                value={otp}
                                onChangeText={setOtp}
                                keyboardType="number-pad"
                                maxLength={6}
                                textContentType="oneTimeCode"
                            />
                        </View>
                    </View>

                    {/* Nouveau mot de passe */}
                    <View>
                        <Text style={[styles.label, { color: theme.icon }]}>Nouveau mot de passe</Text>
                        <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.background }]}>
                            <Ionicons name="lock-closed-outline" size={20} color={theme.icon} style={styles.inputIcon} />
                            <TextInput
                                placeholder="Au moins 8 caractères"
                                placeholderTextColor={theme.icon}
                                style={[styles.input, { color: theme.text }]}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry={!showNew}
                                textContentType="newPassword"
                            />
                            <Pressable onPress={() => setShowNew(!showNew)}>
                                <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.icon} />
                            </Pressable>
                        </View>
                    </View>

                    {/* Confirmation */}
                    <View>
                        <Text style={[styles.label, { color: theme.icon }]}>Confirmer le mot de passe</Text>
                        <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.background }]}>
                            <Ionicons name="lock-closed-outline" size={20} color={theme.icon} style={styles.inputIcon} />
                            <TextInput
                                placeholder="Répétez le mot de passe"
                                placeholderTextColor={theme.icon}
                                style={[styles.input, { color: theme.text }]}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirm}
                                textContentType="newPassword"
                            />
                            <Pressable onPress={() => setShowConfirm(!showConfirm)}>
                                <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.icon} />
                            </Pressable>
                        </View>
                    </View>

                    <Pressable
                        style={[styles.button, { backgroundColor: theme.primary, opacity: loading ? 0.7 : 1 }]}
                        onPress={handleReset}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>{loading ? 'Vérification...' : 'Réinitialiser le mot de passe'}</Text>
                    </Pressable>
                </View>

                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: theme.icon }]}>Vous n'avez pas reçu le code ? </Text>
                    <Pressable onPress={handleResend}>
                        <Text style={[styles.footerLink, { color: theme.primary }]}>Renvoyer</Text>
                    </Pressable>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
    backButton: { marginBottom: Spacing.lg },
    iconWrapper: { alignItems: 'center', marginBottom: Spacing.xl },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: { marginBottom: Spacing.xl, alignItems: 'center' },
    title: { ...Typography.title2, marginBottom: Spacing.sm, textAlign: 'center' },
    subtitle: { ...Typography.body, textAlign: 'center', lineHeight: 24 },
    form: { gap: Spacing.md },
    label: { ...Typography.caption, fontWeight: '600', marginBottom: Spacing.xs },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: Radii.lg,
        paddingHorizontal: Spacing.md,
        height: 52,
    },
    inputIcon: { marginRight: Spacing.sm },
    input: { flex: 1, ...Typography.body, height: '100%' },
    button: {
        height: 52,
        borderRadius: Radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Spacing.sm,
    },
    buttonText: { color: '#fff', ...Typography.body, fontWeight: '700' },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl, flexWrap: 'wrap' },
    footerText: { ...Typography.body },
    footerLink: { ...Typography.body, fontWeight: '700' },
});
