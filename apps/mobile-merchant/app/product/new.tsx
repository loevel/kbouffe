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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch, getErrorMessage } from '@/lib/api';
import { useTheme } from '@/hooks/use-theme';

interface ProductCreateResponse {
    success: boolean;
    product: {
        id: string;
    };
}

export default function NewProductScreen() {
    const { session, profile } = useAuth();
    const router = useRouter();
    const theme = useTheme();
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const parsedPrice = Number.parseInt(price, 10);
    const canSubmit = name.trim().length > 0 && Number.isFinite(parsedPrice) && parsedPrice > 0 && !saving;

    const handleCreate = async () => {
        if (!session || !profile?.restaurantId) {
            Alert.alert('Session expirée', 'Reconnectez-vous pour créer un produit.');
            return;
        }
        const parsedPrice = Number.parseInt(price, 10);

        if (!name.trim() || Number.isNaN(parsedPrice) || parsedPrice <= 0) {
            Alert.alert('Erreur', 'Le nom et le prix sont obligatoires');
            return;
        }
        setSaving(true);
        try {
            await apiFetch<ProductCreateResponse>('/api/products', session.access_token, {
                method: 'POST',
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim() || null,
                    price: parsedPrice,
                    restaurant_id: profile.restaurantId,
                }),
            });
            Alert.alert('Succès', 'Produit créé');
            router.back();
        } catch (error) {
            Alert.alert('Erreur', getErrorMessage(error, 'Impossible de créer le produit'));
        } finally {
            setSaving(false);
        }
    };

    const s = styles(theme);

    return (
        <SafeAreaView style={s.container} edges={['top']}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={s.title}>Nouveau produit</Text>
                <View style={s.backButton} />
            </View>

            <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
                <View style={s.card}>
                    <Text style={s.helperText}>
                        Ajoutez un produit avec un nom clair et un prix exact pour accélérer la prise de commande.
                    </Text>

                    <Text style={s.label}>Nom du produit *</Text>
                    <TextInput
                        style={s.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Ex: Poulet DG"
                        placeholderTextColor={theme.textSecondary}
                        returnKeyType="next"
                        autoCapitalize="sentences"
                    />

                    <Text style={s.label}>Description</Text>
                    <TextInput
                        style={[s.input, s.multiline]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Ex: Poulet sauté aux légumes locaux"
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
                        placeholder="Ex: 2500"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="number-pad"
                    />
                </View>

                <TouchableOpacity
                    style={[s.saveButton, !canSubmit && s.saveButtonDisabled]}
                    onPress={handleCreate}
                    disabled={!canSubmit}
                >
                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveButtonText}>Créer le produit</Text>}
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
    });
