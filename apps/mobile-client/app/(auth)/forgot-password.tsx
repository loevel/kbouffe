import { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radii, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';

const DEFAULT_COUNTRY_CODE = process.env.EXPO_PUBLIC_DEFAULT_COUNTRY_CODE ?? '+237';

function normalizePhone(phone: string) {
    const trimmed = phone.trim();
    if (!trimmed) return trimmed;
    if (trimmed.startsWith('+')) return `+${trimmed.slice(1).replace(/\D/g, '')}`;
    const countryDigits = DEFAULT_COUNTRY_CODE.replace(/\D/g, '');
    const localDigits = trimmed.replace(/\D/g, '').replace(/^0+/, '');
    if (localDigits.startsWith(countryDigits)) return `+${localDigits}`;
    return `+${countryDigits}${localDigits}`;
}

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendOtp = async () => {
        const trimmed = phone.trim();
        if (!trimmed) {
            Alert.alert('Champ requis', 'Veuillez entrer votre numéro de téléphone.');
            return;
        }
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setLoading(true);
        try {
            const normalized = normalizePhone(trimmed);
            const { error } = await supabase.auth.signInWithOtp({ phone: normalized });
            if (error) throw error;
            router.push({
                pathname: '/(auth)/reset-password',
                params: { phone: normalized },
            });
        } catch (error) {
            Alert.alert(
                'Erreur',
                error instanceof Error ? error.message : 'Impossible d\'envoyer le code. Vérifiez votre numéro.',
            );
        } finally {
            setLoading(false);
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
                        <Ionicons name="lock-open-outline" size={40} color={theme.primary} />
                    </View>
                </View>

                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.text }]}>Mot de passe oublié ?</Text>
                    <Text style={[styles.subtitle, { color: theme.icon }]}>
                        Entrez votre numéro de téléphone et nous vous enverrons un code de vérification par SMS.
                    </Text>
                </View>

                <View style={styles.form}>
                    <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.background }]}>
                        <Ionicons name="call-outline" size={20} color={theme.icon} style={styles.inputIcon} />
                        <TextInput
                            placeholder="Numéro de téléphone"
                            placeholderTextColor={theme.icon}
                            style={[styles.input, { color: theme.text }]}
                            value={phone}
                            onChangeText={setPhone}
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="phone-pad"
                            textContentType="telephoneNumber"
                        />
                    </View>

                    <Pressable
                        style={[styles.button, { backgroundColor: theme.primary, opacity: loading ? 0.7 : 1 }]}
                        onPress={handleSendOtp}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>{loading ? 'Envoi en cours...' : 'Envoyer le code'}</Text>
                    </Pressable>
                </View>

                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: theme.icon }]}>Vous vous souvenez de votre mot de passe? </Text>
                    <Pressable onPress={() => router.back()}>
                        <Text style={[styles.footerLink, { color: theme.primary }]}>Se connecter</Text>
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
