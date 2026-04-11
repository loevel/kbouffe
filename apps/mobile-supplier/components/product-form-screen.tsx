import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { authApiFetch, uploadImage } from '@/lib/api';
import { CAMEROON_REGIONS, type SupplierProduct, type SupplierProductCategory, type SupplierProductUnit } from '@/lib/types';
import { formatFCFA } from '@/lib/format';
import { useAuth } from '@/contexts/auth-context';

const CATEGORIES: { value: SupplierProductCategory; label: string }[] = [
    { value: 'legumes', label: 'Légumes' },
    { value: 'fruits', label: 'Fruits' },
    { value: 'cereales', label: 'Céréales' },
    { value: 'viande', label: 'Viandes' },
    { value: 'poisson', label: 'Poissons' },
    { value: 'produits_laitiers', label: 'Produits laitiers' },
    { value: 'epices', label: 'Épices' },
    { value: 'huiles', label: 'Huiles' },
    { value: 'condiments', label: 'Condiments' },
    { value: 'autres', label: 'Autres' },
];

const UNITS: { value: SupplierProductUnit; label: string }[] = [
    { value: 'kg', label: 'kg' },
    { value: 'tonne', label: 'tonne' },
    { value: 'litre', label: 'litre' },
    { value: 'piece', label: 'pièce' },
    { value: 'botte', label: 'botte' },
    { value: 'sac', label: 'sac' },
    { value: 'colis', label: 'colis' },
    { value: 'caisse', label: 'caisse' },
];

interface Props {
    productId?: string;
}

export function ProductFormScreen({ productId }: Props) {
    const theme = useTheme();
    const router = useRouter();
    const { profile, session } = useAuth();
    const [loading, setLoading] = useState(!!productId);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [name, setName] = useState('');
    const [category, setCategory] = useState<SupplierProductCategory>('legumes');
    const [price, setPrice] = useState('');
    const [unit, setUnit] = useState<SupplierProductUnit>('kg');
    const [minOrderQuantity, setMinOrderQuantity] = useState('1');
    const [availableQuantity, setAvailableQuantity] = useState('');
    const [originRegion, setOriginRegion] = useState<string>(CAMEROON_REGIONS[0]);
    const [description, setDescription] = useState('');
    const [isOrganic, setIsOrganic] = useState(false);
    const [photos, setPhotos] = useState<string[]>([]);

    useEffect(() => {
        if (!productId) return;

        authApiFetch('/api/marketplace/suppliers/me/products')
            .then(async (response) => {
                const payload = await response.json();
                if (!response.ok) {
                    throw new Error(payload.error ?? 'Impossible de charger le produit');
                }

                const product = (payload.products as SupplierProduct[]).find((item) => item.id === productId);
                if (!product) {
                    throw new Error('Produit introuvable');
                }

                setName(product.name);
                setCategory(product.category);
                setPrice(String(product.price_per_unit));
                setUnit(product.unit);
                setMinOrderQuantity(String(product.min_order_quantity));
                setAvailableQuantity(product.available_quantity != null ? String(product.available_quantity) : '');
                setOriginRegion(product.origin_region ?? CAMEROON_REGIONS[0]);
                setDescription(product.description ?? '');
                setIsOrganic(product.is_organic);
                setPhotos(product.photos ?? []);
            })
            .catch((error: Error) => {
                Alert.alert('Erreur', error.message);
                router.back();
            })
            .finally(() => setLoading(false));
    }, [productId, router]);

    const formReady = useMemo(() => {
        return Boolean(name.trim() && category && price.trim() && unit && photos.length > 0);
    }, [category, name, photos.length, price, unit]);

    const pickPhoto = async () => {
        if (!session?.access_token) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (result.canceled) return;

        setUploading(true);
        try {
            const uploaded = await uploadImage(result.assets[0].uri, session.access_token);
            setPhotos((current) => {
                const next = [...current, uploaded.url];
                return next.slice(0, 5);
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erreur d’upload';
            Alert.alert('Upload impossible', message);
        } finally {
            setUploading(false);
        }
    };

    const removePhoto = (photo: string) => {
        setPhotos((current) => current.filter((item) => item !== photo));
    };

    const saveProduct = async () => {
        if (!formReady) {
            Alert.alert('Champs requis', 'Complétez le nom, le prix, l’unité et ajoutez au moins une photo.');
            return;
        }

        if (profile?.kyc_status !== 'approved') {
            Alert.alert('KYC requis', 'Votre dossier doit être approuvé avant de publier un produit.');
            return;
        }

        const payload = {
            name: name.trim(),
            category,
            price_per_unit: Number(price),
            unit,
            min_order_quantity: Number(minOrderQuantity || 1),
            available_quantity: availableQuantity ? Number(availableQuantity) : null,
            origin_region: originRegion,
            description: description.trim() || null,
            is_organic: isOrganic,
            photos,
        };

        if (!Number.isFinite(payload.price_per_unit) || payload.price_per_unit <= 0) {
            Alert.alert('Prix invalide', 'Le prix unitaire doit être supérieur à 0 FCFA.');
            return;
        }

        setSaving(true);
        try {
            const response = await authApiFetch(
                productId
                    ? `/api/marketplace/suppliers/supplier-products/${productId}`
                    : '/api/marketplace/suppliers/me/products',
                {
                    method: productId ? 'PATCH' : 'POST',
                    body: JSON.stringify(payload),
                },
            );
            const body = await response.json();

            if (!response.ok) {
                throw new Error(body.error ?? 'Enregistrement impossible');
            }

            Alert.alert('Succès', productId ? 'Produit mis à jour.' : 'Produit ajouté au catalogue.');
            router.replace('/(tabs)/products');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erreur serveur';
            Alert.alert('Erreur', message);
        } finally {
            setSaving(false);
        }
    };

    const styles = createStyles(theme);

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator color={theme.primary} size="large" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.headerRow}>
                    <Pressable style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={20} color={theme.text} />
                    </Pressable>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.title}>{productId ? 'Modifier le produit' : 'Nouveau produit'}</Text>
                        <Text style={styles.subtitle}>
                            {productId ? 'Mettez à jour votre fiche produit.' : 'Ajoutez un produit à votre catalogue fournisseur.'}
                        </Text>
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Informations clés</Text>

                    <Text style={styles.label}>Nom du produit</Text>
                    <TextInput
                        value={name}
                        onChangeText={setName}
                        placeholder="Ex. Tomates fraîches"
                        placeholderTextColor={theme.textSecondary}
                        style={styles.input}
                    />

                    <Text style={styles.label}>Prix unitaire</Text>
                    <TextInput
                        value={price}
                        onChangeText={setPrice}
                        placeholder="Ex. 2500"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="numeric"
                        style={styles.input}
                    />
                    <Text style={styles.hint}>
                        Aperçu : {formatFCFA(Number(price || 0))} / {unit}
                    </Text>

                    <Text style={styles.label}>Catégorie</Text>
                    <View style={styles.chips}>
                        {CATEGORIES.map((item) => (
                            <Pressable
                                key={item.value}
                                style={[styles.chip, category === item.value && styles.chipActive]}
                                onPress={() => setCategory(item.value)}
                            >
                                <Text style={[styles.chipText, category === item.value && styles.chipTextActive]}>
                                    {item.label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    <Text style={styles.label}>Unité</Text>
                    <View style={styles.chips}>
                        {UNITS.map((item) => (
                            <Pressable
                                key={item.value}
                                style={[styles.chip, unit === item.value && styles.chipActive]}
                                onPress={() => setUnit(item.value)}
                            >
                                <Text style={[styles.chipText, unit === item.value && styles.chipTextActive]}>
                                    {item.label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    <Text style={styles.label}>Quantité minimum</Text>
                    <TextInput
                        value={minOrderQuantity}
                        onChangeText={setMinOrderQuantity}
                        placeholder="1"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="numeric"
                        style={styles.input}
                    />

                    <Text style={styles.label}>Stock disponible</Text>
                    <TextInput
                        value={availableQuantity}
                        onChangeText={setAvailableQuantity}
                        placeholder="Ex. 120"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="numeric"
                        style={styles.input}
                    />

                    <Text style={styles.label}>Région d’origine</Text>
                    <View style={styles.chips}>
                        {CAMEROON_REGIONS.map((item) => (
                            <Pressable
                                key={item}
                                style={[styles.chip, originRegion === item && styles.chipActive]}
                                onPress={() => setOriginRegion(item)}
                            >
                                <Text style={[styles.chipText, originRegion === item && styles.chipTextActive]}>
                                    {item}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Décrivez la qualité, l’origine et la disponibilité."
                        placeholderTextColor={theme.textSecondary}
                        multiline
                        style={[styles.input, styles.textArea]}
                    />

                    <View style={styles.switchRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Produit bio</Text>
                            <Text style={styles.hint}>Activez cette option si votre produit est certifié bio.</Text>
                        </View>
                        <Switch value={isOrganic} onValueChange={setIsOrganic} trackColor={{ true: theme.primary }} />
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Photos</Text>
                    <Text style={styles.hint}>Au moins une photo est requise, jusqu’à 5 images.</Text>
                    <View style={styles.photos}>
                        {photos.map((photo) => (
                            <View key={photo} style={styles.photoCard}>
                                <Image source={{ uri: photo }} style={styles.photo} />
                                <Pressable style={styles.removeBadge} onPress={() => removePhoto(photo)}>
                                    <Ionicons name="close" size={14} color="#fff" />
                                </Pressable>
                            </View>
                        ))}
                        {photos.length < 5 && (
                            <Pressable style={styles.uploadCard} onPress={pickPhoto} disabled={uploading}>
                                {uploading ? (
                                    <ActivityIndicator color={theme.primary} />
                                ) : (
                                    <>
                                        <Ionicons name="image-outline" size={26} color={theme.primary} />
                                        <Text style={styles.uploadLabel}>Ajouter</Text>
                                    </>
                                )}
                            </Pressable>
                        )}
                    </View>
                </View>

                <Pressable style={[styles.primaryButton, (!formReady || saving) && styles.primaryButtonDisabled]} onPress={saveProduct} disabled={!formReady || saving}>
                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{productId ? 'Enregistrer' : 'Publier le produit'}</Text>}
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}

function createStyles(theme: ReturnType<typeof useTheme>) {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
        },
        centered: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.background,
        },
        content: {
            padding: 16,
            gap: 16,
        },
        headerRow: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 12,
        },
        backButton: {
            width: 40,
            height: 40,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: theme.border,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.card,
        },
        title: {
            fontSize: 24,
            fontWeight: '700',
            color: theme.text,
        },
        subtitle: {
            marginTop: 4,
            fontSize: 14,
            color: theme.textSecondary,
        },
        card: {
            padding: 16,
            borderRadius: 18,
            backgroundColor: theme.card,
            borderWidth: 1,
            borderColor: theme.border,
            gap: 10,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: '700',
            color: theme.text,
            marginBottom: 4,
        },
        label: {
            fontSize: 13,
            fontWeight: '700',
            color: theme.text,
            marginTop: 4,
        },
        hint: {
            fontSize: 12,
            color: theme.textSecondary,
        },
        input: {
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.background,
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 12,
            color: theme.text,
            fontSize: 15,
        },
        textArea: {
            minHeight: 100,
            textAlignVertical: 'top',
        },
        chips: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
        },
        chip: {
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.background,
        },
        chipActive: {
            backgroundColor: theme.primary,
            borderColor: theme.primary,
        },
        chipText: {
            color: theme.text,
            fontWeight: '600',
            fontSize: 13,
        },
        chipTextActive: {
            color: '#fff',
        },
        switchRow: {
            marginTop: 8,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
        },
        photos: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12,
        },
        photoCard: {
            width: 92,
            height: 92,
            borderRadius: 16,
            overflow: 'hidden',
            position: 'relative',
        },
        photo: {
            width: '100%',
            height: '100%',
        },
        removeBadge: {
            position: 'absolute',
            top: 6,
            right: 6,
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            alignItems: 'center',
            justifyContent: 'center',
        },
        uploadCard: {
            width: 92,
            height: 92,
            borderRadius: 16,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: theme.primary,
            backgroundColor: theme.primaryLight,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
        },
        uploadLabel: {
            color: theme.primary,
            fontWeight: '700',
        },
        primaryButton: {
            backgroundColor: theme.primary,
            paddingVertical: 16,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
        },
        primaryButtonDisabled: {
            opacity: 0.55,
        },
        primaryButtonText: {
            color: '#fff',
            fontSize: 16,
            fontWeight: '700',
        },
    });
}
