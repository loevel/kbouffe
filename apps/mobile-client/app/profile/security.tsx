import { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Radii, Typography, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';

export default function SecurityScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();

    const [currentPwd, setCurrentPwd] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [changingPwd, setChangingPwd] = useState(false);
    const [expanded, setExpanded] = useState<'password' | null>('password');

    const handleChangePassword = async () => {
        if (!currentPwd || !newPwd || !confirmPwd) {
            Alert.alert('Champs requis', 'Veuillez remplir tous les champs.');
            return;
        }
        if (newPwd !== confirmPwd) {
            Alert.alert('Erreur', 'Les nouveaux mots de passe ne correspondent pas.');
            return;
        }
        if (newPwd.length < 8) {
            Alert.alert('Erreur', 'Le nouveau mot de passe doit contenir au moins 8 caractères.');
            return;
        }
        if (currentPwd === newPwd) {
            Alert.alert('Erreur', 'Le nouveau mot de passe doit être différent de l\'actuel.');
            return;
        }

        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setChangingPwd(true);

        try {
            // Re-authenticate with current password first
            const email = user?.email ?? '';
            if (!email) throw new Error('Compte email introuvable');

            const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPwd });
            if (signInError) throw new Error('Mot de passe actuel incorrect.');

            // Update password
            const { error } = await supabase.auth.updateUser({ password: newPwd });
            if (error) throw error;

            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setCurrentPwd('');
            setNewPwd('');
            setConfirmPwd('');
            Alert.alert('Succès', 'Votre mot de passe a été modifié avec succès.');
        } catch (err) {
            Alert.alert('Erreur', err instanceof Error ? err.message : 'Impossible de changer le mot de passe.');
        } finally {
            setChangingPwd(false);
        }
    };

    const strengthLevel = (pwd: string) => {
        if (!pwd) return 0;
        let score = 0;
        if (pwd.length >= 8) score++;
        if (pwd.length >= 12) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;
        return score;
    };

    const strength = strengthLevel(newPwd);
    const strengthColor = ['#ef4444', '#f97316', '#f59e0b', '#22c55e', '#10b981'][Math.min(strength, 4)];
    const strengthLabel = ['Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'][Math.min(strength, 4)];

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.background }]}
            contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top, Spacing.md) }]}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Sécurité</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Account info */}
            <View style={[styles.section, { marginTop: Spacing.md }]}>
                <Text style={[styles.sectionTitle, { color: theme.icon }]}>Compte</Text>
                <View style={[styles.card, { backgroundColor: theme.surface }]}>
                    <View style={styles.infoRow}>
                        <View style={[styles.iconBox, { backgroundColor: theme.primary + '15' }]}>
                            <Ionicons name="call-outline" size={20} color={theme.primary} />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={[styles.infoLabel, { color: theme.icon }]}>Téléphone</Text>
                            <Text style={[styles.infoValue, { color: theme.text }]}>{user?.phone ?? '—'}</Text>
                        </View>
                        <View style={[styles.verifiedBadge, { backgroundColor: '#10b98115' }]}>
                            <Ionicons name="shield-checkmark" size={14} color="#10b981" />
                            <Text style={styles.verifiedText}>Vérifié</Text>
                        </View>
                    </View>
                    {user?.email && (
                        <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: theme.border }]}>
                            <View style={[styles.iconBox, { backgroundColor: '#3b82f615' }]}>
                                <Ionicons name="mail-outline" size={20} color="#3b82f6" />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={[styles.infoLabel, { color: theme.icon }]}>Email</Text>
                                <Text style={[styles.infoValue, { color: theme.text }]}>{user.email}</Text>
                            </View>
                        </View>
                    )}
                </View>
            </View>

            {/* Change password */}
            <View style={styles.section}>
                <Pressable
                    style={[styles.accordionHeader, { backgroundColor: theme.surface }]}
                    onPress={() => {
                        Haptics.selectionAsync();
                        setExpanded(expanded === 'password' ? null : 'password');
                    }}
                >
                    <View style={styles.accordionLeft}>
                        <View style={[styles.iconBox, { backgroundColor: '#a855f715' }]}>
                            <Ionicons name="lock-closed-outline" size={20} color="#a855f7" />
                        </View>
                        <Text style={[styles.accordionTitle, { color: theme.text }]}>Changer le mot de passe</Text>
                    </View>
                    <Ionicons
                        name={expanded === 'password' ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={theme.icon}
                    />
                </Pressable>

                {expanded === 'password' && (
                    <View style={[styles.accordionBody, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        {/* Current password */}
                        <Text style={[styles.fieldLabel, { color: theme.icon }]}>Mot de passe actuel</Text>
                        <View style={[styles.inputContainer, { borderColor: theme.border }]}>
                            <Ionicons name="lock-closed-outline" size={18} color={theme.icon} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: theme.text }]}
                                value={currentPwd}
                                onChangeText={setCurrentPwd}
                                secureTextEntry={!showCurrent}
                                placeholder="••••••••"
                                placeholderTextColor={theme.icon}
                                textContentType="password"
                            />
                            <Pressable onPress={() => setShowCurrent(!showCurrent)}>
                                <Ionicons name={showCurrent ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.icon} />
                            </Pressable>
                        </View>

                        {/* New password */}
                        <Text style={[styles.fieldLabel, { color: theme.icon, marginTop: Spacing.sm }]}>Nouveau mot de passe</Text>
                        <View style={[styles.inputContainer, { borderColor: theme.border }]}>
                            <Ionicons name="key-outline" size={18} color={theme.icon} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: theme.text }]}
                                value={newPwd}
                                onChangeText={setNewPwd}
                                secureTextEntry={!showNew}
                                placeholder="Au moins 8 caractères"
                                placeholderTextColor={theme.icon}
                                textContentType="newPassword"
                            />
                            <Pressable onPress={() => setShowNew(!showNew)}>
                                <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.icon} />
                            </Pressable>
                        </View>

                        {/* Strength indicator */}
                        {newPwd.length > 0 && (
                            <View style={styles.strengthWrapper}>
                                <View style={styles.strengthBars}>
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <View
                                            key={i}
                                            style={[
                                                styles.strengthBar,
                                                { backgroundColor: i <= strength ? strengthColor : theme.border },
                                            ]}
                                        />
                                    ))}
                                </View>
                                <Text style={[styles.strengthLabel, { color: strengthColor }]}>{strengthLabel}</Text>
                            </View>
                        )}

                        {/* Confirm password */}
                        <Text style={[styles.fieldLabel, { color: theme.icon, marginTop: Spacing.sm }]}>Confirmer le mot de passe</Text>
                        <View style={[styles.inputContainer, { borderColor: confirmPwd && confirmPwd !== newPwd ? '#ef4444' : theme.border }]}>
                            <Ionicons name="lock-closed-outline" size={18} color={theme.icon} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: theme.text }]}
                                value={confirmPwd}
                                onChangeText={setConfirmPwd}
                                secureTextEntry={!showConfirm}
                                placeholder="Répétez le mot de passe"
                                placeholderTextColor={theme.icon}
                                textContentType="newPassword"
                            />
                            <Pressable onPress={() => setShowConfirm(!showConfirm)}>
                                <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.icon} />
                            </Pressable>
                        </View>
                        {confirmPwd.length > 0 && confirmPwd !== newPwd && (
                            <Text style={styles.errorHint}>Les mots de passe ne correspondent pas</Text>
                        )}

                        <Pressable
                            style={[styles.saveButton, { backgroundColor: theme.primary, opacity: changingPwd ? 0.7 : 1 }]}
                            onPress={handleChangePassword}
                            disabled={changingPwd}
                        >
                            {changingPwd ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.saveButtonText}>Mettre à jour le mot de passe</Text>
                            )}
                        </Pressable>
                    </View>
                )}
            </View>

            {/* Security tips */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.icon }]}>Conseils de sécurité</Text>
                <View style={[styles.card, { backgroundColor: theme.surface }]}>
                    {[
                        { icon: 'checkmark-circle', color: '#10b981', text: 'Utilisez un mot de passe d\'au moins 8 caractères' },
                        { icon: 'checkmark-circle', color: '#10b981', text: 'Mélangez lettres, chiffres et caractères spéciaux' },
                        { icon: 'alert-circle', color: '#f59e0b', text: 'Ne partagez jamais votre mot de passe' },
                        { icon: 'alert-circle', color: '#f59e0b', text: 'Évitez les mots de passe déjà utilisés ailleurs' },
                    ].map((tip, i, arr) => (
                        <View
                            key={i}
                            style={[
                                styles.tipRow,
                                i !== arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
                            ]}
                        >
                            <Ionicons name={tip.icon as any} size={18} color={tip.color} />
                            <Text style={[styles.tipText, { color: theme.text }]}>{tip.text}</Text>
                        </View>
                    ))}
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
    },
    backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { ...Typography.title3 },
    section: { paddingHorizontal: Spacing.md, marginTop: Spacing.lg },
    sectionTitle: {
        ...Typography.small,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: Spacing.sm,
        marginLeft: Spacing.xs,
    },
    card: { borderRadius: Radii.xl, overflow: 'hidden', ...Shadows.sm },
    infoRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md },
    iconBox: { width: 36, height: 36, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center' },
    infoContent: { flex: 1 },
    infoLabel: { ...Typography.small },
    infoValue: { ...Typography.bodySemibold, marginTop: 1 },
    verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radii.full },
    verifiedText: { fontSize: 11, fontWeight: '600', color: '#10b981' },
    accordionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
        borderRadius: Radii.xl,
        ...Shadows.sm,
    },
    accordionLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    accordionTitle: { ...Typography.bodySemibold },
    accordionBody: {
        marginTop: 2,
        borderRadius: Radii.xl,
        padding: Spacing.md,
        borderWidth: 1,
        gap: 4,
    },
    fieldLabel: { ...Typography.caption, fontWeight: '600', marginBottom: 4 },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: Radii.lg,
        paddingHorizontal: Spacing.md,
        height: 48,
    },
    inputIcon: { marginRight: Spacing.sm },
    input: { flex: 1, ...Typography.body },
    strengthWrapper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 6 },
    strengthBars: { flexDirection: 'row', gap: 4, flex: 1 },
    strengthBar: { flex: 1, height: 4, borderRadius: 2 },
    strengthLabel: { ...Typography.small, fontWeight: '600', width: 70 },
    errorHint: { ...Typography.small, color: '#ef4444', marginTop: 4 },
    saveButton: {
        height: 48,
        borderRadius: Radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Spacing.md,
    },
    saveButtonText: { color: '#fff', ...Typography.bodySemibold },
    tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, padding: Spacing.md },
    tipText: { ...Typography.caption, flex: 1, lineHeight: 20 },
});
