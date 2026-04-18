import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch, getErrorMessage } from '@/lib/api';
import { useTheme } from '@/hooks/use-theme';
import { PermissionGate } from '@/components/PermissionGate';

interface Service {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    duration_days?: number;
    features: string[];
    icon: string;
}

type PaymentMethod = 'mobile_money' | 'gift_card';
type PaymentProvider = 'mtn_momo' | 'orange_money';

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
    Star: 'star',
    Megaphone: 'megaphone',
    TrendingUp: 'trending-up',
    Package: 'cube',
    Eye: 'eye',
    BarChart3: 'bar-chart',
    Send: 'send',
    ShoppingBag: 'bag',
    Crown: 'ribbon',
    Calendar: 'calendar',
    Image: 'image',
    Heart: 'heart',
    Share2: 'share-social',
    MapPin: 'location',
    Sparkles: 'sparkles',
    Brain: 'bulb',
    Zap: 'flash',
};

const CATEGORY_COLORS: Record<string, string> = {
    visibility: '#F59E0B',
    advertising: '#EC4899',
    analytics: '#EAB308',
    communication: '#3B82F6',
    premium: '#F59E0B',
    ai: '#A855F7',
    ai_bundle: '#7C3AED',
};

const CATEGORY_LABELS: Record<string, string> = {
    visibility: 'Visibilité',
    advertising: 'Publicité',
    analytics: 'Analytics',
    communication: 'Communication',
    premium: 'Premium',
    ai: 'Intelligence Artificielle',
    ai_bundle: 'Bundle IA',
};

export default function MarketplaceScreen() {
    const { session } = useAuth();
    const router = useRouter();
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [services, setServices] = useState<Service[]>([]);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mobile_money');
    const [paymentProvider, setPaymentProvider] = useState<PaymentProvider>('mtn_momo');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [giftCardCode, setGiftCardCode] = useState('');
    const [purchasing, setPurchasing] = useState(false);
    const [purchaseStatus, setPurchaseStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [paymentStep, setPaymentStep] = useState<'details' | 'pending'>('details');

    const loadServices = useCallback(async () => {
        if (!session) { setLoading(false); return; }
        try {
            const data = await apiFetch<{ services: Service[] }>('/api/marketplace/services', session.access_token);
            setServices(data.services || []);
        } catch {
            setServices([]);
        } finally {
            setLoading(false);
        }
    }, [session]);

    useEffect(() => { loadServices(); }, [loadServices]);

    const handlePurchase = async () => {
        if (!session || !selectedService) return;
        if (paymentMethod === 'mobile_money' && phoneNumber.trim().length < 9) {
            setPurchaseStatus({ type: 'error', message: 'Numéro de téléphone invalide (min. 9 chiffres)' });
            return;
        }
        if (paymentMethod === 'gift_card' && !giftCardCode.trim()) {
            setPurchaseStatus({ type: 'error', message: 'Code carte cadeaux requis' });
            return;
        }

        setPurchasing(true);
        setPurchaseStatus(null);

        try {
            await apiFetch('/api/marketplace/purchase', session.access_token, {
                method: 'POST',
                body: JSON.stringify({
                    serviceId: selectedService.id,
                    paymentMethod,
                    ...(paymentMethod === 'mobile_money' && { phoneNumber: phoneNumber.trim(), provider: paymentProvider }),
                    ...(paymentMethod === 'gift_card' && { giftCardCode: giftCardCode.trim() }),
                }),
            });

            if (paymentMethod === 'gift_card') {
                setPurchaseStatus({ type: 'success', message: `${selectedService.name} activé avec succès !` });
                setTimeout(() => closeModal(), 2000);
            } else {
                setPurchaseStatus({ type: 'success', message: 'Paiement initié. Confirmez sur votre téléphone.' });
                setPaymentStep('pending');
            }
        } catch (err) {
            setPurchaseStatus({ type: 'error', message: getErrorMessage(err, 'Erreur lors du paiement') });
        } finally {
            setPurchasing(false);
        }
    };

    const closeModal = () => {
        setSelectedService(null);
        setPaymentStep('details');
        setPhoneNumber('');
        setGiftCardCode('');
        setPurchaseStatus(null);
    };

    const s = styles(theme);

    const getCategoryColor = (category: string) => CATEGORY_COLORS[category] || theme.primary;
    const getCategoryLabel = (category: string) => CATEGORY_LABELS[category] || category;
    const getIcon = (iconName: string): keyof typeof Ionicons.glyphMap =>
        ICON_MAP[iconName] || 'cube-outline';

    if (loading) {
        return (
            <SafeAreaView style={s.container} edges={['top']}>
                <ActivityIndicator style={{ marginTop: 40 }} size="large" color={theme.primary} />
            </SafeAreaView>
        );
    }

    return (
        <PermissionGate permission="store:manage">
        <SafeAreaView style={s.container} edges={['top']}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={s.title}>Marketplace</Text>
                <View style={s.backButton} />
            </View>

            <FlatList
                data={services}
                keyExtractor={(item) => item.id}
                contentContainerStyle={s.content}
                renderItem={({ item }) => {
                    const color = getCategoryColor(item.category);
                    const iconName = getIcon(item.icon);
                    const durationText = item.duration_days
                        ? `${item.duration_days} jour${item.duration_days > 1 ? 's' : ''}`
                        : 'Permanent';

                    return (
                        <View style={[s.serviceCard, { backgroundColor: theme.surface }]}>
                            <View style={s.cardTop}>
                                <View style={[s.iconContainer, { backgroundColor: color + '20' }]}>
                                    <Ionicons name={iconName} size={24} color={color} />
                                </View>
                                <View style={s.cardTopRight}>
                                    <View style={[s.categoryBadge, { backgroundColor: color + '15' }]}>
                                        <Text style={[s.categoryText, { color }]}>{getCategoryLabel(item.category)}</Text>
                                    </View>
                                    {item.duration_days && (
                                        <Text style={[s.durationText, { color: theme.textSecondary }]}>{durationText}</Text>
                                    )}
                                </View>
                            </View>

                            <Text style={[s.serviceName, { color: theme.text }]}>{item.name}</Text>
                            <Text style={[s.serviceDescription, { color: theme.textSecondary }]}>{item.description}</Text>

                            {item.features && item.features.length > 0 && (
                                <View style={s.featuresList}>
                                    {item.features.map((feature, idx) => (
                                        <View key={idx} style={s.featureRow}>
                                            <Ionicons name="checkmark-circle" size={14} color={color} style={s.featureIcon} />
                                            <Text style={[s.featureText, { color: theme.textSecondary }]}>{feature}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            <View style={s.cardFooter}>
                                <View>
                                    <Text style={[s.price, { color: theme.text }]}>{item.price.toLocaleString()} FCFA</Text>
                                    <Text style={[s.priceSub, { color: theme.textSecondary }]}>/ {durationText}</Text>
                                </View>
                                <TouchableOpacity
                                    style={[s.buyButton, { backgroundColor: color }]}
                                    onPress={() => { setSelectedService(item); setPurchaseStatus(null); }}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="cart" size={15} color="#fff" />
                                    <Text style={s.buyButtonText}>Acheter</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                }}
                ListEmptyComponent={
                    <View style={s.emptyState}>
                        <Ionicons name="storefront-outline" size={52} color={theme.textSecondary} />
                        <Text style={[s.emptyText, { color: theme.text }]}>Aucun service disponible</Text>
                        <Text style={[s.emptySubText, { color: theme.textSecondary }]}>Revenez bientôt</Text>
                    </View>
                }
            />

            {/* Purchase Modal */}
            <Modal visible={!!selectedService} transparent animationType="slide" onRequestClose={closeModal}>
                <View style={s.modalOverlay}>
                    <View style={[s.modalContent, { backgroundColor: theme.surface }]}>
                        {selectedService && (
                            <>
                                {/* Modal Header */}
                                <View style={[s.modalHeader, { backgroundColor: getCategoryColor(selectedService.category) }]}>
                                    <View>
                                        <Text style={s.modalTitle}>
                                            {paymentStep === 'pending' ? 'Paiement en cours...' : "Confirmer l'achat"}
                                        </Text>
                                        <Text style={s.modalSubtitle}>
                                            {paymentStep === 'pending' ? 'Confirmez sur votre téléphone' : 'Activez ce service pour votre restaurant'}
                                        </Text>
                                    </View>
                                    <TouchableOpacity onPress={closeModal} style={s.closeButton}>
                                        <Ionicons name="close" size={20} color="#fff" />
                                    </TouchableOpacity>
                                </View>

                                <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false}>
                                    {/* Service summary */}
                                    <View style={[s.summaryBox, { backgroundColor: theme.background }]}>
                                        <View style={s.summaryTop}>
                                            <View style={[s.iconContainer, { backgroundColor: getCategoryColor(selectedService.category) + '20' }]}>
                                                <Ionicons name={getIcon(selectedService.icon)} size={22} color={getCategoryColor(selectedService.category)} />
                                            </View>
                                            <View style={{ flex: 1, marginLeft: 12 }}>
                                                <Text style={[s.serviceName, { color: theme.text }]}>{selectedService.name}</Text>
                                                <Text style={[s.serviceDescription, { color: theme.textSecondary }]} numberOfLines={2}>{selectedService.description}</Text>
                                            </View>
                                        </View>
                                        <View style={[s.divider, { borderColor: theme.border }]} />
                                        <View style={s.priceRow}>
                                            <Text style={[s.modalPrice, { color: getCategoryColor(selectedService.category) }]}>
                                                {selectedService.price.toLocaleString()} FCFA
                                            </Text>
                                            <Text style={[s.priceSub, { color: theme.textSecondary }]}>
                                                / {selectedService.duration_days ? `${selectedService.duration_days}j` : 'Permanent'}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Features preview */}
                                    {selectedService.features?.length > 0 && (
                                        <View style={s.featuresPreview}>
                                            <Text style={[s.featuresTitle, { color: theme.textSecondary }]}>INCLUS DANS CE SERVICE</Text>
                                            {selectedService.features.slice(0, 4).map((f, i) => (
                                                <View key={i} style={s.featureRow}>
                                                    <Ionicons name="checkmark-circle" size={14} color={getCategoryColor(selectedService.category)} style={s.featureIcon} />
                                                    <Text style={[s.featureText, { color: theme.text }]}>{f}</Text>
                                                </View>
                                            ))}
                                            {selectedService.features.length > 4 && (
                                                <Text style={[s.moreFeatures, { color: theme.textSecondary }]}>
                                                    + {selectedService.features.length - 4} autres inclusions
                                                </Text>
                                            )}
                                        </View>
                                    )}

                                    {paymentStep === 'details' && (
                                        <>
                                            {/* Payment method */}
                                            <Text style={[s.sectionLabel, { color: theme.textSecondary }]}>MÉTHODE DE PAIEMENT</Text>
                                            <View style={s.methodRow}>
                                                {(['mobile_money', 'gift_card'] as PaymentMethod[]).map((m) => (
                                                    <TouchableOpacity
                                                        key={m}
                                                        style={[s.methodButton, { borderColor: paymentMethod === m ? theme.primary : theme.border, backgroundColor: paymentMethod === m ? theme.primary + '10' : 'transparent' }]}
                                                        onPress={() => setPaymentMethod(m)}
                                                    >
                                                        <Text style={[s.methodText, { color: paymentMethod === m ? theme.primary : theme.textSecondary }]}>
                                                            {m === 'mobile_money' ? 'Mobile Money' : 'Carte Cadeaux'}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>

                                            {paymentMethod === 'mobile_money' && (
                                                <>
                                                    <Text style={[s.sectionLabel, { color: theme.textSecondary }]}>FOURNISSEUR</Text>
                                                    <View style={s.methodRow}>
                                                        {(['mtn_momo', 'orange_money'] as PaymentProvider[]).map((p) => (
                                                            <TouchableOpacity
                                                                key={p}
                                                                style={[s.methodButton, { borderColor: paymentProvider === p ? theme.primary : theme.border, backgroundColor: paymentProvider === p ? theme.primary + '10' : 'transparent' }]}
                                                                onPress={() => setPaymentProvider(p)}
                                                            >
                                                                <Text style={[s.methodText, { color: paymentProvider === p ? theme.primary : theme.textSecondary }]}>
                                                                    {p === 'mtn_momo' ? 'MTN MoMo' : 'Orange Money'}
                                                                </Text>
                                                            </TouchableOpacity>
                                                        ))}
                                                    </View>
                                                    <Text style={[s.sectionLabel, { color: theme.textSecondary }]}>NUMÉRO DE TÉLÉPHONE</Text>
                                                    <TextInput
                                                        style={[s.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background }]}
                                                        placeholder="Ex: 237691234567"
                                                        placeholderTextColor={theme.textSecondary}
                                                        keyboardType="phone-pad"
                                                        value={phoneNumber}
                                                        onChangeText={(v) => setPhoneNumber(v.replace(/\D/g, ''))}
                                                    />
                                                </>
                                            )}

                                            {paymentMethod === 'gift_card' && (
                                                <>
                                                    <Text style={[s.sectionLabel, { color: theme.textSecondary }]}>CODE CARTE CADEAUX</Text>
                                                    <TextInput
                                                        style={[s.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background }]}
                                                        placeholder="Ex: GC-ABCD-EFGH"
                                                        placeholderTextColor={theme.textSecondary}
                                                        autoCapitalize="characters"
                                                        value={giftCardCode}
                                                        onChangeText={(v) => setGiftCardCode(v.toUpperCase())}
                                                    />
                                                </>
                                            )}
                                        </>
                                    )}

                                    {paymentStep === 'pending' && (
                                        <View style={[s.pendingBox, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                                            <Text style={[s.pendingTitle, { color: '#1D4ED8' }]}>Paiement en cours...</Text>
                                            <Text style={[s.pendingText, { color: '#1D4ED8' }]}>
                                                Confirmez la transaction sur votre téléphone.{'\n'}Un SMS a été envoyé au <Text style={{ fontWeight: '700' }}>{phoneNumber}</Text>.
                                            </Text>
                                        </View>
                                    )}

                                    {purchaseStatus && (
                                        <View style={[s.statusBox, { backgroundColor: purchaseStatus.type === 'success' ? '#ECFDF5' : '#FEF2F2', borderColor: purchaseStatus.type === 'success' ? '#A7F3D0' : '#FECACA' }]}>
                                            <Ionicons
                                                name={purchaseStatus.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
                                                size={16}
                                                color={purchaseStatus.type === 'success' ? '#059669' : '#DC2626'}
                                            />
                                            <Text style={[s.statusText, { color: purchaseStatus.type === 'success' ? '#059669' : '#DC2626' }]}>
                                                {purchaseStatus.message}
                                            </Text>
                                        </View>
                                    )}
                                </ScrollView>

                                {/* Modal Actions */}
                                <View style={[s.modalActions, { borderTopColor: theme.border }]}>
                                    {paymentStep === 'pending' ? (
                                        <TouchableOpacity style={[s.actionButton, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }]} onPress={closeModal}>
                                            <Text style={[s.actionButtonText, { color: theme.text }]}>Fermer</Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <>
                                            <TouchableOpacity style={[s.actionButton, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, flex: 0.45 }]} onPress={closeModal} disabled={purchasing}>
                                                <Text style={[s.actionButtonText, { color: theme.text }]}>Annuler</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[s.actionButton, { backgroundColor: getCategoryColor(selectedService.category), flex: 0.52, opacity: purchasing ? 0.6 : 1 }]}
                                                onPress={handlePurchase}
                                                disabled={purchasing || (paymentMethod === 'mobile_money' && phoneNumber.length < 9) || (paymentMethod === 'gift_card' && !giftCardCode)}
                                            >
                                                <Text style={[s.actionButtonText, { color: '#fff' }]}>
                                                    {purchasing ? 'Traitement...' : paymentMethod === 'gift_card' ? 'Payer avec carte' : 'Procéder au paiement'}
                                                </Text>
                                            </TouchableOpacity>
                                        </>
                                    )}
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
        </PermissionGate>
    );
}

const styles = (theme: any) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },
        header: {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 16, paddingVertical: 12,
            backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.border,
        },
        backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
        title: { fontSize: 17, fontWeight: '700', color: theme.text },
        content: { padding: 16, paddingBottom: 32, gap: 14 },

        serviceCard: { borderRadius: 14, padding: 16, gap: 10 },
        cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
        iconContainer: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
        cardTopRight: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
        categoryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
        categoryText: { fontSize: 11, fontWeight: '600' },
        durationText: { fontSize: 11 },

        serviceName: { fontSize: 15, fontWeight: '700' },
        serviceDescription: { fontSize: 12, lineHeight: 18 },

        featuresList: { gap: 6, marginTop: 4 },
        featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
        featureIcon: { marginTop: 1 },
        featureText: { fontSize: 12, flex: 1, lineHeight: 17 },

        cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
        price: { fontSize: 17, fontWeight: '800' },
        priceSub: { fontSize: 11, marginTop: 1 },
        buyButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10 },
        buyButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },

        emptyState: { alignItems: 'center', paddingVertical: 60, gap: 10 },
        emptyText: { fontSize: 17, fontWeight: '700' },
        emptySubText: { fontSize: 13 },

        // Modal
        modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
        modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
        modalHeader: {
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
            padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24,
        },
        modalTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
        modalSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
        closeButton: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
        modalBody: { padding: 20 },

        summaryBox: { borderRadius: 12, padding: 16, marginBottom: 16 },
        summaryTop: { flexDirection: 'row', alignItems: 'flex-start' },
        divider: { borderTopWidth: 1, marginVertical: 14 },
        priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
        modalPrice: { fontSize: 24, fontWeight: '800' },

        featuresPreview: { marginBottom: 16, gap: 8 },
        featuresTitle: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
        moreFeatures: { fontSize: 11, fontStyle: 'italic', marginTop: 4 },

        sectionLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8, marginTop: 12 },
        methodRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
        methodButton: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
        methodText: { fontSize: 13, fontWeight: '600' },
        input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 8 },

        pendingBox: { borderRadius: 12, padding: 16, borderWidth: 1, gap: 6, marginTop: 12 },
        pendingTitle: { fontSize: 14, fontWeight: '700' },
        pendingText: { fontSize: 13, lineHeight: 20 },

        statusBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, padding: 12, borderWidth: 1, marginTop: 12 },
        statusText: { fontSize: 13, fontWeight: '600', flex: 1 },

        modalActions: { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1 },
        actionButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
        actionButtonText: { fontSize: 14, fontWeight: '700' },
    });
