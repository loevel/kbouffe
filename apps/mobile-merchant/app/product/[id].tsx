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
    const { session } = useAuth();
    const router = useRouter();
    const theme = useTheme();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const parsedPrice = Number.parseInt(price, 10);
    const canSubmit = name.trim().length > 0 && Number.isFinite(parsedPrice) && parsedPrice > 0 && !saving;

    useEffect(() => {
        if (!session || !id) {
            setLoading(false);
            return;
        }

        apiFetch<{ product: Product }>(`/api/products/${id}`, session.access_token)
            .then((data) => {
                setProduct(data.product);
                setName(data.product.name);
                setDescription(data.product.description ?? '');
                setPrice(String(data.product.price));
            })
            .catch((error) => Alert.alert('Erreur', getErrorMessage(error, 'Impossible de charger le produit')))
            .finally(() => setLoading(false));
    }, [id, session]);

    const handleSave = async () => {
        if (!session) {
            Alert.alert('Session expirée', 'Reconnectez-vous pour modifier ce produit.');
            return;
        }
        const parsedPrice = Number.parseInt(price, 10);
        if (!name.trim() || Number.isNaN(parsedPrice) || parsedPrice <= 0) {
            Alert.alert('Validation', 'Veuillez renseigner un nom et un prix valide.');
            return;
        }

        setSaving(true);
        try {
            await apiFetch<{ success: boolean; product: Product }>(`/api/products/${id}`, session.access_token, {
                method: 'PATCH',
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim() || null,
                    price: parsedPrice,
                }),
            });
            Alert.alert('Succès', 'Produit mis à jour');
            router.back();
        } catch (error) {
            Alert.alert('Erreur', getErrorMessage(error, 'Impossible de mettre à jour le produit'));
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

    if (!product) {
        return (
            <SafeAreaView style={s.container} edges={['top']}>
                <View style={s.header}>
                    <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
                        <Ionicons name="arrow-back" size={22} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={s.title}>Produit</Text>
                    <View style={s.backButton} />
                </View>
                <View style={s.center}>
                    <Text style={s.errorText}>Produit introuvable</Text>
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
                <Text style={s.title}>Modifier le produit</Text>
                <View style={s.backButton} />
            </View>

            <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
                <View style={s.card}>
                    <View
                        style={[
                            s.statusBadge,
                            { backgroundColor: product.is_available ? `${theme.success}20` : `${theme.error}20` },
                        ]}
                    >
                        <Text style={[s.statusText, { color: product.is_available ? theme.success : theme.error }]}>
                            {product.is_available ? 'Disponible au menu' : 'Indisponible au menu'}
                        </Text>
                    </View>

                    <Text style={s.label}>Nom du produit *</Text>
                    <TextInput
                        style={s.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Nom du produit"
                        placeholderTextColor={theme.textSecondary}
                        autoCapitalize="sentences"
                    />

                    <Text style={s.label}>Description</Text>
                    <TextInput
                        style={[s.input, s.multiline]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Description du produit"
                        placeholderTextColor={theme.textSecondary}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />

                    <Text style={s.label}>Prix (FCFA) *</Text>
                    <TextInput
                        style={s.input}
                        value={price}
                        onChangeText={(value) => setPrice(value.replace(/[^0-9]/g, ''))}
                        placeholder="Prix en FCFA"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="number-pad"
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
        statusBadge: {
            alignSelf: 'flex-start',
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 5,
            marginBottom: 4,
        },
        statusText: { fontSize: 12, fontWeight: '700' },
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
