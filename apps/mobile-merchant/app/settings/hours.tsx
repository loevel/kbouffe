import React, { useCallback, useEffect, useState } from 'react';
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

type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

interface DayHours {
    isOpen: boolean;
    open: string;
    close: string;
}

type OpeningHours = Record<DayKey, DayHours>;

interface RestaurantHoursResponse {
    opening_hours: unknown;
}

const DAY_LABELS: Record<DayKey, string> = {
    monday: 'Lundi',
    tuesday: 'Mardi',
    wednesday: 'Mercredi',
    thursday: 'Jeudi',
    friday: 'Vendredi',
    saturday: 'Samedi',
    sunday: 'Dimanche',
};

const DEFAULT_HOURS: OpeningHours = {
    monday: { isOpen: true, open: '08:00', close: '22:00' },
    tuesday: { isOpen: true, open: '08:00', close: '22:00' },
    wednesday: { isOpen: true, open: '08:00', close: '22:00' },
    thursday: { isOpen: true, open: '08:00', close: '22:00' },
    friday: { isOpen: true, open: '08:00', close: '23:00' },
    saturday: { isOpen: true, open: '09:00', close: '23:00' },
    sunday: { isOpen: false, open: '09:00', close: '20:00' },
};

function normalizeOpeningHours(value: unknown): OpeningHours {
    if (!value || typeof value !== 'object') return DEFAULT_HOURS;

    const source = value as Record<string, unknown>;
    const parsed: OpeningHours = { ...DEFAULT_HOURS };

    (Object.keys(DEFAULT_HOURS) as DayKey[]).forEach((day) => {
        const row = source[day];
        if (!row || typeof row !== 'object') return;

        const dayValue = row as Record<string, unknown>;
        parsed[day] = {
            isOpen: typeof dayValue.isOpen === 'boolean' ? dayValue.isOpen : DEFAULT_HOURS[day].isOpen,
            open: typeof dayValue.open === 'string' ? dayValue.open : DEFAULT_HOURS[day].open,
            close: typeof dayValue.close === 'string' ? dayValue.close : DEFAULT_HOURS[day].close,
        };
    });

    return parsed;
}

function isValidTime(value: string) {
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

export default function OpeningHoursScreen() {
    const { session } = useAuth();
    const router = useRouter();
    const theme = useTheme();
    const [hours, setHours] = useState<OpeningHours>(DEFAULT_HOURS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const loadHours = useCallback(async () => {
        if (!session) {
            setLoading(false);
            return;
        }

        try {
            const restaurant = await apiFetch<RestaurantHoursResponse>('/api/restaurant', session.access_token);
            setHours(normalizeOpeningHours(restaurant.opening_hours));
        } catch (error) {
            Alert.alert('Erreur', getErrorMessage(error, 'Impossible de charger les horaires'));
        } finally {
            setLoading(false);
        }
    }, [session]);

    useEffect(() => {
        loadHours();
    }, [loadHours]);

    const updateDay = (day: DayKey, field: keyof DayHours, value: boolean | string) => {
        setHours((prev) => ({
            ...prev,
            [day]: { ...prev[day], [field]: value },
        }));
    };

    const handleSave = async () => {
        if (!session) return;

        for (const day of Object.keys(hours) as DayKey[]) {
            const row = hours[day];
            if (!row.isOpen) continue;
            if (!isValidTime(row.open) || !isValidTime(row.close)) {
                Alert.alert('Validation', `Heure invalide pour ${DAY_LABELS[day]}. Utilisez le format HH:MM.`);
                return;
            }
        }

        setSaving(true);
        try {
            await apiFetch('/api/restaurant', session.access_token, {
                method: 'PATCH',
                body: JSON.stringify({ opening_hours: hours }),
            });
            Alert.alert('Succès', 'Horaires mis à jour.');
            router.back();
        } catch (error) {
            Alert.alert('Erreur', getErrorMessage(error, 'Impossible de mettre à jour les horaires'));
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
                <Text style={s.title}>Horaires d&apos;ouverture</Text>
                <View style={s.backButton} />
            </View>

            <ScrollView contentContainerStyle={s.content}>
                {(Object.keys(hours) as DayKey[]).map((day) => (
                    <View key={day} style={s.dayCard}>
                        <View style={s.dayHeader}>
                            <Text style={s.dayLabel}>{DAY_LABELS[day]}</Text>
                            <Switch
                                value={hours[day].isOpen}
                                onValueChange={(value) => updateDay(day, 'isOpen', value)}
                                trackColor={{ false: theme.border, true: `${theme.primary}99` }}
                                thumbColor={hours[day].isOpen ? theme.primary : theme.textSecondary}
                            />
                        </View>

                        {hours[day].isOpen ? (
                            <View style={s.timeRow}>
                                <TextInput
                                    style={s.timeInput}
                                    value={hours[day].open}
                                    onChangeText={(value) => updateDay(day, 'open', value)}
                                    placeholder="08:00"
                                    placeholderTextColor={theme.textSecondary}
                                    maxLength={5}
                                />
                                <Text style={s.timeSeparator}>→</Text>
                                <TextInput
                                    style={s.timeInput}
                                    value={hours[day].close}
                                    onChangeText={(value) => updateDay(day, 'close', value)}
                                    placeholder="22:00"
                                    placeholderTextColor={theme.textSecondary}
                                    maxLength={5}
                                />
                            </View>
                        ) : (
                            <Text style={s.closedText}>Fermé</Text>
                        )}
                    </View>
                ))}

                <TouchableOpacity style={[s.saveButton, saving && s.saveButtonDisabled]} onPress={handleSave} disabled={saving}>
                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveButtonText}>Enregistrer</Text>}
                </TouchableOpacity>
            </ScrollView>
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
        content: { padding: 16, gap: 10, paddingBottom: 30 },
        dayCard: {
            backgroundColor: theme.surface,
            borderRadius: 14,
            padding: 14,
            gap: 10,
        },
        dayHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        dayLabel: { fontSize: 14, fontWeight: '700', color: theme.text },
        timeRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
        },
        timeInput: {
            flex: 1,
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: theme.text,
            backgroundColor: theme.background,
            fontSize: 15,
        },
        timeSeparator: { color: theme.textSecondary, fontWeight: '700' },
        closedText: { color: theme.textSecondary, fontSize: 12, fontWeight: '600' },
        saveButton: {
            marginTop: 10,
            backgroundColor: theme.primary,
            borderRadius: 12,
            alignItems: 'center',
            paddingVertical: 14,
        },
        saveButtonDisabled: { opacity: 0.6 },
        saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    });
