import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useCart } from '@/contexts/cart-context';
import { useOrders } from '@/contexts/orders-context';
import { useRestaurantCache } from '@/contexts/restaurant-context';
import { useAuth } from '@/contexts/auth-context';
import { placeOrder, type PlaceOrderParams, getAddresses, type Address as AddressType } from '@/lib/api';
import { Colors, Spacing, Radii, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLoyalty } from '@/contexts/loyalty-context';

type DeliveryType = 'delivery' | 'pickup' | 'dine_in';
type PaymentType = 'momo_mtn' | 'momo_orange' | 'cash';

const paymentMethods = [
    { id: 'momo_mtn' as PaymentType, label: 'MTN Mobile Money', icon: 'phone-portrait-outline' as const, color: '#f4c80f' },
    { id: 'momo_orange' as PaymentType, label: 'Orange Money', icon: 'phone-portrait-outline' as const, color: '#f97316' },
    { id: 'cash' as PaymentType, label: 'Especes a la livraison', icon: 'cash-outline' as const, color: '#10b981' },
];

export default function CheckoutScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const { items, restaurantId, restaurantName, subtotal, deliveryFee, total, clearCart } = useCart();
    const { refreshOrders } = useOrders();
    const { getRestaurant } = useRestaurantCache();
    const { user } = useAuth();
    const { validatePromotion } = useLoyalty();

    const [deliveryType, setDeliveryType] = useState<DeliveryType>('delivery');
    const [addresses, setAddresses] = useState<AddressType[]>([]);
    const [selectedAddress, setSelectedAddress] = useState<AddressType | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<PaymentType>('momo_mtn');
    const [notes, setNotes] = useState('');
    const [tableNumber, setTableNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [promoCode, setPromoCode] = useState('');
    const [promoLoading, setPromoLoading] = useState(false);
    const [promoError, setPromoError] = useState<string | null>(null);
    const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null);

    useEffect(() => {
        if (deliveryType === 'delivery') {
            getAddresses().then(list => {
                setAddresses(list);
                if (list.length > 0) setSelectedAddress(list.find(a => a.isDefault) || list[0]);
            });
        }
    }, [deliveryType]);
 
    const restaurant = getRestaurant();
    const actualDeliveryFee = deliveryType === 'delivery' 
        ? (restaurant?.deliveryBaseFee ?? deliveryFee) 
        : 0;

    const effectiveTotal = (subtotal + actualDeliveryFee) - (appliedPromo?.discount ?? 0);

    const handleApplyPromo = async () => {
        if (!promoCode.trim()) return;
        setPromoLoading(true);
        setPromoError(null);

        try {
            const result = await validatePromotion({
                code: promoCode.trim().toUpperCase(),
                restaurantId: restaurantId ?? '',
                orderTotal: deliveryType === 'delivery' ? total : subtotal,
                deliveryType,
            });

            if (result.valid) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setAppliedPromo({ code: promoCode.trim().toUpperCase(), discount: result.discount });
                setPromoCode('');
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                setPromoError(result.reason);
                setAppliedPromo(null);
            }
        } catch (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setPromoError('Erreur de validation. Veuillez reessayer.');
        } finally {
            setPromoLoading(false);
        }
    };

    const handleOrder = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setLoading(true);
        try {
            const paymentMap: Record<PaymentType, PlaceOrderParams['paymentMethod']> = {
                momo_mtn: 'mobile_money_mtn',
                momo_orange: 'mobile_money_orange',
                cash: 'cash',
            };

            const orderItems: PlaceOrderParams['items'] = items.map(item => {
                const itemOptions: PlaceOrderParams['items'][0]['options'] = [];
                
                if (item.product.options) {
                    item.product.options.forEach(opt => {
                        const selectedChoice = item.selectedOptions[opt.name];
                        if (selectedChoice) {
                            const choice = opt.choices.find(c => c.label === selectedChoice);
                            if (choice) {
                                itemOptions.push({
                                    name: opt.name,
                                    value: selectedChoice,
                                    priceAdjustment: choice.extraPrice,
                                    // optionId/valueId might be missing in MobileProduct, 
                                    // but we can pass them if they exist in the future
                                });
                            }
                        }
                    });
                }

                return {
                    productId: item.product.id,
                    name: item.product.name,
                    price: item.unitPrice,
                    quantity: item.quantity,
                    options: itemOptions.length > 0 ? itemOptions : undefined,
                };
            });

            const deliveryAddress = (deliveryType === 'delivery' && selectedAddress)
                ? `${selectedAddress.label} — ${selectedAddress.address}, ${selectedAddress.city}`
                : undefined;
 
                const res = await placeOrder({
                restaurantId: restaurantId ?? '',
                items: orderItems,
                deliveryType,
                deliveryAddress,
                tableNumber: deliveryType === 'dine_in' ? tableNumber || undefined : undefined,
                customerName: user?.fullName ?? 'Client',
                customerPhone: user?.phone ?? '',
                paymentMethod: paymentMap[paymentMethod],
                subtotal,
                deliveryFee: actualDeliveryFee,
                total: subtotal + actualDeliveryFee - (appliedPromo?.discount ?? 0),
                notes: notes.trim() || undefined,
            });

            // ── MoMo MTN: show payment-pending waiting screen ──────────────────
            if (paymentMethod === 'momo_mtn') {
                if (res.payment?.status === 'failed') {
                    // Payment initiation failed — still send user to confirmation
                    // but warn them the MoMo push never arrived.
                    Alert.alert(
                        'Paiement MTN non initié',
                        res.payment.error ?? 'La commande est créée mais la demande MTN MoMo a échoué. Vous pouvez régler à la livraison.',
                    );
                    await refreshOrders();
                    clearCart();
                    router.replace({ pathname: '/order-confirmation', params: { orderId: res.orderId } });
                } else {
                    // Push sent — navigate to the waiting screen
                    await refreshOrders();
                    clearCart();
                    router.replace({
                        pathname: '/payment-pending',
                        params: {
                            orderId: res.orderId,
                            amount: String(effectiveTotal),
                            phone: user?.phone ?? '',
                        },
                    });
                }
                return; // skip generic navigation below
            }

            await refreshOrders();

            clearCart();
            router.replace({ pathname: '/order-confirmation', params: { orderId: res.orderId } });
        } catch (err) {
            Alert.alert('Erreur', err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez reessayer.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Pressable
                    onPress={() => router.back()}
                    accessibilityRole="button"
                    accessibilityLabel="Retour"
                    hitSlop={8}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Finaliser la commande</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Delivery type */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Mode de reception</Text>
                <View style={styles.toggleRow}>
                    {(['delivery', 'pickup', 'dine_in'] as DeliveryType[]).map(type => (
                                                    <Pressable
                                                        key={type}
                                                        style={[
                                                            styles.toggleButton,
                                                            { borderColor: deliveryType === type ? theme.primary : theme.border },
                                                            deliveryType === type && { backgroundColor: theme.primary + '10' },
                                                        ]}
                                                        onPress={() => {
                                                            Haptics.selectionAsync();
                                                            setDeliveryType(type);
                                                        }}
                                                        accessibilityRole="button"                            accessibilityLabel={`Mode ${type === 'delivery' ? 'livraison' : type === 'pickup' ? 'retrait' : 'sur place'}`}
                            accessibilityState={{ selected: deliveryType === type }}
                        >
                            <Ionicons
                                name={
                                    type === 'delivery'
                                        ? 'bicycle-outline'
                                        : type === 'pickup'
                                            ? 'storefront-outline'
                                            : 'restaurant-outline'
                                }
                                size={20}
                                color={deliveryType === type ? theme.primary : theme.icon}
                            />
                            <Text style={[styles.toggleLabel, { color: deliveryType === type ? theme.primary : theme.text }]}>
                                {type === 'delivery' ? 'Livraison' : type === 'pickup' ? 'Retrait' : 'Sur place'}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                {deliveryType === 'dine_in' && (
                    <>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Table</Text>
                        <TextInput
                            style={[styles.notesInput, { borderColor: theme.border, color: theme.text, minHeight: 52 }]}
                            placeholder="Numéro de table (ex: T12)"
                            placeholderTextColor={theme.icon}
                            value={tableNumber}
                            onChangeText={setTableNumber}
                            autoCapitalize="characters"
                            maxLength={8}
                        />
                    </>
                )}

                {/* Address */}
                {deliveryType === 'delivery' && (
                    <>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Adresse de livraison</Text>
                        {addresses.map(addr => (
                            <Pressable
                                key={addr.id}
                                style={[
                                    styles.addressCard,
                                    { borderColor: selectedAddress?.id === addr.id ? theme.primary : theme.border },
                                    selectedAddress?.id === addr.id && { backgroundColor: theme.primary + '08' },
                                ]}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    setSelectedAddress(addr);
                                }}
                            >
                                <Ionicons name="location-outline" size={20} color={selectedAddress?.id === addr.id ? theme.primary : theme.icon} />
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.addressLabel, { color: theme.text }]}>{addr.label}</Text>
                                    <Text style={[styles.addressText, { color: theme.icon }]}>{addr.address}, {addr.city}</Text>
                                </View>
                                {selectedAddress?.id === addr.id && (
                                    <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                                )}
                            </Pressable>
                        ))}
                    </>
                )}

                {/* Payment */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Mode de paiement</Text>
                {paymentMethods.map(pm => (
                    <Pressable
                        key={pm.id}
                        style={[
                            styles.paymentCard,
                            { borderColor: paymentMethod === pm.id ? theme.primary : theme.border },
                            paymentMethod === pm.id && { backgroundColor: theme.primary + '08' },
                        ]}
                        onPress={() => {
                            Haptics.selectionAsync();
                            setPaymentMethod(pm.id);
                        }}
                    >
                        <View style={[styles.paymentIcon, { backgroundColor: pm.color + '20' }]}>
                            <Ionicons name={pm.icon} size={20} color={pm.color} />
                        </View>
                        <Text style={[styles.paymentLabel, { color: theme.text }]}>{pm.label}</Text>
                        {paymentMethod === pm.id && (
                            <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                        )}
                    </Pressable>
                ))}

                {/* Notes */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Notes (optionnel)</Text>
                <TextInput
                    style={[styles.notesInput, { borderColor: theme.border, color: theme.text }]}
                    placeholder="Instructions speciales pour le restaurant..."
                    placeholderTextColor={theme.icon}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                />

                {/* Promo code */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Code promo</Text>
                {appliedPromo ? (
                    <View style={[styles.promoApplied, { backgroundColor: '#10b981' + '15', borderColor: '#10b981' }]}>
                        <Ionicons name="pricetag-outline" size={18} color="#10b981" />
                        <Text style={[styles.promoAppliedText, { color: '#10b981' }]}>
                            {appliedPromo.code} — -{appliedPromo.discount.toLocaleString()} FCFA
                        </Text>
                        <Pressable onPress={() => setAppliedPromo(null)}>
                            <Ionicons name="close-circle" size={18} color="#10b981" />
                        </Pressable>
                    </View>
                ) : (
                    <>
                        <View style={styles.promoRow}>
                            <TextInput
                                style={[styles.promoInput, { borderColor: promoError ? '#ef4444' : theme.border, color: theme.text }]}
                                placeholder="Entrez votre code promo"
                                placeholderTextColor={theme.icon}
                                value={promoCode}
                                onChangeText={t => { setPromoCode(t); setPromoError(null); }}
                                autoCapitalize="characters"
                                autoCorrect={false}
                            />
                            <Pressable
                                style={[styles.promoButton, { backgroundColor: theme.primary, opacity: promoLoading || !promoCode.trim() ? 0.6 : 1 }]}
                                onPress={handleApplyPromo}
                                disabled={promoLoading || !promoCode.trim()}
                                accessibilityRole="button"
                                accessibilityLabel="Appliquer le code promo"
                            >
                                <Text style={styles.promoButtonText}>{promoLoading ? '...' : 'Appliquer'}</Text>
                            </Pressable>
                        </View>
                        {promoError && (
                            <Text style={styles.promoError}>{promoError}</Text>
                        )}
                    </>
                )}

                {/* Summary */}
                <View style={[styles.summaryCard, { borderColor: theme.border }]}>
                    <Text style={[styles.summaryTitle, { color: theme.text }]}>Resume · {restaurantName}</Text>
                    {items.map(item => (
                        <View key={item.id} style={styles.summaryItem}>
                            <Text style={[styles.summaryItemText, { color: theme.text }]}>{item.quantity}x {item.product.name}</Text>
                            <Text style={[styles.summaryItemPrice, { color: theme.text }]}>{(item.unitPrice * item.quantity).toLocaleString()} FCFA</Text>
                        </View>
                    ))}
                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
                    <View style={styles.summaryItem}>
                        <Text style={[styles.summaryItemText, { color: theme.icon }]}>Sous-total</Text>
                        <Text style={[styles.summaryItemPrice, { color: theme.text }]}>{subtotal.toLocaleString()} FCFA</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={[styles.summaryItemText, { color: theme.icon }]}>Livraison</Text>
                        <Text style={[styles.summaryItemPrice, { color: theme.text }]}>{deliveryType === 'delivery' ? `${actualDeliveryFee.toLocaleString()} FCFA` : 'Gratuit'}</Text>
                    </View>
                    {appliedPromo && (
                        <View style={styles.summaryItem}>
                            <Text style={[styles.summaryItemText, { color: '#10b981' }]}>Code promo ({appliedPromo.code})</Text>
                            <Text style={[styles.summaryItemPrice, { color: '#10b981' }]}>-{appliedPromo.discount.toLocaleString()} FCFA</Text>
                        </View>
                    )}
                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
                    <View style={styles.summaryItem}>
                        <Text style={[styles.totalText, { color: theme.text }]}>Total</Text>
                        <Text style={[styles.totalPrice, { color: theme.primary }]}>{effectiveTotal.toLocaleString()} FCFA</Text>
                    </View>
                </View>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.md), borderTopColor: theme.border }]}>
                {deliveryType === 'delivery' && (
                    <Text style={[styles.disclaimerText, { color: theme.icon }]}>
                        Note : La livraison est assurée directement par le restaurant. Kbouffe n'est pas responsable du transport.
                    </Text>
                )}
                <Pressable
                    style={[styles.orderButton, { backgroundColor: theme.primary, opacity: loading ? 0.7 : 1, marginTop: Spacing.sm }]}
                    onPress={handleOrder}
                    disabled={loading}
                    accessibilityRole="button"
                    accessibilityLabel="Confirmer la commande"
                >
                    <Text style={styles.orderButtonText}>{loading ? 'Traitement...' : `Confirmer · ${effectiveTotal.toLocaleString()} FCFA`}</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md },
    headerTitle: { ...Typography.title3 },
    scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xxl },
    sectionTitle: { ...Typography.title3, marginTop: Spacing.lg, marginBottom: Spacing.md },
    toggleRow: { flexDirection: 'row', gap: Spacing.sm },
    toggleButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        padding: Spacing.md,
        borderRadius: Radii.lg,
        borderWidth: 1,
    },
    toggleLabel: { ...Typography.caption, fontWeight: '600' },
    addressCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        padding: Spacing.md,
        borderRadius: Radii.lg,
        borderWidth: 1,
        marginBottom: Spacing.sm,
    },
    addressLabel: { ...Typography.body, fontWeight: '600' },
    addressText: { ...Typography.caption, marginTop: 2 },
    paymentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        padding: Spacing.md,
        borderRadius: Radii.lg,
        borderWidth: 1,
        marginBottom: Spacing.sm,
    },
    paymentIcon: { width: 40, height: 40, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center' },
    paymentLabel: { ...Typography.body, fontWeight: '500', flex: 1 },
    notesInput: {
        borderWidth: 1,
        borderRadius: Radii.lg,
        padding: Spacing.md,
        ...Typography.body,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    summaryCard: {
        borderWidth: 1,
        borderRadius: Radii.lg,
        padding: Spacing.md,
        marginTop: Spacing.lg,
    },
    summaryTitle: { ...Typography.body, fontWeight: '700', marginBottom: Spacing.md },
    summaryItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
    summaryItemText: { ...Typography.caption },
    summaryItemPrice: { ...Typography.caption, fontWeight: '500' },
    divider: { height: 1, marginVertical: Spacing.sm },
    totalText: { ...Typography.body, fontWeight: '700' },
    totalPrice: { ...Typography.body, fontWeight: '700' },
    footer: { padding: Spacing.md, borderTopWidth: 1 },
    orderButton: {
        padding: Spacing.md,
        borderRadius: Radii.full,
        alignItems: 'center',
    },
    orderButtonText: { color: '#fff', ...Typography.body, fontWeight: '700' },
    promoRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
    promoInput: {
        flex: 1,
        borderWidth: 1,
        borderRadius: Radii.lg,
        padding: Spacing.md,
        ...Typography.body,
    },
    promoButton: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: Radii.lg,
    },
    promoButtonText: { color: '#fff', ...Typography.caption, fontWeight: '700' },
    promoApplied: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        padding: Spacing.md,
        borderRadius: Radii.lg,
        borderWidth: 1,
    },
    promoAppliedText: { flex: 1, ...Typography.caption, fontWeight: '600' },
    promoError: { color: '#ef4444', ...Typography.small, marginTop: 4 },
    disclaimerText: { ...Typography.small, textAlign: 'center', marginTop: Spacing.sm, fontStyle: 'italic' },
});
