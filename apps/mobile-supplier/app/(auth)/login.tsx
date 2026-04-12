import { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/contexts/auth-context';

export default function LoginScreen() {
    const router = useRouter();
    const theme = useTheme();
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

    const handleLogin = async () => {
        setError('');

        if (!email.trim()) {
            setError('Adresse email requise');
            return;
        }

        if (!password.trim()) {
            setError('Mot de passe requis');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Format email invalide');
            return;
        }

        setLoading(true);
        const result = await signIn(email.trim().toLowerCase(), password);
        setLoading(false);

        if (result.error) {
            setError('Email ou mot de passe incorrect');
        }
    };

    const styles = createStyles(theme);

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <StatusBar style="light" />
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <View style={styles.logo}>
                        <Ionicons name="cube" size={40} color="#fff" />
                    </View>
                    <Text style={styles.title}>Kbouffe</Text>
                    <Text style={styles.subtitle}>Espace Fournisseur</Text>
                    <Text style={styles.description}>Accédez à votre tableau de bord et gérez vos commandes</Text>
                </View>

                <View style={styles.card}>
                    {/* Email Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Adresse email</Text>
                        <View
                            style={[
                                styles.inputContainer,
                                emailFocused && styles.inputContainerFocused,
                                error && styles.inputContainerError,
                            ]}
                        >
                            <Ionicons name="mail-outline" size={20} color={emailFocused ? theme.primary : theme.text + '60'} />
                            <TextInput
                                style={styles.input}
                                placeholder="fournisseur@exemple.com"
                                placeholderTextColor={theme.text + '40'}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                editable={!loading}
                                value={email}
                                onChangeText={(text) => {
                                    setEmail(text);
                                    setError('');
                                }}
                                onFocus={() => setEmailFocused(true)}
                                onBlur={() => setEmailFocused(false)}
                            />
                        </View>
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Mot de passe</Text>
                        <View
                            style={[
                                styles.inputContainer,
                                passwordFocused && styles.inputContainerFocused,
                                error && styles.inputContainerError,
                            ]}
                        >
                            <Ionicons name="lock-closed-outline" size={20} color={passwordFocused ? theme.primary : theme.text + '60'} />
                            <TextInput
                                style={styles.input}
                                placeholder="Votre mot de passe"
                                placeholderTextColor={theme.text + '40'}
                                secureTextEntry={!showPassword}
                                editable={!loading}
                                value={password}
                                onChangeText={(text) => {
                                    setPassword(text);
                                    setError('');
                                }}
                                onFocus={() => setPasswordFocused(true)}
                                onBlur={() => setPasswordFocused(false)}
                            />
                            <Pressable onPress={() => setShowPassword(!showPassword)} disabled={loading}>
                                <Ionicons
                                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                                    size={20}
                                    color={theme.text + '60'}
                                />
                            </Pressable>
                        </View>
                    </View>

                    {/* Error Message */}
                    {error ? (
                        <View style={styles.errorContainer}>
                            <Ionicons name="alert-circle" size={16} color="#ff3b30" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    {/* Forgot Password Link */}
                    <View style={styles.forgotPasswordContainer}>
                        <Pressable disabled={loading}>
                            <Text style={styles.forgotPasswordText}>Mot de passe oublié?</Text>
                        </Pressable>
                    </View>

                    {/* Login Button */}
                    <Pressable style={[styles.primaryButton, loading && styles.primaryButtonDisabled]} onPress={handleLogin} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <View style={styles.buttonContent}>
                                <Ionicons name="log-in-outline" size={20} color="#fff" />
                                <Text style={styles.primaryButtonText}>Se connecter</Text>
                            </View>
                        )}
                    </Pressable>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Register Button */}
                    <Pressable style={styles.secondaryButton} onPress={() => router.push('/(auth)/register')} disabled={loading}>
                        <View style={styles.secondaryButtonContent}>
                            <Ionicons name="person-add-outline" size={20} color={theme.primary} />
                            <Text style={styles.secondaryButtonText}>Créer mon compte fournisseur</Text>
                        </View>
                    </Pressable>
                </View>

                {/* Footer */}
                <Text style={styles.footer}>En vous connectant, vous acceptez nos conditions d'utilisation</Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

function createStyles(theme: ReturnType<typeof useTheme>) {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.primary,
        },
        scroll: {
            flexGrow: 1,
            justifyContent: 'center',
            padding: 20,
            paddingTop: 40,
            paddingBottom: 60,
            gap: 32,
        },
        header: {
            alignItems: 'center',
            gap: 12,
        },
        logo: {
            width: 80,
            height: 80,
            borderRadius: 28,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.12)',
        },
        title: {
            color: '#fff',
            fontSize: 32,
            fontWeight: '800',
            letterSpacing: -0.5,
        },
        subtitle: {
            color: 'rgba(255,255,255,0.9)',
            fontSize: 16,
            fontWeight: '600',
            letterSpacing: -0.3,
        },
        description: {
            textAlign: 'center',
            color: 'rgba(255,255,255,0.7)',
            fontSize: 14,
            lineHeight: 21,
            marginTop: 4,
        },
        card: {
            borderRadius: 24,
            padding: 24,
            backgroundColor: theme.card,
            gap: 20,
        },
        inputGroup: {
            gap: 8,
        },
        label: {
            fontSize: 13,
            fontWeight: '600',
            color: theme.text,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
        },
        inputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: theme.border,
            backgroundColor: theme.background,
            paddingHorizontal: 14,
            gap: 10,
            height: 52,
            transition: 'all 0.2s ease',
        },
        inputContainerFocused: {
            borderColor: theme.primary,
            backgroundColor: theme.background,
        },
        inputContainerError: {
            borderColor: '#ff3b30',
        },
        input: {
            flex: 1,
            color: theme.text,
            fontSize: 15,
            fontWeight: '500',
        },
        errorContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#ff3b3010',
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            gap: 8,
        },
        errorText: {
            color: '#ff3b30',
            fontSize: 13,
            fontWeight: '600',
            flex: 1,
        },
        forgotPasswordContainer: {
            alignItems: 'flex-end',
            marginTop: 4,
        },
        forgotPasswordText: {
            color: theme.primary,
            fontSize: 13,
            fontWeight: '600',
        },
        primaryButton: {
            borderRadius: 14,
            backgroundColor: theme.primary,
            paddingVertical: 16,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 8,
        },
        primaryButtonDisabled: {
            opacity: 0.6,
        },
        buttonContent: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
        },
        primaryButtonText: {
            color: '#fff',
            fontSize: 16,
            fontWeight: '700',
        },
        divider: {
            height: 1,
            backgroundColor: theme.border,
            marginVertical: 8,
        },
        secondaryButton: {
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: theme.primary,
            paddingVertical: 14,
            alignItems: 'center',
            justifyContent: 'center',
        },
        secondaryButtonContent: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
        },
        secondaryButtonText: {
            color: theme.primary,
            fontSize: 15,
            fontWeight: '700',
        },
        footer: {
            textAlign: 'center',
            color: 'rgba(255,255,255,0.6)',
            fontSize: 12,
            lineHeight: 18,
        },
    });
}
