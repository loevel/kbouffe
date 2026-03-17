import { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radii, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/auth-context';

export default function LoginScreen() {
    const router = useRouter();
    const { login } = useAuth();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!phone || !password) return;
        setLoading(true);
        await login(phone, password);
        setLoading(false);
        router.replace('/(tabs)');
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

                <View style={styles.header}>
                    <Text style={[styles.logo, { color: theme.primary }]}>Kbouffe</Text>
                    <Text style={[styles.title, { color: theme.text }]}>Content de vous revoir!</Text>
                    <Text style={[styles.subtitle, { color: theme.icon }]}>Connectez-vous pour commander</Text>
                </View>

                <View style={styles.form}>
                    <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.background }]}>
                        <Ionicons name="call-outline" size={20} color={theme.icon} style={styles.inputIcon} />
                        <TextInput
                            placeholder="Numero de telephone"
                            placeholderTextColor={theme.icon}
                            style={[styles.input, { color: theme.text }]}
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.background }]}>
                        <Ionicons name="lock-closed-outline" size={20} color={theme.icon} style={styles.inputIcon} />
                        <TextInput
                            placeholder="Mot de passe"
                            placeholderTextColor={theme.icon}
                            style={[styles.input, { color: theme.text }]}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <Pressable onPress={() => setShowPassword(!showPassword)}>
                            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.icon} />
                        </Pressable>
                    </View>

                    <Pressable style={styles.forgotPassword}>
                        <Text style={[styles.forgotPasswordText, { color: theme.primary }]}>Mot de passe oublie?</Text>
                    </Pressable>

                    <Pressable
                        style={[styles.button, { backgroundColor: theme.primary, opacity: loading ? 0.7 : 1 }]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>{loading ? 'Connexion...' : 'Se connecter'}</Text>
                    </Pressable>
                </View>

                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: theme.icon }]}>Pas encore de compte? </Text>
                    <Link href="/(auth)/register" asChild>
                        <Pressable>
                            <Text style={[styles.footerLink, { color: theme.primary }]}>Creer un compte</Text>
                        </Pressable>
                    </Link>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
    backButton: { marginBottom: Spacing.lg },
    header: { marginBottom: Spacing.xl },
    logo: { ...Typography.title1, fontWeight: '800', marginBottom: Spacing.sm },
    title: { ...Typography.title2, marginBottom: Spacing.xs },
    subtitle: { ...Typography.body },
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
    forgotPassword: { alignSelf: 'flex-end' },
    forgotPasswordText: { ...Typography.caption, fontWeight: '600' },
    button: {
        height: 52,
        borderRadius: Radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Spacing.sm,
    },
    buttonText: { color: '#fff', ...Typography.body, fontWeight: '700' },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl },
    footerText: { ...Typography.body },
    footerLink: { ...Typography.body, fontWeight: '700' },
});
