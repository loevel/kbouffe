import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authApiFetch } from '@/lib/api';
import { formatFCFA } from '@/lib/format';
import { useFontScale, scaled } from '@/hooks/use-font-scale';
import type { SupplierKycStatus, SupplierProduct, SupplierProductCategory } from '@/lib/types';
import { useTheme } from '@/hooks/use-theme';

const CATEGORY_LABELS: Record<SupplierProductCategory, string> = {
    legumes: 'Légumes',
    fruits: 'Fruits',
    cereales: 'Céréales',
    viande: 'Viandes',
    poisson: 'Poissons',
    produits_laitiers: 'Produits laitiers',
    epices: 'Épices',
    huiles: 'Huiles',
    condiments: 'Condiments',
    autres: 'Autres',
};

function toErrorMessage(error: unknown, fallback: string) {
    return error instanceof Error ? error.message : fallback;
}

export default function ProductsScreen() {
    const router = useRouter();
    const theme = useTheme();
    const fontScale = useFontScale();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [products, setProducts] = useState<SupplierProduct[]>([]);
    const [kycStatus, setKycStatus] = useState<SupplierKycStatus>('pending');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const loadProducts = useCallback(async () => {
        const response = await authApiFetch('/api/marketplace/suppliers/me/products');
        const payload = (await response.json().catch(() => ({}))) as {
            error?: string;
            products?: SupplierProduct[];
            kyc_status?: SupplierKycStatus;
        };

        if (!response.ok) {
            throw new Error(payload.error ?? 'Impossible de charger les produits');
        }

        setProducts(payload.products ?? []);
        setKycStatus(payload.kyc_status ?? 'pending');
    }, []);

    useEffect(() => {
        let mounted = true;

        loadProducts()
            .then(() => {
                if (mounted) setErrorMessage(null);
            })
            .catch((error) => {
                if (!mounted) return;
                const message = toErrorMessage(error, 'Impossible de charger les produits');
                setErrorMessage(message);
                Alert.alert('Erreur', message);
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [loadProducts]);

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await loadProducts();
            setErrorMessage(null);
        } catch (error) {
            const message = toErrorMessage(error, 'Impossible de rafraîchir les produits');
            setErrorMessage(message);
            Alert.alert('Erreur', message);
        } finally {
            setRefreshing(false);
        }
    };

    const toggleProduct = async (product: SupplierProduct) => {
        try {
            const response = await authApiFetch(`/api/marketplace/suppliers/supplier-products/${product.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ is_active: !product.is_active, photos: product.photos }),
            });
            const payload = (await response.json().catch(() => ({}))) as {
                error?: string;
                product?: SupplierProduct;
            };

            if (!response.ok || !payload.product) {
                throw new Error(payload.error ?? 'Impossible de modifier le statut');
            }

            setProducts((current) => current.map((item) => (item.id === product.id ? payload.product! : item)));
        } catch (error) {
            Alert.alert('Erreur', toErrorMessage(error, 'Impossible de modifier le statut'));
        }
    };

    const deleteProduct = async (product: SupplierProduct) => {
        try {
            const response = await authApiFetch(`/api/marketplace/suppliers/supplier-products/${product.id}`, {
                method: 'DELETE',
            });
            const payload = (await response.json().catch(() => ({}))) as {
                error?: string;
            };

            if (!response.ok) {
                throw new Error(payload.error ?? 'Suppression impossible');
            }

            setProducts((current) => current.filter((item) => item.id !== product.id));
        } catch (error) {
            Alert.alert('Erreur', toErrorMessage(error, 'Suppression impossible'));
        }
    };

    const confirmDeleteProduct = (product: SupplierProduct) => {
        Alert.alert(
            'Supprimer le produit',
            `Voulez-vous supprimer "${product.name}" du catalogue ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: () => {
                        void deleteProduct(product);
                    },
                },
            ],
        );
    };

    const styles = createStyles(theme, fontScale);

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator color={theme.primary} size="large" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
            >
                <View style={styles.header}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.title}>Catalogue fournisseur</Text>
                        <Text style={styles.subtitle}>Publiez vos disponibilités et maintenez vos stocks à jour.</Text>
                    </View>
                    <Pressable
                        style={[styles.addButton, kycStatus !== 'approved' && styles.addButtonDisabled]}
                        onPress={() => router.push('/product/new')}
                        disabled={kycStatus !== 'approved'}
                    >
                        <Ionicons name="add" size={20} color="#fff" />
                    </Pressable>
                </View>

                {errorMessage ? (
                    <View style={styles.errorCard}>
                        <Text style={styles.errorTitle}>Synchronisation incomplète</Text>
                        <Text style={styles.errorText}>{errorMessage}</Text>
                    </View>
                ) : null}

                {kycStatus !== 'approved' ? (
                    <View style={styles.warningCard}>
                        <Text style={styles.warningTitle}>Ajout bloqué tant que le KYC n’est pas approuvé</Text>
                        <Text style={styles.warningText}>
                            Vous pouvez préparer votre dossier, mais la publication de nouveaux produits reste suspendue.
                        </Text>
                    </View>
                ) : null}

                {products.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyTitle}>Aucun produit publié</Text>
                        <Text style={styles.emptyText}>
                            Ajoutez votre premier produit pour apparaître dans l’espace d’approvisionnement KBouffe.
                        </Text>
                    </View>
                ) : (
                    products.map((product) => (
                        <View key={product.id} style={styles.card}>
                            <Pressable style={styles.cardMain} onPress={() => router.push(`/product/${product.id}`)}>
                                {product.photos?.[0] ? (
                                    <Image source={{ uri: product.photos[0] }} style={styles.image} />
                                ) : (
                                    <View style={styles.imagePlaceholder}>
                                        <Ionicons name="image-outline" size={22} color={theme.textSecondary} />
                                    </View>
                                )}
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.cardTitle}>{product.name}</Text>
                                    <Text style={styles.cardMeta}>
                                        {(CATEGORY_LABELS[product.category] ?? product.category)} · {formatFCFA(product.price_per_unit)} /{' '}
                                        {product.unit}
                                    </Text>
                                    <Text style={styles.cardMeta}>
                                        Stock : {product.available_quantity != null ? product.available_quantity : 'Non précisé'}
                                    </Text>
                                </View>
                            </Pressable>

                            <View style={styles.actions}>
                                <Pressable style={styles.outlineButton} onPress={() => toggleProduct(product)}>
                                    <Text style={styles.outlineButtonText}>{product.is_active ? 'Désactiver' : 'Activer'}</Text>
                                </Pressable>
                                <Pressable style={styles.outlineButton} onPress={() => router.push(`/product/${product.id}`)}>
                                    <Text style={styles.outlineButtonText}>Modifier</Text>
                                </Pressable>
                                <Pressable style={styles.deleteButton} onPress={() => confirmDeleteProduct(product)}>
                                    <Text style={styles.deleteButtonText}>Supprimer</Text>
                                </Pressable>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

function createStyles(theme: ReturnType<typeof useTheme>, fontScale: number) {
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
            gap: 14,
        },
        header: {
            flexDirection: 'row',
            gap: 12,
            alignItems: 'flex-start',
        },
        title: {
            fontSize: scaled(24, fontScale),
            fontWeight: '800',
            color: theme.text,
        },
        subtitle: {
            color: theme.textSecondary,
            lineHeight: 20,
            marginTop: 4,
        },
        addButton: {
            width: 46,
            height: 46,
            borderRadius: 23,
            backgroundColor: theme.primary,
            alignItems: 'center',
            justifyContent: 'center',
        },
        addButtonDisabled: {
            opacity: 0.5,
        },
        errorCard: {
            borderRadius: 18,
            padding: 16,
            backgroundColor: '#fee2e2',
            borderWidth: 1,
            borderColor: '#fecaca',
            gap: 4,
        },
        errorTitle: {
            color: '#b91c1c',
            fontWeight: '800',
            fontSize: scaled(14, fontScale),
        },
        errorText: {
            color: '#991b1b',
            lineHeight: 20,
        },
        warningCard: {
            borderRadius: 18,
            padding: 16,
            backgroundColor: theme.card,
            borderWidth: 1,
            borderColor: theme.border,
            gap: 6,
        },
        warningTitle: {
            color: theme.warning,
            fontWeight: '800',
            fontSize: scaled(15, fontScale),
        },
        warningText: {
            color: theme.textSecondary,
            lineHeight: 20,
        },
        emptyCard: {
            borderRadius: 20,
            backgroundColor: theme.card,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 20,
            gap: 6,
        },
        emptyTitle: {
            fontSize: scaled(18, fontScale),
            fontWeight: '700',
            color: theme.text,
        },
        emptyText: {
            color: theme.textSecondary,
            lineHeight: 20,
        },
        card: {
            borderRadius: 20,
            backgroundColor: theme.card,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 14,
            gap: 12,
        },
        cardMain: {
            flexDirection: 'row',
            gap: 12,
        },
        image: {
            width: 82,
            height: 82,
            borderRadius: 16,
        },
        imagePlaceholder: {
            width: 82,
            height: 82,
            borderRadius: 16,
            backgroundColor: theme.background,
            alignItems: 'center',
            justifyContent: 'center',
        },
        cardTitle: {
            color: theme.text,
            fontWeight: '800',
            fontSize: scaled(16, fontScale),
        },
        cardMeta: {
            color: theme.textSecondary,
            marginTop: 4,
            lineHeight: 18,
        },
        actions: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
        },
        outlineButton: {
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.border,
            paddingHorizontal: 12,
            paddingVertical: 10,
            backgroundColor: theme.background,
        },
        outlineButtonText: {
            color: theme.text,
            fontWeight: '700',
        },
        deleteButton: {
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
            backgroundColor: '#fee2e2',
        },
        deleteButtonText: {
            color: theme.error,
            fontWeight: '700',
        },
    });
}
