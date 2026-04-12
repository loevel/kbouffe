import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch, getErrorMessage } from '@/lib/api';
import { useTheme } from '@/hooks/use-theme';

interface NotificationPreferencesResponse {
    preferences: {
        notificationsEnabled: boolean;
    };
}

interface RestaurantNotificationsSettings {
    sms_notifications_enabled: boolean | null;
}

export default function NotificationSettingsScreen() {
    const { session } = useAuth();
    const router = useRouter();
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [inAppEnabled, setInAppEnabled] = useState(true);
    const [smsEnabled, setSmsEnabled] = useState(false);

    const loadSettings = useCallback(async () => {
        if (!session) {
            setLoading(false);
            return;
        }

        try {
            const [preferences, restaurant] = await Promise.all([
                apiFetch<NotificationPreferencesResponse>('/api/notifications/preferences', session.access_token),
                apiFetch<RestaurantNotificationsSettings>('/api/restaurant', session.access_token),
            ]);
            setInAppEnabled(Boolean(preferences.preferences?.notificationsEnabled));
            setSmsEnabled(Boolean(restaurant.sms_notifications_enabled));
        } catch (error) {
            Alert.alert('Erreur', getErrorMessage(error, 'Impossible de charger les préférences'));
        } finally {
            setLoading(false);
        }
    }, [session]);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    const handleSave = async () => {
        if (!session) return;
        setSaving(true);

        try {
            await apiFetch('/api/notifications/preferences', session.access_token, {
                method: 'POST',
                body: JSON.stringify({
                    settings: {
                        mobile: { email: false, push: inAppEnabled },
                    },
                    soundEnabled: true,
                }),
            });

            await apiFetch('/api/restaurant', session.access_token, {
                method: 'PATCH',
                body: JSON.stringify({
                    sms_notifications_enabled: smsEnabled,
                }),
            });

            Alert.alert('Succès', 'Préférences de notifications mises à jour.');
            router.back();
        } catch (error) {
            Alert.alert('Erreur', getErrorMessage(error, 'Impossible de mettre à jour les préférences'));
        } finally {
            setSaving(false);
        }
    };

    const s = styles(theme);

    if (loading) {
        return (
            <SafeAreaView style={s.container} edges={['top']}>
                <ActivityIndicator style={{ marginTop: 40 }} color={theme.primary} size="large" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={s.container} edges={['top']}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={s.title}>Notifications</Text>
                <View style={s.backButton} />
            </View>

            <View style={s.content}>
                <View style={s.card}>
                    <View style={s.row}>
                        <View style={s.rowInfo}>
                            <Text style={s.rowTitle}>Notifications mobiles</Text>
                            <Text style={s.rowDescription}>Alertes commandes, messages et activité en temps réel.</Text>
                        </View>
                        <Switch
                            value={inAppEnabled}
                            onValueChange={setInAppEnabled}
                            trackColor={{ false: theme.border, true: `${theme.primary}99` }}
                            thumbColor={inAppEnabled ? theme.primary : theme.textSecondary}
                        />
                    </View>

                    <View style={s.row}>
                        <View style={s.rowInfo}>
                            <Text style={s.rowTitle}>Notifications SMS</Text>
                            <Text style={s.rowDescription}>Réception des alertes importantes par SMS.</Text>
                        </View>
                        <Switch
                            value={smsEnabled}
                            onValueChange={setSmsEnabled}
                            trackColor={{ false: theme.border, true: `${theme.primary}99` }}
                            thumbColor={smsEnabled ? theme.primary : theme.textSecondary}
                        />
                    </View>
                </View>

                <TouchableOpacity style={[s.saveButton, saving && s.saveButtonDisabled]} onPress={handleSave} disabled={saving}>
                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveButtonText}>Enregistrer</Text>}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = (theme: ReturnType<typeof useTheme>) =>
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
        backButton: {
            width: 36,
            height: 36,
            alignItems: 'center',
            justifyContent: 'center',
        },
        title: { fontSize: 17, fontWeight: '700', color: theme.text },
        content: { padding: 14, gap: 14 },
        card: {
            backgroundColor: theme.surface,
            borderRadius: 14,
            padding: 14,
            gap: 16,
        },
        row: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
        },
        rowInfo: { flex: 1 },
        rowTitle: { fontSize: 14, fontWeight: '700', color: theme.text },
        rowDescription: { fontSize: 12, color: theme.textSecondary, marginTop: 2, lineHeight: 18 },
        saveButton: {
            backgroundColor: theme.primary,
            borderRadius: 12,
            alignItems: 'center',
            paddingVertical: 14,
        },
        saveButtonDisabled: { opacity: 0.6 },
        saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    });
