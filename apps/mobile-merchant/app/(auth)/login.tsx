import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();
    const router = useRouter();
    const theme = useTheme();

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Champs requis', 'Veuillez remplir tous les champs.');
            return;
        }
        setLoading(true);
        const { error } = await signIn(email.trim().toLowerCase(), password);
        setLoading(false);
        if (error) {
            Alert.alert('Connexion échouée', 'Email ou mot de passe incorrect.');
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
                    <Text style={s.appName}>Kbouffe Merchant</Text>
                    <Text style={s.tagline}>Gérez votre restaurant</Text>
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

                    <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={s.btnText}>Se connecter</Text>
                        )}
                    </TouchableOpacity>

                    <Text style={s.hint}>
                        Vous n'avez pas de compte ?{'\n'}
                        Contactez l'équipe KBouffe pour créer votre espace restaurant.
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
    hint: { marginTop: 16, textAlign: 'center', fontSize: 12, color: theme.textSecondary, lineHeight: 18 },
});
