import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch, getErrorMessage } from '@/lib/api';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

interface ProductCreateResponse {
    success: boolean;
    product: {
        id: string;
    };
}

interface Category {
    id: string;
    name: string;
    sort_order?: number;
}

export default function NewProductScreen() {
    const { session, profile } = useAuth();
    const router = useRouter();
    const theme = useTheme();
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [showCategorySelector, setShowCategorySelector] = useState(false);

    const parsedPrice = Number.parseInt(price, 10);
    const canSubmit = name.trim().length > 0 && Number.isFinite(parsedPrice) && parsedPrice > 0 && !saving;

    // Load categories
    useEffect(() => {
        if (!profile?.restaurantId) return;

        const loadCategories = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('product_categories')
                    .select('id, name, sort_order')
                    .eq('restaurant_id', profile.restaurantId)
                    .order('sort_order', { ascending: true });

                if (error) throw error;
                setCategories(data || []);
            } catch (error) {
                console.error('Erreur lors du chargement des catégories:', error);
            } finally {
                setLoading(false);
            }
        };

        loadCategories();
    }, [profile?.restaurantId]);

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled) {
                setSelectedImage(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de sélectionner une image');
        }
    };

    const uploadImage = async (imageUri: string): Promise<string | null> => {
        try {
            if (!profile?.restaurantId) return null;

            const filename = `products/${profile.restaurantId}/${Date.now()}.jpg`;
            const response = await fetch(imageUri);
            const blob = await response.blob();

            const { data, error } = await supabase.storage
                .from('images')
                .upload(filename, blob, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (error) throw error;

            // Get public URL
            const { data: urlData } = supabase.storage.from('images').getPublicUrl(filename);
            return urlData?.publicUrl || null;
        } catch (error) {
            console.error('Erreur lors de l\'upload:', error);
            return null;
        }
    };

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
            let imageUrl: string | null = null;

            // Upload image if selected
            if (selectedImage) {
                imageUrl = await uploadImage(selectedImage);
            }

            await apiFetch<ProductCreateResponse>('/api/products', session.access_token, {
                method: 'POST',
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim() || null,
                    price: parsedPrice,
                    image_url: imageUrl,
                    category_id: selectedCategoryId || null,
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

    const selectedCategoryName = categories.find(c => c.id === selectedCategoryId)?.name;
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
                        Ajoutez un produit avec un nom, une catégorie et un prix pour accélérer la prise de commande.
                    </Text>

                    {/* Image Upload */}
                    <Text style={s.label}>Photo du produit</Text>
                    <TouchableOpacity style={s.imageButton} onPress={pickImage} disabled={saving}>
                        {selectedImage ? (
                            <>
                                <Image source={{ uri: selectedImage }} style={s.imagePreview} />
                                <View style={s.imageEditOverlay}>
                                    <Ionicons name="pencil" size={20} color="#fff" />
                                </View>
                            </>
                        ) : (
                            <View style={s.imagePlaceholder}>
                                <Ionicons name="image-outline" size={40} color={theme.textSecondary} />
                                <Text style={s.imageText}>Ajouter une photo</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Category Selection */}
                    <Text style={s.label}>Catégorie</Text>
                    {loading ? (
                        <ActivityIndicator color={theme.primary} size="small" />
                    ) : (
                        <TouchableOpacity
                            style={s.categoryButton}
                            onPress={() => setShowCategorySelector(!showCategorySelector)}
                            disabled={saving}
                        >
                            <Text style={[s.categoryButtonText, !selectedCategoryId && s.categoryButtonPlaceholder]}>
                                {selectedCategoryName || 'Sélectionner une catégorie'}
                            </Text>
                            <Ionicons
                                name={showCategorySelector ? 'chevron-up' : 'chevron-down'}
                                size={20}
                                color={theme.text}
                            />
                        </TouchableOpacity>
                    )}

                    {showCategorySelector && (
                        <View style={s.categoryList}>
                            {categories.length === 0 ? (
                                <Text style={s.noCategoriesText}>Aucune catégorie trouvée</Text>
                            ) : (
                                categories.map(cat => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[
                                            s.categoryOption,
                                            selectedCategoryId === cat.id && s.categoryOptionSelected,
                                        ]}
                                        onPress={() => {
                                            setSelectedCategoryId(cat.id);
                                            setShowCategorySelector(false);
                                        }}
                                    >
                                        <Text
                                            style={[
                                                s.categoryOptionText,
                                                selectedCategoryId === cat.id && s.categoryOptionTextSelected,
                                            ]}
                                        >
                                            {cat.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))
                            )}
                        </View>
                    )}

                    {/* Name */}
                    <Text style={s.label}>Nom du produit *</Text>
                    <TextInput
                        style={s.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Ex: Poulet DG"
                        placeholderTextColor={theme.textSecondary}
                        returnKeyType="next"
                        autoCapitalize="sentences"
                        editable={!saving}
                    />

                    {/* Description */}
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
                        editable={!saving}
                    />

                    {/* Price */}
                    <Text style={s.label}>Prix (FCFA) *</Text>
                    <TextInput
                        style={s.input}
                        value={price}
                        onChangeText={(value) => setPrice(value.replace(/[^0-9]/g, ''))}
                        placeholder="Ex: 2500"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="number-pad"
                        editable={!saving}
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
        imageButton: {
            borderWidth: 2,
            borderColor: theme.border,
            borderStyle: 'dashed',
            borderRadius: 12,
            minHeight: 120,
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            backgroundColor: theme.background,
        },
        imagePreview: {
            width: '100%',
            height: 120,
        },
        imagePlaceholder: {
            alignItems: 'center',
            gap: 8,
        },
        imageText: {
            color: theme.textSecondary,
            fontSize: 13,
        },
        imageEditOverlay: {
            position: 'absolute',
            backgroundColor: 'rgba(0,0,0,0.5)',
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
        },
        categoryButton: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
            backgroundColor: theme.background,
        },
        categoryButtonText: {
            fontSize: 15,
            color: theme.text,
            flex: 1,
        },
        categoryButtonPlaceholder: {
            color: theme.textSecondary,
        },
        categoryList: {
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 8,
            marginTop: 8,
            overflow: 'hidden',
        },
        categoryOption: {
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        categoryOptionSelected: {
            backgroundColor: theme.primary + '15',
        },
        categoryOptionText: {
            fontSize: 15,
            color: theme.text,
        },
        categoryOptionTextSelected: {
            color: theme.primary,
            fontWeight: '600',
        },
        noCategoriesText: {
            color: theme.textSecondary,
            fontSize: 13,
            padding: 14,
            textAlign: 'center',
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
