import { useState } from 'react';
import { StyleSheet, View, Text, Image, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '@/contexts/cart-context';
import { useRestaurantCache } from '@/contexts/restaurant-context';
import { Colors, Spacing, Radii, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLoyalty } from '@/contexts/loyalty-context';

export default function ProductModal() {
    const { productId, restaurantId } = useLocalSearchParams<{ productId: string; restaurantId: string }>();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const { addItem } = useCart();
    const { getProduct, getRestaurant } = useRestaurantCache();
    const { isProductFavorite, toggleProductFavorite } = useLoyalty();

    const product = getProduct(productId ?? '');
    const restaurant = getRestaurant();

    const [quantity, setQuantity] = useState(1);
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

    if (!product || !restaurant) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: theme.text }}>Produit non trouve.</Text>
                <Pressable onPress={() => router.back()} style={{ marginTop: Spacing.md }}>
                    <Text style={{ color: theme.primary }}>Retour</Text>
                </Pressable>
            </View>
        );
    }

    // Calculate total price
    let extraPrice = 0;
    if (product.options) {
        product.options.forEach(opt => {
            const selected = selectedOptions[opt.name];
            if (selected) {
                const choice = opt.choices.find(c => c.label === selected);
                if (choice) extraPrice += choice.extraPrice;
            }
        });
    }
    const unitPrice = product.price + extraPrice;
    const totalPrice = unitPrice * quantity;

    const handleAddToCart = () => {
        addItem(product as any, quantity, selectedOptions, restaurantId ?? '', restaurant?.name ?? '');
        router.back();
    };

    // Check if required options are selected
    const requiredMissing = product.options?.some(opt => opt.required && !selectedOptions[opt.name]) ?? false;

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {product.image && (
                    <Image source={{ uri: product.image }} style={styles.image} />
                )}

                <Pressable
                    style={[styles.closeButton, { backgroundColor: theme.background, top: insets.top + Spacing.sm }]}
                    onPress={() => router.back()}
                >
                    <Ionicons name="close" size={24} color={theme.text} />
                </Pressable>

                <Pressable
                    style={[styles.favoriteButton, { backgroundColor: theme.background, top: insets.top + Spacing.sm }]}
                    onPress={() => toggleProductFavorite(product.id)}
                >
                    <Ionicons name={isProductFavorite(product.id) ? 'heart' : 'heart-outline'} size={22} color={isProductFavorite(product.id) ? '#ef4444' : theme.text} />
                </Pressable>

                <View style={styles.content}>
                    <Text style={[styles.productName, { color: theme.text }]}>{product.name}</Text>
                    <Text style={[styles.productPrice, { color: theme.primary }]}>{product.price.toLocaleString()} FCFA</Text>
                    {product.description && (
                        <Text style={[styles.productDescription, { color: theme.icon }]}>{product.description}</Text>
                    )}

                    {/* Dietary Badges */}
                    {(product.is_halal || product.is_vegan || product.is_gluten_free) && (
                        <View style={styles.dietaryRow}>
                            {product.is_halal && (
                                <View style={[styles.badge, { backgroundColor: '#dcfce7' }]}>
                                    <View style={{ transform: [{ translateY: 1 }] }}>
                                        <Ionicons name="shield-checkmark" size={14} color="#166534" />
                                    </View>
                                    <Text style={[styles.badgeText, { color: '#166534' }]}>Halal</Text>
                                </View>
                            )}
                            {product.is_vegan && (
                                <View style={[styles.badge, { backgroundColor: '#dcfce7' }]}>
                                    <Ionicons name="leaf" size={14} color="#166534" />
                                    <Text style={[styles.badgeText, { color: '#166534' }]}>Vegan</Text>
                                </View>
                            )}
                            {product.is_gluten_free && (
                                <View style={[styles.badge, { backgroundColor: '#fef3c7' }]}>
                                    <Ionicons name="nutrition" size={14} color="#92400e" />
                                    <Text style={[styles.badgeText, { color: '#92400e' }]}>Sans Gluten</Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Allergens */}
                    {product.allergens && (
                        <View style={[styles.allergenBox, { backgroundColor: theme.primary + '10' }]}>
                            <Ionicons name="warning" size={16} color={theme.primary} />
                            <Text style={[styles.allergenText, { color: theme.text }]}>
                                <Text style={{ fontWeight: '700' }}>Allergènes: </Text>
                                {product.allergens}
                            </Text>
                        </View>
                    )}

                    {/* Options */}
                    {product.options?.map((option) => (
                        <View key={option.name} style={styles.optionSection}>
                            <View style={styles.optionHeader}>
                                <Text style={[styles.optionTitle, { color: theme.text }]}>{option.name}</Text>
                                {option.required && (
                                    <View style={[styles.requiredBadge, { backgroundColor: theme.primary + '20' }]}>
                                        <Text style={[styles.requiredText, { color: theme.primary }]}>Requis</Text>
                                    </View>
                                )}
                            </View>
                            {option.choices.map((choice) => {
                                const isSelected = selectedOptions[option.name] === choice.label;
                                return (
                                    <Pressable
                                        key={choice.label}
                                        style={[
                                            styles.choiceRow,
                                            { borderColor: isSelected ? theme.primary : theme.border },
                                        ]}
                                        onPress={() => setSelectedOptions(prev => ({ ...prev, [option.name]: choice.label }))}
                                    >
                                        <View style={[
                                            styles.radio,
                                            { borderColor: isSelected ? theme.primary : theme.border },
                                            isSelected && { backgroundColor: theme.primary },
                                        ]}>
                                            {isSelected && <View style={styles.radioInner} />}
                                        </View>
                                        <Text style={[styles.choiceLabel, { color: theme.text }]}>{choice.label}</Text>
                                        {choice.extraPrice > 0 && (
                                            <Text style={[styles.choicePrice, { color: theme.primary }]}>+{choice.extraPrice.toLocaleString()} FCFA</Text>
                                        )}
                                    </Pressable>
                                );
                            })}
                        </View>
                    ))}

                    {/* Quantity */}
                    <View style={styles.quantitySection}>
                        <Text style={[styles.optionTitle, { color: theme.text }]}>Quantite</Text>
                        <View style={styles.quantityRow}>
                            <Pressable
                                style={[styles.quantityButton, { borderColor: theme.border }]}
                                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                            >
                                <Ionicons name="remove" size={20} color={theme.text} />
                            </Pressable>
                            <Text style={[styles.quantityValue, { color: theme.text }]}>{quantity}</Text>
                            <Pressable
                                style={[styles.quantityButton, { borderColor: theme.border }]}
                                onPress={() => setQuantity(quantity + 1)}
                            >
                                <Ionicons name="add" size={20} color={theme.text} />
                            </Pressable>
                        </View>
                    </View>

                    {/* Health Disclaimer */}
                    <View style={[styles.disclaimerBox, { borderTopColor: theme.border }]}>
                        <Ionicons name="information-circle-outline" size={14} color={theme.icon} />
                        <Text style={[styles.disclaimerText, { color: theme.icon }]}>
                            Les informations sur les allergènes et les régimes alimentaires sont fournies par le restaurant. Kbouffe décline toute responsabilité en cas d'imprécision.
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Add to cart button */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.md), borderTopColor: theme.border }]}>
                <Pressable
                    style={[styles.addButton, { backgroundColor: theme.primary, opacity: requiredMissing ? 0.5 : 1 }]}
                    onPress={handleAddToCart}
                    disabled={requiredMissing}
                >
                    <Text style={styles.addButtonText}>Ajouter au panier</Text>
                    <Text style={styles.addButtonPrice}>{totalPrice.toLocaleString()} FCFA</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    image: { width: '100%', height: 280 },
    closeButton: {
        position: 'absolute',
        right: Spacing.md,
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    favoriteButton: {
        position: 'absolute',
        right: Spacing.md + 44,
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    content: { padding: Spacing.lg },
    productName: { ...Typography.title2, marginBottom: Spacing.xs },
    productPrice: { ...Typography.title3, marginBottom: Spacing.md },
    productDescription: { ...Typography.body, lineHeight: 22, marginBottom: Spacing.lg },
    optionTitle: { ...Typography.title3 },
    dietaryRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: Radii.sm,
        gap: 4,
    },
    badgeText: {
        ...Typography.small,
        fontWeight: '600',
    },
    allergenBox: {
        flexDirection: 'row',
        padding: Spacing.md,
        borderRadius: Radii.md,
        marginBottom: Spacing.lg,
        alignItems: 'center',
        gap: Spacing.sm,
    },
    allergenText: {
        ...Typography.caption,
        flex: 1,
    },
    optionSection: { marginBottom: Spacing.lg },
    optionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
    requiredBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radii.full },
    requiredText: { ...Typography.small, fontWeight: '600' },
    choiceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: Radii.md,
        borderWidth: 1,
        marginBottom: Spacing.sm,
        gap: Spacing.sm,
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#fff',
    },
    choiceLabel: { ...Typography.body, flex: 1 },
    choicePrice: { ...Typography.caption, fontWeight: '600' },
    quantitySection: { marginTop: Spacing.md },
    quantityRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, marginTop: Spacing.md },
    quantityButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quantityValue: { ...Typography.title3, minWidth: 30, textAlign: 'center' },
    footer: {
        padding: Spacing.md,
        borderTopWidth: 1,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
        borderRadius: Radii.full,
    },
    addButtonText: { color: '#fff', ...Typography.body, fontWeight: '700' },
    addButtonPrice: { color: '#fff', ...Typography.body, fontWeight: '700' },
    disclaimerBox: {
        flexDirection: 'row',
        paddingTop: Spacing.md,
        marginTop: Spacing.md,
        borderTopWidth: 1,
        gap: Spacing.xs,
        alignItems: 'flex-start',
    },
    disclaimerText: {
        ...Typography.small,
        flex: 1,
        lineHeight: 18,
    },
});
