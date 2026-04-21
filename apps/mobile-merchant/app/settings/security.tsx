import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch, getErrorMessage } from '@/lib/api';
import { useTheme } from '@/hooks/use-theme';

export default function SecuritySettingsScreen() {
    const { session } = useAuth();
    const router = useRouter();
    const theme = useTheme();
    const [saving, setSaving] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

    const handleChangePassword = async () => {
        if (!currentPassword.trim()) {
            Alert.alert('Erreur', 'Veuillez entrer votre mot de passe actuel');
            return;
        }

        if (!newPassword.trim() || newPassword.length < 8) {
            Alert.alert('Erreur', 'Le nouveau mot de passe doit contenir au moins 8 caractères');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
            return;
        }

        if (!session) return;

        setSaving(true);
        try {
            await apiFetch(
                '/api/security/password',
                session.access_token,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        current_password: currentPassword,
                        new_password: newPassword,
                    }),
                }
            );
            Alert.alert('Succès', 'Mot de passe mis à jour');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            Alert.alert('Erreur', getErrorMessage(err, 'Impossible de mettre à jour le mot de passe'));
        } finally {
            setSaving(false);
        }
    };

    const handleToggleTwoFactor = async () => {
        if (!session) return;

        setSaving(true);
        try {
            await apiFetch(
                `/api/auth/2fa/${twoFactorEnabled ? 'disable' : 'enable'}`,
                session.access_token,
                { method: 'POST' }
            );
            setTwoFactorEnabled(!twoFactorEnabled);
            Alert.alert('Succès', twoFactorEnabled ? 'Authentification 2FA désactivée' : 'Authentification 2FA activée');
        } catch (err) {
            Alert.alert('Erreur', getErrorMessage(err, 'Impossible de mettre à jour'));
        } finally {
            setSaving(false);
        }
    };

    const s = styles(theme);

    return (
        <SafeAreaView style={s.container} edges={['top']}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={s.title}>Sécurité</Text>
                <View style={s.backButton} />
            </View>

            <ScrollView contentContainerStyle={s.content}>
                {/* Change Password Section */}
                <View style={s.section}>
                    <Text style={[s.sectionTitle, { color: theme.text }]}>Mot de passe</Text>

                    <View style={[s.formGroup, { backgroundColor: theme.surface }]}>
                        <Text style={[s.label, { color: theme.text }]}>Mot de passe actuel</Text>
                        <View style={[s.passwordInput, { borderColor: theme.border }]}>
                            <TextInput
                                style={[s.input, { color: theme.text }]}
                                placeholder="••••••••"
                                placeholderTextColor={theme.textSecondary}
                                secureTextEntry={!showCurrentPassword}
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                editable={!saving}
                            />
                            <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                                <Ionicons name={showCurrentPassword ? 'eye-off' : 'eye'} size={18} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={[s.formGroup, { backgroundColor: theme.surface }]}>
                        <Text style={[s.label, { color: theme.text }]}>Nouveau mot de passe</Text>
                        <View style={[s.passwordInput, { borderColor: theme.border }]}>
                            <TextInput
                                style={[s.input, { color: theme.text }]}
                                placeholder="••••••••"
                                placeholderTextColor={theme.textSecondary}
                                secureTextEntry={!showNewPassword}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                editable={!saving}
                            />
                            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                                <Ionicons name={showNewPassword ? 'eye-off' : 'eye'} size={18} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={[s.formGroup, { backgroundColor: theme.surface }]}>
                        <Text style={[s.label, { color: theme.text }]}>Confirmer le mot de passe</Text>
                        <View style={[s.passwordInput, { borderColor: theme.border }]}>
                            <TextInput
                                style={[s.input, { color: theme.text }]}
                                placeholder="••••••••"
                                placeholderTextColor={theme.textSecondary}
                                secureTextEntry={!showConfirmPassword}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                editable={!saving}
                            />
                            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={18} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[s.button, { backgroundColor: theme.primary }]}
                        onPress={handleChangePassword}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color="#fff" size={14} />
                        ) : (
                            <>
                                <Ionicons name="lock-closed" size={18} color="#fff" />
                                <Text style={s.buttonText}>Mettre à jour le mot de passe</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Two Factor Authentication */}
                <View style={s.section}>
                    <Text style={[s.sectionTitle, { color: theme.text }]}>Authentification</Text>

                    <View style={[s.twoFactorCard, { backgroundColor: theme.surface }]}>
                        <View style={s.twoFactorHeader}>
                            <View>
                                <Text style={[s.twoFactorTitle, { color: theme.text }]}>Authentification à deux facteurs</Text>
                                <Text style={[s.twoFactorDescription, { color: theme.textSecondary }]}>
                                    {twoFactorEnabled ? 'Activée' : 'Désactivée'} - Sécurisez votre compte
                                </Text>
                            </View>
                            <Switch
                                value={twoFactorEnabled}
                                onValueChange={handleToggleTwoFactor}
                                disabled={saving}
                                trackColor={{ false: theme.border, true: theme.primary }}
                            />
                        </View>
                    </View>
                </View>

                {/* Security Tips */}
                <View style={[s.tipsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={s.tipsHeader}>
                        <Ionicons name="shield-checkmark" size={20} color={theme.success} />
                        <Text style={[s.tipsTitle, { color: theme.text }]}>Conseils de sécurité</Text>
                    </View>
                    <Text style={[s.tipItem, { color: theme.textSecondary }]}>✓ Utilisez un mot de passe fort avec majuscules, chiffres et caractères spéciaux</Text>
                    <Text style={[s.tipItem, { color: theme.textSecondary }]}>✓ Ne partagez jamais votre mot de passe avec quiconque</Text>
                    <Text style={[s.tipItem, { color: theme.textSecondary }]}>✓ Activez l'authentification à deux facteurs pour plus de sécurité</Text>
                    <Text style={[s.tipItem, { color: theme.textSecondary }]}>✓ Changez régulièrement votre mot de passe</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = (theme: any) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: theme.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
        title: { fontSize: 17, fontWeight: '700', color: theme.text },
        content: { padding: 16, gap: 20, paddingBottom: 32 },
        section: { gap: 12 },
        sectionTitle: { fontSize: 14, fontWeight: '700', paddingHorizontal: 4 },
        formGroup: { borderRadius: 12, padding: 14, gap: 8 },
        label: { fontSize: 12, fontWeight: '600' },
        passwordInput: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12 },
        input: { flex: 1, paddingVertical: 10, fontSize: 13 },
        button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 10, marginTop: 12 },
        buttonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
        twoFactorCard: { borderRadius: 12, padding: 14 },
        twoFactorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
        twoFactorTitle: { fontSize: 14, fontWeight: '600' },
        twoFactorDescription: { fontSize: 12, marginTop: 2 },
        tipsCard: { borderRadius: 12, padding: 14, borderWidth: 1, gap: 8 },
        tipsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
        tipsTitle: { fontSize: 14, fontWeight: '700' },
        tipItem: { fontSize: 12, lineHeight: 18, marginLeft: 4 },
    });
