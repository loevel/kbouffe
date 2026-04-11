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
import { useAuth } from '@/contexts/auth-context';
import { apiFetch } from '@/lib/api';
import Colors from '@/constants/colors';

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
    const [category, setCategory] = useState<Category | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (!session) return;
        apiFetch(`/api/categories/${id}`, session.access_token)
            .then((data) => {
                setCategory(data.category);
                setName(data.category.name);
                setDescription(data.category.description ?? '');
            })
            .catch(() => Alert.alert('Erreur', 'Impossible de charger la catégorie'))
            .finally(() => setLoading(false));
    }, [id, session]);

    const handleSave = async () => {
        if (!session) return;
        setSaving(true);
        try {
            await apiFetch(`/api/categories/${id}`, session.access_token, {
                method: 'PATCH',
                body: JSON.stringify({ name, description: description || null }),
            });
            Alert.alert('Succès', 'Catégorie mise à jour');
            router.back();
        } catch {
            Alert.alert('Erreur', 'Impossible de mettre à jour la catégorie');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!category) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>Catégorie introuvable</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Modifier la catégorie</Text>

            <Text style={styles.label}>Nom</Text>
            <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Nom de la catégorie"
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
                style={[styles.input, styles.multiline]}
                value={description}
                onChangeText={setDescription}
                placeholder="Description (optionnel)"
                multiline
                numberOfLines={3}
            />

            <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
            >
                {saving ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.saveButtonText}>Enregistrer</Text>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    content: { padding: 20 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 24 },
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: '#111827',
        marginBottom: 16,
    },
    multiline: { minHeight: 80, textAlignVertical: 'top' },
    saveButton: {
        backgroundColor: Colors.primary,
        borderRadius: 12,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: 8,
    },
    saveButtonDisabled: { opacity: 0.6 },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    errorText: { fontSize: 16, color: '#6b7280' },
});
