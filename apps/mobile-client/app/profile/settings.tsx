import { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Switch, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radii, Typography, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/contexts/theme-context';
import { useAuth } from '@/contexts/auth-context';
import { deleteAccount } from '@/lib/api';

export default function SettingsScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const { preference, setPreference } = useAppTheme();
    const { user, updateProfile, logout } = useAuth();
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();

    const [notifications, setNotifications] = useState(user?.profile?.notificationsEnabled ?? true);
    const [language, setLanguage] = useState<'fr' | 'en'>(user?.profile?.preferredLang === 'en' ? 'en' : 'fr');
    const [deleting, setDeleting] = useState(false);

    const handleLanguageChange = () => {
        const newLang = language === 'fr' ? 'en' : 'fr';
        setLanguage(newLang);
        if (updateProfile) {
            updateProfile({ profile: { ...user?.profile, preferredLang: newLang } });
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Supprimer le compte',
            'Êtes-vous sûr ? Cette action est irréversible. Toutes vos données seront supprimées.',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        setDeleting(true);
                        try {
                            await deleteAccount();
                            await logout();
                            router.replace('/(auth)/login' as any);
                        } catch (err) {
                            Alert.alert(
                                'Erreur',
                                err instanceof Error
                                    ? err.message
                                    : 'Impossible de supprimer le compte. Veuillez réessayer.',
                            );
                        } finally {
                            setDeleting(false);
                        }
                    },
                },
            ],
        );
    };

    const ThemeOption = ({ label, value, icon }: { label: string, value: 'light' | 'dark' | 'system', icon: any }) => {
        const isActive = preference === value;
        return (
            <Pressable
                style={[
                    styles.themeOption,
                    { 
                        backgroundColor: isActive ? theme.primary : theme.background,
                        borderColor: isActive ? theme.primary : theme.border,
                    }
                ]}
                onPress={() => setPreference(value)}
            >
                <Ionicons name={icon} size={18} color={isActive ? '#fff' : theme.icon} />
                <Text style={[styles.themeOptionText, { color: isActive ? '#fff' : theme.icon }]}>{label}</Text>
            </Pressable>
        );
    };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.background }]}
            contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
        >
            {/* Header */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top, Spacing.md) }]}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Paramètres</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Notifications */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.icon }]}>Préférences</Text>
                <View style={[styles.card, { backgroundColor: theme.surface }]}>
                    <View style={styles.row}>
                        <View style={styles.rowContent}>
                            <View style={[styles.iconBox, { backgroundColor: theme.primary + '15' }]}>
                                <Ionicons name="notifications" size={20} color={theme.primary} />
                            </View>
                            <Text style={[styles.rowLabel, { color: theme.text }]}>Notifications</Text>
                        </View>
                        <Switch
                            value={notifications}
                            onValueChange={(val) => {
                                setNotifications(val);
                                if (updateProfile) updateProfile({ profile: { ...user?.profile, notificationsEnabled: val } });
                            }}
                            trackColor={{ false: theme.border, true: theme.primary + '80' }}
                            thumbColor={notifications ? theme.primary : '#f4f3f4'}
                        />
                    </View>
                </View>
            </View>

            {/* Apparence & Langue */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.icon }]}>Application</Text>
                <View style={[styles.card, { backgroundColor: theme.surface }]}>
                    {/* Thème Selector */}
                    <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'column', alignItems: 'stretch', gap: Spacing.md }]}> 
                        <View style={styles.rowContent}>
                            <View style={[styles.iconBox, { backgroundColor: theme.primary + '15' }]}>
                                <Ionicons name="color-palette" size={20} color={theme.primary} />
                            </View>
                            <Text style={[styles.rowLabel, { color: theme.text }]}>Thème</Text>
                        </View>
                        <View style={styles.themeSelector}>
                            <ThemeOption label="Clair" value="light" icon="sunny" />
                            <ThemeOption label="Sombre" value="dark" icon="moon" />
                            <ThemeOption label="Auto" value="system" icon="phone-portrait" />
                        </View>
                    </View>
                    
                    {/* Langue Selector */}
                    <Pressable style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]} onPress={handleLanguageChange}>
                        <View style={styles.rowContent}>
                            <View style={[styles.iconBox, { backgroundColor: theme.primary + '15' }]}>
                                <Ionicons name="language" size={20} color={theme.primary} />
                            </View>
                            <Text style={[styles.rowLabel, { color: theme.text }]}>Langue</Text>
                        </View>
                        <View style={styles.rowRight}>
                            <Text style={[styles.rowValue, { color: theme.text }]}>{language === 'fr' ? 'Français' : 'English'}</Text>
                            <Ionicons name="chevron-forward" size={20} color={theme.icon} />
                        </View>
                    </Pressable>
                </View>
            </View>

            {/* Aide & Support */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.icon }]}>À propos</Text>
                <View style={[styles.card, { backgroundColor: theme.surface }]}>
                    <Pressable
                        style={({ pressed }) => [styles.row, { borderBottomWidth: 1, borderBottomColor: theme.border }, pressed && { opacity: 0.7 }]}
                        onPress={() => router.push('/legal/client')}
                    >
                        <View style={styles.rowContent}>
                            <Text style={[styles.rowLabel, { color: theme.text }]}>Conditions d'utilisation</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.icon} />
                    </Pressable>
                    <Pressable
                        style={({ pressed }) => [styles.row, { borderBottomWidth: 1, borderBottomColor: theme.border }, pressed && { opacity: 0.7 }]}
                        onPress={() => router.push('/legal/client')}
                    >
                        <View style={styles.rowContent}>
                            <Text style={[styles.rowLabel, { color: theme.text }]}>Politique de confidentialité</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.icon} />
                    </Pressable>
                    <Pressable
                        style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
                        onPress={() => router.push('/support')}
                    >
                        <View style={styles.rowContent}>
                            <Text style={[styles.rowLabel, { color: theme.text }]}>Support & Aide</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.icon} />
                    </Pressable>
                </View>
            </View>

            {/* Danger Zone */}
            <View style={[styles.section, { marginTop: Spacing.xl }]}>
                <Pressable
                    style={[styles.deleteButton, deleting && { opacity: 0.6 }]}
                    onPress={handleDeleteAccount}
                    disabled={deleting}
                >
                    {deleting ? (
                        <ActivityIndicator size="small" color="#ef4444" />
                    ) : (
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    )}
                    <Text style={styles.deleteButtonText}>
                        {deleting ? 'Suppression…' : 'Supprimer mon compte'}
                    </Text>
                </Pressable>
            </View>

            <Text style={[styles.version, { color: theme.icon }]}>Kbouffe v1.0.0 (build 1)</Text>
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
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        ...Typography.title3,
    },
    section: { paddingHorizontal: Spacing.md, marginTop: Spacing.lg },
    sectionTitle: { ...Typography.small, fontWeight: '700', textTransform: 'uppercase', marginBottom: Spacing.sm, marginLeft: Spacing.xs, letterSpacing: 0.5 },
    card: { 
        borderRadius: Radii.xl, 
        overflow: 'hidden',
        ...Shadows.sm,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
    },
    rowContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: Radii.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rowRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    rowLabel: { ...Typography.bodySemibold },
    rowValue: { ...Typography.body, fontWeight: '500' },
    themeSelector: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    themeOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.xs,
        paddingVertical: Spacing.sm,
        borderWidth: 1,
        borderRadius: Radii.lg,
    },
    themeOptionText: {
        ...Typography.small,
        fontWeight: '600',
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        padding: Spacing.md,
        borderRadius: Radii.xl,
        backgroundColor: '#ef444415',
    },
    deleteButtonText: { color: '#ef4444', ...Typography.bodySemibold },
    version: { textAlign: 'center', ...Typography.caption, marginTop: Spacing.xl, marginBottom: Spacing.md },
});