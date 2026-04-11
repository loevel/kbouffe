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

interface Product {
    id: string;
    name: string;
    description: string | null;
    price: number;
    category_id: string | null;
    is_available: boolean;
    image_url: string | null;
}

export default function ProductDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { session, restaurant } = useAuth();
    const router = useRouter();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');

    useEffect(() => {
        if (!session || !restaurant) return;
        apiFetch(`/api/products/${id}`, session.access_token)
            .then((data) => {
                setProduct(data.product);
                setName(data.product.name);
                setDescription(data.product.description ?? '');
                setPrice(String(data.product.price));
            })
            .catch(() => Alert.alert('Erreur', 'Impossible de charger le produit'))
            .finally(() => setLoading(false));
    }, [id, session, restaurant]);

    const handleSave = async () => {
        if (!session) return;
        setSaving(true);
        try {
            await apiFetch(`/api/products/${id}`, session.access_token, {
                method: 'PATCH',
                body: JSON.stringify({ name, description, price: parseInt(price, 10) }),
            });
            Alert.alert('Succès', 'Produit mis à jour');
            router.back();
        } catch {
            Alert.alert('Erreur', 'Impossible de mettre à jour le produit');
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

    if (!product) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>Produit introuvable</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Modifier le produit</Text>

            <Text style={styles.label}>Nom</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nom du produit" />

            <Text style={styles.label}>Description</Text>
            <TextInput
                style={[styles.input, styles.multiline]}
                value={description}
                onChangeText={setDescription}
                placeholder="Description"
                multiline
                numberOfLines={3}
            />

            <Text style={styles.label}>Prix (FCFA)</Text>
            <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                placeholder="Prix en FCFA"
                keyboardType="numeric"
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
