import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';

/**
 * Traduit l'erreur Supabase en message actionnable. Auparavant tout échec —
 * panne réseau, compte suspendu, quota atteint — était présenté comme
 * « Email ou mot de passe incorrect », envoyant l'utilisateur sur une fausse piste.
 */
function describeSignInError(message: string): string {
    const raw = message.toLowerCase();

    if (raw.includes('invalid login credentials')) {
        return 'Email ou mot de passe incorrect.';
    }
    if (raw.includes('email not confirmed')) {
        return "Votre adresse email n'a pas encore été confirmée. Vérifiez votre boîte de réception.";
    }
    if (raw.includes('network') || raw.includes('failed to fetch') || raw.includes('timeout')) {
        return 'Connexion au serveur impossible. Vérifiez votre connexion internet et réessayez.';
    }
    if (raw.includes('rate limit') || raw.includes('too many requests')) {
        return 'Trop de tentatives de connexion. Patientez quelques minutes avant de réessayer.';
    }
    if (raw.includes('banned') || raw.includes('disabled')) {
        return "Ce compte est désactivé. Contactez l'équipe KBouffe.";
    }
    return message;
}

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const { signIn } = useAuth();
    const theme = useTheme();

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            setErrorMessage('Veuillez renseigner votre email et votre mot de passe.');
            return;
        }
        setLoading(true);
        setErrorMessage(null);
        const { error } = await signIn(email.trim().toLowerCase(), password);
        setLoading(false);
        if (error) {
            setErrorMessage(describeSignInError(error));
            return;
        }
        // Navigation handled by useEffect in index
    };

    const s = styles(theme);

    return (
        <KeyboardAvoidingView
            style={s.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <StatusBar style="light" />
            <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
                {/* Header */}
                <View style={s.header}>
                    <View style={s.logoBox}>
                        <Text style={s.logoText}>K</Text>
                    </View>
                    <Text style={s.appName}>Kbouffe Gestionnaire</Text>
                    <Text style={s.tagline}>Pilotez votre restaurant en mobilite</Text>
                </View>

                {/* Form */}
                <View style={s.form}>
                    <Text style={s.label}>Adresse email</Text>
                    <TextInput
                        style={s.input}
                        placeholder="vous@example.com"
                        placeholderTextColor={theme.textSecondary}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    <Text style={s.label}>Mot de passe</Text>
                    <TextInput
                        style={s.input}
                        placeholder="••••••••"
                        placeholderTextColor={theme.textSecondary}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    {errorMessage && (
                        <View
                            style={[s.errorBanner, { borderColor: theme.error, backgroundColor: `${theme.error}15` }]}
                            accessibilityLiveRegion="polite"
                        >
                            <Ionicons name="alert-circle" size={18} color={theme.error} />
                            <Text style={[s.errorText, { color: theme.error }]}>{errorMessage}</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={s.btn}
                        onPress={handleLogin}
                        disabled={loading}
                        accessibilityRole="button"
                        accessibilityLabel="Se connecter"
                        accessibilityState={{ disabled: loading, busy: loading }}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={s.btnText}>Se connecter</Text>
                        )}
                    </TouchableOpacity>

                    <Text style={s.hint}>
                        Vous n&apos;avez pas de compte ?{'\n'}
                        Contactez l&apos;equipe KBouffe pour creer votre espace restaurant.
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = (theme: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.primary },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    header: { alignItems: 'center', marginBottom: 40 },
    logoBox: {
        width: 72, height: 72, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    },
    logoText: { fontSize: 36, fontWeight: '800', color: '#fff' },
    appName: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 6 },
    tagline: { fontSize: 14, color: 'rgba(255,255,255,0.75)' },
    form: {
        backgroundColor: theme.surface,
        borderRadius: 20, padding: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15, shadowRadius: 16, elevation: 8,
    },
    label: { fontSize: 13, fontWeight: '600', color: theme.text, marginBottom: 6, marginTop: 12 },
    input: {
        borderWidth: 1, borderColor: theme.border, borderRadius: 12,
        padding: 14, fontSize: 15, color: theme.text, backgroundColor: theme.background,
    },
    btn: {
        backgroundColor: theme.primary, borderRadius: 12,
        padding: 16, alignItems: 'center', marginTop: 20,
    },
    btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    errorBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        marginTop: 16, padding: 12, borderRadius: 12, borderWidth: 1,
    },
    errorText: { flex: 1, fontSize: 13, lineHeight: 18 },
    hint: { marginTop: 16, textAlign: 'center', fontSize: 12, color: theme.textSecondary, lineHeight: 18 },
});
