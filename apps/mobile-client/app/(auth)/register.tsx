import { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter, Link } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radii, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/auth-context';

export default function RegisterScreen() {
    const router = useRouter();
    const { register } = useAuth();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!fullName || !phone || !password) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setLoading(true);
        try {
            await register(fullName, phone, password);
            router.replace('/onboarding');
        } catch (error) {
            Alert.alert('Inscription impossible', error instanceof Error ? error.message : 'Veuillez réessayer.');
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

                <View style={styles.header}>
                    <Animated.Text entering={FadeInDown.delay(100).springify()} style={[styles.logo, { color: theme.primary }]}>Kbouffe</Animated.Text>
                    <Animated.Text entering={FadeInDown.delay(200).springify()} style={[styles.title, { color: theme.text }]}>Creer un compte</Animated.Text>
                    <Animated.Text entering={FadeInDown.delay(300).springify()} style={[styles.subtitle, { color: theme.icon }]}>Rejoignez-nous et commandez vos plats preferes</Animated.Text>
                </View>

                <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.form}>
                    <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.background }]}>
                        <Ionicons name="person-outline" size={20} color={theme.icon} style={styles.inputIcon} />
                        <TextInput
                            placeholder="Nom complet"
                            placeholderTextColor={theme.icon}
                            style={[styles.input, { color: theme.text }]}
                            value={fullName}
                            onChangeText={setFullName}
                        />
                    </View>

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
                            secureTextEntry
                        />
                    </View>

                    <Pressable
                        style={({ pressed }) => [
                            styles.button, 
                            { backgroundColor: theme.primary, opacity: loading ? 0.7 : 1 },
                            pressed && { transform: [{ scale: 0.98 }] }
                        ]}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>{loading ? 'Creation...' : 'Creer mon compte'}</Text>
                    </Pressable>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(500).springify()} style={styles.footer}>
                    <Text style={[styles.footerText, { color: theme.icon }]}>Deja un compte? </Text>
                    <Link href="/(auth)/login" asChild>
                        <Pressable>
                            <Text style={[styles.footerLink, { color: theme.primary }]}>Se connecter</Text>
                        </Pressable>
                    </Link>
                </Animated.View>
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
