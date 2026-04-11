import { useRouter } from 'expo-router';
import { useState } from 'react';
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
import { PRIMARY } from '@/constants/colors';

export default function NewProductScreen() {
    const { session, restaurant } = useAuth();
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');

    const handleCreate = async () => {
        if (!session || !restaurant) return;
        if (!name.trim() || !price.trim()) {
            Alert.alert('Erreur', 'Le nom et le prix sont obligatoires');
            return;
        }
        setSaving(true);
        try {
            await apiFetch('/api/products', session.access_token, {
                method: 'POST',
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim() || null,
                    price: parseInt(price, 10),
                    restaurant_id: restaurant.id,
                }),
            });
            Alert.alert('Succès', 'Produit créé');
            router.back();
        } catch {
            Alert.alert('Erreur', 'Impossible de créer le produit');
        } finally {
            setSaving(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Nouveau produit</Text>

            <Text style={styles.label}>Nom *</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nom du produit" />

            <Text style={styles.label}>Description</Text>
            <TextInput
                style={[styles.input, styles.multiline]}
                value={description}
                onChangeText={setDescription}
                placeholder="Description (optionnel)"
                multiline
                numberOfLines={3}
            />

            <Text style={styles.label}>Prix (FCFA) *</Text>
            <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                placeholder="Ex: 2500"
                keyboardType="numeric"
            />

            <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleCreate}
                disabled={saving}
            >
                {saving ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.saveButtonText}>Créer le produit</Text>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    content: { padding: 20 },
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
        backgroundColor: PRIMARY,
        borderRadius: 12,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: 8,
    },
    saveButtonDisabled: { opacity: 0.6 },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
