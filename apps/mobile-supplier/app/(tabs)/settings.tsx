import { useState } from 'react';
import {
    ScrollView,
    View,
    Text,
    Pressable,
    Switch,
    StyleSheet,
    Alert,
    SafeAreaView,
    Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { useSettings } from '@/contexts/settings-context';
import { useAuth } from '@/contexts/auth-context';
import { useFontScale, scaled } from '@/hooks/use-font-scale';
import { useFontScale as useFontScaleHook } from '@/hooks/use-font-scale';
import { authApiFetch } from '@/lib/api';

export default function SettingsScreen() {
    const router = useRouter();
    const theme = useTheme();
    const { settings, updateSettings, resetSettings } = useSettings();
    const { signOut } = useAuth();
    const version = Constants.expoConfig?.version ?? '1.0.0';
    const fontScale = useFontScaleHook();

    const handleThemeChange = (value: any) => {
        updateSettings({ theme: value });
    };

    const handleLanguageChange = (language: any) => {
        updateSettings({ language });
    };

    const handleCurrencyChange = (currency: any) => {
        updateSettings({ currency });
    };

    const handleNotificationToggle = async () => {
        const newValue = !settings.notifications;

        if (newValue) {
            // Enable notifications - request permission
            const { status } = await Notifications.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permission refusée',
                    'Veuillez activer les notifications dans les réglages iOS.'
                );
                return;
            }
        }

        updateSettings({ notifications: newValue });
    };

    const handleEmailNotificationToggle = async () => {
        const newValue = !settings.emailNotifications;
        try {
            const response = await authApiFetch('/api/marketplace/suppliers/me/preferences', {
                method: 'PATCH',
                body: JSON.stringify({ email_notifications: newValue }),
            });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.error ?? 'Impossible de mettre à jour les préférences');
            }

            updateSettings({ emailNotifications: newValue });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erreur serveur';
            Alert.alert('Erreur', message);
        }
    };

    const handleFontSizeChange = (fontSize: any) => {
        updateSettings({ fontSize });
    };

    const handleCompactModeToggle = async () => {
        updateSettings({ compactMode: !settings.compactMode });
    };

    const handleLogout = async () => {
        Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter?', [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Déconnecter',
                style: 'destructive',
                onPress: async () => {
                    await signOut();
                    router.replace('/(auth)/login');
                },
            },
        ]);
    };

    const handleReset = async () => {
        Alert.alert('Réinitialiser', 'Restaurer tous les paramètres par défaut?', [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Réinitialiser',
                style: 'destructive',
                onPress: async () => {
                    await resetSettings();
                    Alert.alert('Succès', 'Les paramètres ont été réinitialisés');
                },
            },
        ]);
    };

    const styles = createStyles(theme, fontScale);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                {/* Header */}
                <Text style={styles.title}>Paramètres</Text>

                {/* Appearance Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Apparence</Text>

                    {/* Theme */}
                    <View style={styles.settingItem}>
                        <View style={styles.settingLabel}>
                            <Ionicons name="moon-outline" size={20} color={theme.primary} />
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.settingName}>Thème</Text>
                                <Text style={styles.settingDescription}>Clair, sombre ou auto</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.optionsRow}>
                        {(['light', 'dark', 'auto'] as const).map((t) => (
                            <Pressable
                                key={t}
                                onPress={() => handleThemeChange(t)}
                                style={[
                                    styles.optionButton,
                                    settings.theme === t && styles.optionButtonActive,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.optionText,
                                        settings.theme === t && styles.optionTextActive,
                                    ]}
                                >
                                    {t === 'light'
                                        ? '☀️ Clair'
                                        : t === 'dark'
                                          ? '🌙 Sombre'
                                          : '⚙️ Auto'}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    {/* Font Size */}
                    <View style={[styles.settingItem, styles.marginTop]}>
                        <View style={styles.settingLabel}>
                            <Ionicons name="text-outline" size={20} color={theme.primary} />
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.settingName}>Taille du texte</Text>
                                <Text style={styles.settingDescription}>Petit, normal ou grand</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.optionsRow}>
                        {(['small', 'normal', 'large'] as const).map((size) => (
                            <Pressable
                                key={size}
                                onPress={() => handleFontSizeChange(size)}
                                style={[
                                    styles.optionButton,
                                    settings.fontSize === size && styles.optionButtonActive,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.optionText,
                                        settings.fontSize === size && styles.optionTextActive,
                                    ]}
                                >
                                    {size === 'small'
                                        ? 'Petit'
                                        : size === 'normal'
                                          ? 'Normal'
                                          : 'Grand'}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    {/* Compact Mode */}
                    <View style={[styles.toggleItem, styles.marginTop]}>
                        <View style={styles.settingLabel}>
                            <Ionicons name="list-outline" size={20} color={theme.primary} />
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.settingName}>Mode compact</Text>
                                <Text style={styles.settingDescription}>Réduire l'espacement des éléments</Text>
                            </View>
                        </View>
                        <Switch
                            value={settings.compactMode}
                            onValueChange={handleCompactModeToggle}
                            trackColor={{ false: '#ccc', true: theme.primary + '40' }}
                            thumbColor={settings.compactMode ? theme.primary : '#999'}
                        />
                    </View>
                </View>

                {/* Language & Region */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Langue & Région</Text>

                    {/* Language */}
                    <View style={styles.settingItem}>
                        <View style={styles.settingLabel}>
                            <Ionicons name="globe-outline" size={20} color={theme.primary} />
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.settingName}>Langue</Text>
                                <Text style={styles.settingDescription}>
                                    {settings.language === 'fr' ? 'Français' : 'English'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.optionsRow}>
                        {(['fr', 'en'] as const).map((lang) => (
                            <Pressable
                                key={lang}
                                onPress={() => handleLanguageChange(lang)}
                                style={[
                                    styles.optionButton,
                                    settings.language === lang && styles.optionButtonActive,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.optionText,
                                        settings.language === lang && styles.optionTextActive,
                                    ]}
                                >
                                    {lang === 'fr' ? '🇫🇷 FR' : '🇬🇧 EN'}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    {/* Currency */}
                    <View style={[styles.settingItem, styles.marginTop]}>
                        <View style={styles.settingLabel}>
                            <Ionicons name="cash-outline" size={20} color={theme.primary} />
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.settingName}>Devise</Text>
                                <Text style={styles.settingDescription}>{settings.currency}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.optionsRow}>
                        {(['XAF', 'EUR', 'USD'] as const).map((curr) => (
                            <Pressable
                                key={curr}
                                onPress={() => handleCurrencyChange(curr)}
                                style={[
                                    styles.optionButton,
                                    settings.currency === curr && styles.optionButtonActive,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.optionText,
                                        settings.currency === curr && styles.optionTextActive,
                                    ]}
                                >
                                    {curr}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </View>

                {/* Notifications */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notifications</Text>

                    <View style={styles.toggleItem}>
                        <View style={styles.settingLabel}>
                            <Ionicons name="notifications-outline" size={20} color={theme.primary} />
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.settingName}>Notifications push</Text>
                                <Text style={styles.settingDescription}>Recevoir les alertes en temps réel</Text>
                            </View>
                        </View>
                        <Switch
                            value={settings.notifications}
                            onValueChange={handleNotificationToggle}
                            trackColor={{ false: '#ccc', true: theme.primary + '40' }}
                            thumbColor={settings.notifications ? theme.primary : '#999'}
                        />
                    </View>

                    <View style={[styles.toggleItem, styles.marginTop]}>
                        <View style={styles.settingLabel}>
                            <Ionicons name="mail-outline" size={20} color={theme.primary} />
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.settingName}>Notifications email</Text>
                                <Text style={styles.settingDescription}>Recevoir les emails importants</Text>
                            </View>
                        </View>
                        <Switch
                            value={settings.emailNotifications}
                            onValueChange={handleEmailNotificationToggle}
                            trackColor={{ false: '#ccc', true: theme.primary + '40' }}
                            thumbColor={settings.emailNotifications ? theme.primary : '#999'}
                        />
                    </View>
                </View>

                {/* About */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>À propos</Text>

                    <View style={styles.settingItem}>
                        <View style={styles.settingLabel}>
                            <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.settingName}>Version</Text>
                                <Text style={styles.settingDescription}>{version}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={[styles.settingItem, styles.marginTop]}>
                        <Pressable
                            style={styles.linkButton}
                            onPress={() => Linking.openURL('https://kbouffe.com/cgu')}
                        >
                            <Ionicons name="open-outline" size={16} color={theme.primary} />
                            <Text style={styles.linkText}>Conditions d'utilisation</Text>
                        </Pressable>
                    </View>

                    <View style={[styles.settingItem, styles.marginTop]}>
                        <Pressable
                            style={styles.linkButton}
                            onPress={() => Linking.openURL('https://kbouffe.com/privacy')}
                        >
                            <Ionicons name="open-outline" size={16} color={theme.primary} />
                            <Text style={styles.linkText}>Politique de confidentialité</Text>
                        </Pressable>
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.section}>
                    <Pressable style={[styles.button, styles.resetButton]} onPress={handleReset}>
                        <Ionicons name="refresh-outline" size={18} color="#FF9500" />
                        <Text style={styles.resetButtonText}>Réinitialiser les paramètres</Text>
                    </Pressable>

                    <Pressable style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={18} color="#FF3B30" />
                        <Text style={styles.logoutButtonText}>Se déconnecter</Text>
                    </Pressable>
                </View>

                <View style={{ height: 20 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

function createStyles(theme: ReturnType<typeof useTheme>, fontScale: number) {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
        },
        content: {
            padding: 16,
        },
        title: {
            fontSize: scaled(32, fontScale),
            fontWeight: '800',
            color: theme.text,
            marginBottom: 24,
        },
        section: {
            marginBottom: 24,
        },
        sectionTitle: {
            fontSize: scaled(16, fontScale),
            fontWeight: '700',
            color: theme.text,
            marginBottom: 12,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
        },
        settingItem: {
            paddingVertical: 12,
            paddingHorizontal: 12,
            backgroundColor: theme.card,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.border,
        },
        toggleItem: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 12,
            paddingHorizontal: 12,
            backgroundColor: theme.card,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.border,
        },
        settingLabel: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        settingName: {
            fontSize: scaled(15, fontScale),
            fontWeight: '600',
            color: theme.text,
        },
        settingDescription: {
            fontSize: scaled(12, fontScale),
            color: theme.text + '70',
            marginTop: 2,
        },
        marginTop: {
            marginTop: 12,
        },
        optionsRow: {
            flexDirection: 'row',
            gap: 8,
            marginTop: 10,
        },
        optionButton: {
            flex: 1,
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 10,
            backgroundColor: theme.background,
            borderWidth: 1,
            borderColor: theme.border,
            alignItems: 'center',
        },
        optionButtonActive: {
            backgroundColor: theme.primary,
            borderColor: theme.primary,
        },
        optionText: {
            fontSize: scaled(13, fontScale),
            fontWeight: '600',
            color: theme.text,
        },
        optionTextActive: {
            color: '#fff',
        },
        linkButton: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
        },
        linkText: {
            fontSize: scaled(15, fontScale),
            fontWeight: '600',
            color: theme.primary,
        },
        button: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingVertical: 14,
            borderRadius: 12,
            marginTop: 12,
        },
        resetButton: {
            backgroundColor: '#FF9500' + '20',
            borderWidth: 1,
            borderColor: '#FF9500',
        },
        resetButtonText: {
            fontSize: scaled(15, fontScale),
            fontWeight: '700',
            color: '#FF9500',
        },
        logoutButton: {
            backgroundColor: '#FF3B30' + '20',
            borderWidth: 1,
            borderColor: '#FF3B30',
        },
        logoutButtonText: {
            fontSize: scaled(15, fontScale),
            fontWeight: '700',
            color: '#FF3B30',
        },
    });
}
