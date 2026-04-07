import { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, Image, ScrollView, Pressable, TextInput, ActivityIndicator, Alert, FlatList, NativeSyntheticEvent, NativeScrollEvent, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn, Layout, BounceIn } from 'react-native-reanimated';
import { useCart } from '@/contexts/cart-context';
import { useRestaurantCache } from '@/contexts/restaurant-context';
import { Colors, Spacing, Radii, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLoyalty } from '@/contexts/loyalty-context';
import { getProductReviews, submitProductReview, type ProductReview, type ProductReviewStats } from '@/lib/api';

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

    // Image gallery state
    const screenWidth = Dimensions.get('window').width;
    const allImages = product?.images && product.images.length > 0
        ? product.images
        : product?.image ? [product.image] : [];
    const [activeImgIdx, setActiveImgIdx] = useState(0);
    const imgFlatRef = useRef<FlatList>(null);
    const [quantity, setQuantity] = useState(1);

    const handleImageScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const idx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
        setActiveImgIdx(idx);
    };
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

    // Product reviews state
    const [reviews, setReviews] = useState<ProductReview[]>([]);
    const [reviewStats, setReviewStats] = useState<ProductReviewStats>({ count: 0, average: 0 });
    const [loadingReviews, setLoadingReviews] = useState(true);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewSubmitted, setReviewSubmitted] = useState(false);

    const loadReviews = useCallback(async () => {
        if (!productId) return;
        try {
            const data = await getProductReviews(productId);
            setReviews(data.reviews ?? []);
            setReviewStats(data.stats ?? { count: 0, average: 0 });
        } catch {
            // ignore
        } finally {
            setLoadingReviews(false);
        }
    }, [productId]);

    useEffect(() => { loadReviews(); }, [loadReviews]);

    const handleSubmitReview = async () => {
        if (!productId || !restaurantId || reviewRating < 1) return;
        setSubmittingReview(true);
        try {
            const res = await submitProductReview({
                productId,
                restaurantId,
                rating: reviewRating,
                comment: reviewComment.trim() || undefined,
            });
            if (res.success) {
                setReviewSubmitted(true);
                loadReviews();
            }
        } catch (err: any) {
            Alert.alert('Erreur', err?.message ?? "Impossible d'envoyer votre avis. Vérifiez votre connexion.");
        } finally {
            setSubmittingReview(false);
        }
    };

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
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        addItem(product as any, quantity, selectedOptions, restaurantId ?? '', restaurant?.name ?? '');
        router.back();
    };

    // Check if required options are selected
    const requiredMissing = product.options?.some(opt => opt.required && !selectedOptions[opt.name]) ?? false;

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Image gallery */}
                {allImages.length > 0 && (
                    <View style={styles.galleryContainer}>
                        <FlatList
                            ref={imgFlatRef}
                            data={allImages}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onScroll={handleImageScroll}
                            scrollEventThrottle={16}
                            keyExtractor={(_, i) => String(i)}
                            renderItem={({ item }) => (
                                <Image
                                    source={{ uri: item }}
                                    style={[styles.image, { width: screenWidth }]}
                                    resizeMode="cover"
                                />
                            )}
                        />
                        {allImages.length > 1 && (
                            <View style={styles.dotRow}>
                                {allImages.map((_, i) => (
                                    <Pressable
                                        key={i}
                                        onPress={() => imgFlatRef.current?.scrollToIndex({ index: i, animated: true })}
                                        style={[
                                            styles.dot,
                                            i === activeImgIdx ? styles.dotActive : styles.dotInactive,
                                        ]}
                                    />
                                ))}
                            </View>
                        )}
                        {allImages.length > 1 && (
                            <View style={styles.countBadge}>
                                <Text style={styles.countBadgeText}>{activeImgIdx + 1}/{allImages.length}</Text>
                            </View>
                        )}
                    </View>
                )}

                <Pressable
                    style={[styles.closeButton, { backgroundColor: theme.background, top: insets.top + Spacing.sm }]}
                    onPress={() => router.back()}
                >
                    <Ionicons name="close" size={24} color={theme.text} />
                </Pressable>

                <Pressable
                    style={[styles.favoriteButton, { backgroundColor: theme.background, top: insets.top + Spacing.sm }]}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        toggleProductFavorite(product.id);
                    }}
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
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            setSelectedOptions(prev => ({ ...prev, [option.name]: choice.label }));
                                        }}
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
                                style={({ pressed }) => [
                                    styles.quantityButton, 
                                    { borderColor: theme.border },
                                    pressed && { backgroundColor: theme.border + '50' }
                                ]}
                                onPress={() => {
                                    if (quantity > 1) {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setQuantity(quantity - 1);
                                    }
                                }}
                            >
                                <Ionicons name="remove" size={20} color={theme.text} />
                            </Pressable>
                            <Text style={[styles.quantityValue, { color: theme.text }]}>{quantity}</Text>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.quantityButton, 
                                    { borderColor: theme.border },
                                    pressed && { backgroundColor: theme.border + '50' }
                                ]}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setQuantity(quantity + 1);
                                }}
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

                    {/* Product Reviews */}
                    <View style={[styles.reviewsSection, { borderTopColor: theme.border }]}>
                        <View style={styles.reviewsHeader}>
                            <Text style={[styles.optionTitle, { color: theme.text }]}>
                                Avis ({reviewStats.count})
                            </Text>
                            {reviewStats.count > 0 && (
                                <View style={styles.ratingBadge}>
                                    <Ionicons name="star" size={14} color="#f59e0b" />
                                    <Text style={styles.ratingBadgeText}>{reviewStats.average.toFixed(1)}</Text>
                                </View>
                            )}
                        </View>

                        {/* Submit review */}
                        {!reviewSubmitted ? (
                            <View style={[styles.reviewForm, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <Text style={[styles.reviewFormLabel, { color: theme.text }]}>Donner votre avis</Text>
                                <View style={styles.starsRow}>
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Pressable key={s} onPress={() => setReviewRating(s)} hitSlop={4}>
                                            <Ionicons
                                                name={s <= reviewRating ? 'star' : 'star-outline'}
                                                size={28}
                                                color={s <= reviewRating ? '#f59e0b' : theme.icon}
                                            />
                                        </Pressable>
                                    ))}
                                </View>
                                <TextInput
                                    value={reviewComment}
                                    onChangeText={setReviewComment}
                                    placeholder="Partagez votre expérience (optionnel)..."
                                    placeholderTextColor={theme.icon}
                                    multiline
                                    style={[styles.reviewInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                />
                                <Pressable
                                    style={[styles.reviewSubmitButton, { backgroundColor: theme.primary, opacity: submittingReview ? 0.6 : 1 }]}
                                    onPress={handleSubmitReview}
                                    disabled={submittingReview}
                                >
                                    <Ionicons name="send" size={16} color="#fff" />
                                    <Text style={styles.reviewSubmitText}>{submittingReview ? 'Envoi...' : 'Envoyer'}</Text>
                                </Pressable>
                            </View>
                        ) : (
                            <View style={[styles.reviewSuccessBox, { borderColor: '#86efac' }]}>
                                <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                                <Text style={styles.reviewSuccessText}>Merci pour votre avis !</Text>
                            </View>
                        )}

                        {/* Reviews list */}
                        {loadingReviews ? (
                            <ActivityIndicator size="small" color={theme.primary} style={{ marginVertical: Spacing.lg }} />
                        ) : reviews.length === 0 ? (
                            <Text style={[styles.noReviewsText, { color: theme.icon }]}>
                                Aucun avis pour ce produit. Soyez le premier !
                            </Text>
                        ) : (
                            <View style={styles.reviewsList}>
                                {reviews.map((review) => (
                                    <View key={review.id} style={[styles.reviewCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                        <View style={styles.reviewCardHeader}>
                                            <View style={[styles.reviewAvatar, { backgroundColor: theme.primary + '20' }]}>
                                                <Text style={[styles.reviewAvatarText, { color: theme.primary }]}>
                                                    {review.customerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                </Text>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.reviewName, { color: theme.text }]}>{review.customerName}</Text>
                                                <View style={styles.reviewStarsRow}>
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <Ionicons
                                                            key={i}
                                                            name={i < review.rating ? 'star' : 'star-outline'}
                                                            size={12}
                                                            color={i < review.rating ? '#f59e0b' : theme.icon}
                                                        />
                                                    ))}
                                                </View>
                                            </View>
                                            <Text style={[styles.reviewDate, { color: theme.icon }]}>
                                                {new Date(review.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                            </Text>
                                        </View>
                                        {review.comment && (
                                            <Text style={[styles.reviewComment, { color: theme.text }]}>{review.comment}</Text>
                                        )}
                                    </View>
                                ))}
                            </View>
                        )}
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
    galleryContainer: { position: 'relative' },
    image: { height: 280 },
    dotRow: {
        position: 'absolute',
        bottom: 10,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    dot: { height: 6, borderRadius: 3 },
    dotActive: { width: 20, backgroundColor: 'rgba(255,255,255,0.95)' },
    dotInactive: { width: 6, backgroundColor: 'rgba(255,255,255,0.5)' },
    countBadge: {
        position: 'absolute',
        top: 10,
        left: 12,
        backgroundColor: 'rgba(0,0,0,0.45)',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    countBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
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
    // Reviews styles
    reviewsSection: {
        marginTop: Spacing.lg,
        paddingTop: Spacing.lg,
        borderTopWidth: 1,
    },
    reviewsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#fef3c7',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: Radii.full,
    },
    ratingBadgeText: {
        ...Typography.caption,
        fontWeight: '700',
        color: '#92400e',
    },
    reviewForm: {
        padding: Spacing.md,
        borderRadius: Radii.md,
        borderWidth: 1,
        marginBottom: Spacing.md,
    },
    reviewFormLabel: {
        ...Typography.caption,
        fontWeight: '600',
        marginBottom: Spacing.sm,
    },
    starsRow: {
        flexDirection: 'row',
        gap: Spacing.xs,
        marginBottom: Spacing.md,
    },
    reviewInput: {
        minHeight: 80,
        borderWidth: 1,
        borderRadius: Radii.md,
        padding: Spacing.md,
        ...Typography.body,
        textAlignVertical: 'top',
        marginBottom: Spacing.sm,
    },
    reviewSubmitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.xs,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: Radii.full,
        alignSelf: 'flex-start',
    },
    reviewSubmitText: {
        color: '#fff',
        ...Typography.caption,
        fontWeight: '700',
    },
    reviewSuccessBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        padding: Spacing.md,
        borderRadius: Radii.md,
        borderWidth: 1,
        backgroundColor: '#f0fdf4',
        marginBottom: Spacing.md,
    },
    reviewSuccessText: {
        ...Typography.caption,
        fontWeight: '600',
        color: '#16a34a',
    },
    noReviewsText: {
        ...Typography.caption,
        textAlign: 'center',
        paddingVertical: Spacing.lg,
    },
    reviewsList: {
        gap: Spacing.sm,
    },
    reviewCard: {
        padding: Spacing.md,
        borderRadius: Radii.md,
        borderWidth: 1,
        marginBottom: Spacing.sm,
    },
    reviewCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.xs,
    },
    reviewAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    reviewAvatarText: {
        fontSize: 11,
        fontWeight: '700',
    },
    reviewName: {
        ...Typography.caption,
        fontWeight: '600',
    },
    reviewStarsRow: {
        flexDirection: 'row',
        gap: 2,
        marginTop: 2,
    },
    reviewDate: {
        ...Typography.small,
    },
    reviewComment: {
        ...Typography.caption,
        lineHeight: 20,
        marginTop: Spacing.xs,
    },
});
