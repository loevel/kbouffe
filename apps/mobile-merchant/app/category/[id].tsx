import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { useAuth } from '@/contexts/auth-context';
import { apiFetch, getErrorMessage } from '@/lib/api';
import { useTheme } from '@/hooks/use-theme';

interface Category {
    id: string;
    name: string;
    description: string | null;
    position: number;
}

export default function CategoryDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { session } = useAuth();
    const router = useRouter();
    const theme = useTheme();
    const [category, setCategory] = useState<Category | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const canSubmit = name.trim().length > 0 && !saving;

    useEffect(() => {
        if (!session || !id) {
            setLoading(false);
            return;
        }

        apiFetch<{ categories: Category[] }>('/api/categories', session.access_token)
            .then((data) => {
                const found = (data.categories ?? []).find((item) => item.id === id) ?? null;
                setCategory(found);
                if (found) {
                    setName(found.name);
                    setDescription(found.description ?? '');
                }
            })
            .catch((error) => Alert.alert('Erreur', getErrorMessage(error, 'Impossible de charger la catégorie')))
            .finally(() => setLoading(false));
    }, [id, session]);

    const handleSave = async () => {
        if (!session) {
            Alert.alert('Session expirée', 'Reconnectez-vous pour modifier cette catégorie.');
            return;
        }
        if (!name.trim()) {
            Alert.alert('Validation', 'Le nom de la catégorie est obligatoire.');
            return;
        }

        setSaving(true);
        try {
            await apiFetch<{ success: boolean; category: Category }>(`/api/categories/${id}`, session.access_token, {
                method: 'PATCH',
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim() || null,
                }),
            });
            Alert.alert('Succès', 'Catégorie mise à jour');
            router.back();
        } catch (error) {
            Alert.alert('Erreur', getErrorMessage(error, 'Impossible de mettre à jour la catégorie'));
        } finally {
            setSaving(false);
        }
    };

    const s = styles(theme);

    if (loading) {
        return (
            <SafeAreaView style={s.container} edges={['top']}>
                <ActivityIndicator style={{ marginTop: 40 }} size="large" color={theme.primary} />
            </SafeAreaView>
        );
    }

    if (!category) {
        return (
            <SafeAreaView style={s.container} edges={['top']}>
                <View style={s.header}>
                    <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
                        <Ionicons name="arrow-back" size={22} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={s.title}>Catégorie</Text>
                    <View style={s.backButton} />
                </View>
                <View style={s.center}>
                    <Text style={s.errorText}>Catégorie introuvable</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={s.container} edges={['top']}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={s.title}>Modifier la catégorie</Text>
                <View style={s.backButton} />
            </View>

            <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
                <View style={s.card}>
                    <Text style={s.helperText}>
                        Regroupez vos produits avec des catégories courtes et explicites pour faciliter la navigation client.
                    </Text>

                    <Text style={s.label}>Nom de la catégorie *</Text>
                    <TextInput
                        style={s.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Ex: Grillades"
                        placeholderTextColor={theme.textSecondary}
                        autoCapitalize="sentences"
                    />

                    <Text style={s.label}>Description</Text>
                    <TextInput
                        style={[s.input, s.multiline]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Description optionnelle"
                        placeholderTextColor={theme.textSecondary}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                </View>

                <TouchableOpacity
                    style={[s.saveButton, !canSubmit && s.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={!canSubmit}
                >
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
        content: { padding: 16, gap: 14, paddingBottom: 32 },
        card: {
            backgroundColor: theme.surface,
            borderRadius: 14,
            padding: 14,
        },
        helperText: {
            fontSize: 12,
            lineHeight: 18,
            color: theme.textSecondary,
            marginBottom: 10,
        },
        label: {
            fontSize: 13,
            fontWeight: '600',
            color: theme.text,
            marginBottom: 6,
            marginTop: 12,
        },
        input: {
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 15,
            color: theme.text,
            backgroundColor: theme.background,
        },
        multiline: {
            minHeight: 96,
        },
        saveButton: {
            backgroundColor: theme.primary,
            borderRadius: 12,
            alignItems: 'center',
            paddingVertical: 14,
        },
        saveButtonDisabled: { opacity: 0.6 },
        saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
        center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
        errorText: { fontSize: 15, color: theme.textSecondary, textAlign: 'center' },
    });
