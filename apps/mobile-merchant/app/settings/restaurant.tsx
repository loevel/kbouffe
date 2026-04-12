import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
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

interface RestaurantSettings {
    id: string;
    name: string;
    phone: string | null;
    address: string | null;
    city: string | null;
    description: string | null;
}

export default function RestaurantSettingsScreen() {
    const { session } = useAuth();
    const router = useRouter();
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: '',
        phone: '',
        address: '',
        city: '',
        description: '',
    });

    const loadRestaurant = useCallback(async () => {
        if (!session) {
            setLoading(false);
            return;
        }

        try {
            const restaurant = await apiFetch<RestaurantSettings>('/api/restaurant', session.access_token);
            setForm({
                name: restaurant.name ?? '',
                phone: restaurant.phone ?? '',
                address: restaurant.address ?? '',
                city: restaurant.city ?? '',
                description: restaurant.description ?? '',
            });
        } catch (error) {
            Alert.alert('Erreur', getErrorMessage(error, 'Impossible de charger les informations du restaurant'));
        } finally {
            setLoading(false);
        }
    }, [session]);

    useEffect(() => {
        loadRestaurant();
    }, [loadRestaurant]);

    const updateField = (field: keyof typeof form, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!session) return;
        if (!form.name.trim()) {
            Alert.alert('Validation', 'Le nom du restaurant est obligatoire.');
            return;
        }

        setSaving(true);
        try {
            await apiFetch<RestaurantSettings>('/api/restaurant', session.access_token, {
                method: 'PATCH',
                body: JSON.stringify({
                    name: form.name.trim(),
                    phone: form.phone.trim() || null,
                    address: form.address.trim() || null,
                    city: form.city.trim() || null,
                    description: form.description.trim() || null,
                }),
            });
            Alert.alert('Succès', 'Informations du restaurant mises à jour.');
            router.back();
        } catch (error) {
            Alert.alert('Erreur', getErrorMessage(error, 'Impossible de sauvegarder les informations du restaurant'));
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
                <Text style={s.title}>Informations du restaurant</Text>
                <View style={s.backButton} />
            </View>

            <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
                <Text style={s.label}>Nom du restaurant *</Text>
                <TextInput
                    style={s.input}
                    value={form.name}
                    onChangeText={(value) => updateField('name', value)}
                    placeholder="Nom"
                    placeholderTextColor={theme.textSecondary}
                />

                <Text style={s.label}>Téléphone</Text>
                <TextInput
                    style={s.input}
                    value={form.phone}
                    onChangeText={(value) => updateField('phone', value)}
                    keyboardType="phone-pad"
                    placeholder="+237 6XX XX XX XX"
                    placeholderTextColor={theme.textSecondary}
                />

                <Text style={s.label}>Adresse</Text>
                <TextInput
                    style={s.input}
                    value={form.address}
                    onChangeText={(value) => updateField('address', value)}
                    placeholder="Adresse complète"
                    placeholderTextColor={theme.textSecondary}
                />

                <Text style={s.label}>Ville</Text>
                <TextInput
                    style={s.input}
                    value={form.city}
                    onChangeText={(value) => updateField('city', value)}
                    placeholder="Ville"
                    placeholderTextColor={theme.textSecondary}
                />

                <Text style={s.label}>Description</Text>
                <TextInput
                    style={[s.input, s.multiline]}
                    value={form.description}
                    onChangeText={(value) => updateField('description', value)}
                    placeholder="Décrivez votre restaurant"
                    placeholderTextColor={theme.textSecondary}
                    multiline
                    numberOfLines={4}
                />

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
        content: { padding: 16, paddingBottom: 32 },
        label: { fontSize: 13, fontWeight: '600', color: theme.text, marginBottom: 6, marginTop: 14 },
        input: {
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 15,
            color: theme.text,
            backgroundColor: theme.surface,
        },
        multiline: { minHeight: 96, textAlignVertical: 'top' },
        saveButton: {
            marginTop: 22,
            backgroundColor: theme.primary,
            borderRadius: 12,
            alignItems: 'center',
            paddingVertical: 14,
        },
        saveButtonDisabled: { opacity: 0.6 },
        saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    });
