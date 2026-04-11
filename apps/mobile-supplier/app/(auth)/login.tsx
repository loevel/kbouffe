import { useState } from 'react';
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
import { StatusBar } from 'expo-status-bar';
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

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Champs requis', 'Renseignez votre email et votre mot de passe.');
            return;
        }

        setLoading(true);
        const result = await signIn(email.trim().toLowerCase(), password);
        setLoading(false);

        if (result.error) {
            Alert.alert('Connexion échouée', 'Vérifiez vos identifiants et réessayez.');
        }
    };

    const styles = createStyles(theme);

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <StatusBar style="light" />
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <View style={styles.logo}>
                        <Text style={styles.logoText}>K</Text>
                    </View>
                    <Text style={styles.title}>Kbouffe Supplier</Text>
                    <Text style={styles.subtitle}>Connectez-vous pour gérer votre activité fournisseur.</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.label}>Adresse email</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="fournisseur@exemple.com"
                        placeholderTextColor={theme.textSecondary}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                    />

                    <Text style={styles.label}>Mot de passe</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor={theme.textSecondary}
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />

                    <Pressable style={styles.primaryButton} onPress={handleLogin} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Se connecter</Text>}
                    </Pressable>

                    <Pressable style={styles.secondaryButton} onPress={() => router.push('/(auth)/register')}>
                        <Text style={styles.secondaryButtonText}>Créer mon compte fournisseur</Text>
                    </Pressable>
                </View>
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
            padding: 24,
            gap: 28,
        },
        header: {
            alignItems: 'center',
            gap: 10,
        },
        logo: {
            width: 74,
            height: 74,
            borderRadius: 24,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.16)',
        },
        logoText: {
            color: '#fff',
            fontSize: 34,
            fontWeight: '800',
        },
        title: {
            color: '#fff',
            fontSize: 28,
            fontWeight: '800',
        },
        subtitle: {
            textAlign: 'center',
            color: 'rgba(255,255,255,0.82)',
            fontSize: 14,
            lineHeight: 21,
        },
        card: {
            borderRadius: 24,
            padding: 22,
            backgroundColor: theme.card,
            gap: 10,
        },
        label: {
            marginTop: 6,
            fontSize: 13,
            fontWeight: '700',
            color: theme.text,
        },
        input: {
            borderRadius: 14,
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.background,
            paddingHorizontal: 14,
            paddingVertical: 14,
            color: theme.text,
            fontSize: 15,
        },
        primaryButton: {
            marginTop: 16,
            borderRadius: 16,
            backgroundColor: theme.primary,
            paddingVertical: 16,
            alignItems: 'center',
        },
        primaryButtonText: {
            color: '#fff',
            fontSize: 16,
            fontWeight: '700',
        },
        secondaryButton: {
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.border,
            paddingVertical: 15,
            alignItems: 'center',
        },
        secondaryButtonText: {
            color: theme.text,
            fontSize: 15,
            fontWeight: '700',
        },
    });
}
