import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch, getErrorMessage } from '@/lib/api';
import { useTheme } from '@/hooks/use-theme';

interface Coupon {
    id: string;
    code: string;
    name: string;
    description?: string;
    type: 'percent' | 'fixed';
    value: number;
    minOrder: number;
    maxDiscount?: number;
    maxUses?: number;
    currentUses: number;
    isActive: boolean;
    startsAt?: string;
    expiresAt?: string;
}

interface CouponsResponse {
    coupons: Array<{
        id: string;
        code: string;
        name: string;
        description?: string;
        kind: 'percent' | 'fixed';
        value: number;
        min_order?: number;
        min_order_amount?: number;
        max_discount?: number;
        max_uses?: number;
        current_uses: number;
        is_active: boolean;
        starts_at?: string;
        expires_at?: string;
    }>;
    total: number;
}

export default function PromotionsScreen() {
    const { session } = useAuth();
    const theme = useTheme();
    const router = useRouter();

    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [creating, setCreating] = useState(false);

    // Form state
    const [formCode, setFormCode] = useState('');
    const [formName, setFormName] = useState('');
    const [formType, setFormType] = useState<'percent' | 'fixed'>('percent');
    const [formValue, setFormValue] = useState('');
    const [formMinOrder, setFormMinOrder] = useState('');

    const loadCoupons = useCallback(async () => {
        if (!session) {
            setLoading(false);
            return;
        }

        try {
            const response = await apiFetch<CouponsResponse>('/api/coupons', session.access_token);

            const processed: Coupon[] = (response.coupons || []).map((c: any) => ({
                id: c.id,
                code: c.code,
                name: c.name,
                description: c.description,
                type: c.kind || c.type,
                value: c.value,
                minOrder: c.min_order || c.min_order_amount || 0,
                maxDiscount: c.max_discount,
                maxUses: c.max_uses,
                currentUses: c.current_uses || 0,
                isActive: c.is_active,
                startsAt: c.starts_at,
                expiresAt: c.expires_at,
            }));

            setCoupons(processed);
        } catch (error) {
            console.error('Erreur lors du chargement des coupons:', error);
        } finally {
            setLoading(false);
        }
    }, [session]);

    useEffect(() => {
        loadCoupons();
    }, [loadCoupons]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadCoupons();
        setRefreshing(false);
    };

    const handleCreateCoupon = async () => {
        if (!formCode.trim() || !formName.trim() || !formValue) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
            return;
        }

        if (!session) return;

        setCreating(true);
        try {
            await apiFetch('/api/coupons', session.access_token, {
                method: 'POST',
                body: JSON.stringify({
                    code: formCode.toUpperCase().trim(),
                    name: formName.trim(),
                    type: formType,
                    value: parseFloat(formValue),
                    min_order: formMinOrder ? parseInt(formMinOrder, 10) : 0,
                    is_active: true,
                }),
            });

            Alert.alert('Succès', 'Code promo créé');
            setShowModal(false);
            setFormCode('');
            setFormName('');
            setFormType('percent');
            setFormValue('');
            setFormMinOrder('');
            await loadCoupons();
        } catch (error) {
            Alert.alert('Erreur', getErrorMessage(error, 'Impossible de créer le code promo'));
        } finally {
            setCreating(false);
        }
    };

    const handleToggleActive = async (couponId: string, currentActive: boolean) => {
        if (!session) return;

        try {
            await apiFetch(`/api/coupons/${couponId}`, session.access_token, {
                method: 'PATCH',
                body: JSON.stringify({ is_active: !currentActive }),
            });

            setCoupons((prev) =>
                prev.map((c) =>
                    c.id === couponId ? { ...c, isActive: !currentActive } : c
                )
            );
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de mettre à jour le code promo');
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

    const renderCoupon = ({ item }: { item: Coupon }) => {
        const discountText =
            item.type === 'percent' ? `${item.value}%` : `${item.value.toLocaleString()} FCFA`;
        const usagePercent = item.maxUses ? (item.currentUses / item.maxUses) * 100 : 0;

        return (
            <View style={[s.couponCard, !item.isActive && s.couponCardInactive]}>
                <View style={s.couponHeader}>
                    <View style={s.couponInfo}>
                        <Text style={s.couponCode}>{item.code}</Text>
                        <Text style={s.couponName}>{item.name}</Text>
                    </View>
                    <View style={s.couponValue}>
                        <Text style={[s.discountValue, !item.isActive && s.discountValueInactive]}>
                            {discountText}
                        </Text>
                    </View>
                </View>

                {item.description && (
                    <Text style={s.couponDescription}>{item.description}</Text>
                )}

                <View style={s.couponStats}>
                    {item.minOrder > 0 && (
                        <View style={s.stat}>
                            <Ionicons name="cart" size={12} color={theme.textSecondary} />
                            <Text style={s.statText}>Min: {item.minOrder.toLocaleString()} FCFA</Text>
                        </View>
                    )}
                    {item.maxUses && (
                        <View style={s.stat}>
                            <Ionicons name="layers" size={12} color={theme.textSecondary} />
                            <Text style={s.statText}>
                                {item.currentUses}/{item.maxUses}
                            </Text>
                        </View>
                    )}
                    <View style={[s.stat, { marginLeft: 'auto' }]}>
                        <TouchableOpacity
                            onPress={() => handleToggleActive(item.id, item.isActive)}
                        >
                            <Ionicons
                                name={item.isActive ? 'toggle' : 'toggle-outline'}
                                size={16}
                                color={item.isActive ? theme.success : theme.textSecondary}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {item.maxUses && (
                    <View style={s.progressBar}>
                        <View
                            style={[
                                s.progressFill,
                                { width: `${Math.min(usagePercent, 100)}%`, backgroundColor: theme.primary },
                            ]}
                        />
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={s.container} edges={['top']}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={s.title}>Codes promo</Text>
                <TouchableOpacity onPress={() => setShowModal(true)} style={s.backButton}>
                    <Ionicons name="add" size={24} color={theme.primary} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={coupons}
                keyExtractor={(item) => item.id}
                renderItem={renderCoupon}
                contentContainerStyle={s.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
                ListEmptyComponent={
                    <View style={s.empty}>
                        <Text style={s.emptyIcon}>🎉</Text>
                        <Text style={s.emptyText}>Aucun code promo</Text>
                        <TouchableOpacity style={s.createButton} onPress={() => setShowModal(true)}>
                            <Ionicons name="add-circle" size={16} color="#fff" />
                            <Text style={s.createButtonText}>Créer un code</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            {/* Create Modal */}
            <Modal
                visible={showModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowModal(false)}
            >
                <View style={s.modalOverlay}>
                    <View style={[s.modalContent, { backgroundColor: theme.surface }]}>
                        <View style={s.modalHeader}>
                            <Text style={s.modalTitle}>Nouveau code promo</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <Ionicons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={s.formContent}>
                            <Text style={s.label}>Code *</Text>
                            <TextInput
                                style={[s.input, { color: theme.text, borderColor: theme.border }]}
                                placeholder="EX: SUMMER20"
                                placeholderTextColor={theme.textSecondary}
                                value={formCode}
                                onChangeText={(text) => setFormCode(text.toUpperCase())}
                                editable={!creating}
                            />

                            <Text style={s.label}>Nom interne *</Text>
                            <TextInput
                                style={[s.input, { color: theme.text, borderColor: theme.border }]}
                                placeholder="Ex: Réduction été"
                                placeholderTextColor={theme.textSecondary}
                                value={formName}
                                onChangeText={setFormName}
                                editable={!creating}
                            />

                            <Text style={s.label}>Type *</Text>
                            <View style={s.typeButtons}>
                                <TouchableOpacity
                                    style={[
                                        s.typeButton,
                                        formType === 'percent' && s.typeButtonActive,
                                    ]}
                                    onPress={() => setFormType('percent')}
                                    disabled={creating}
                                >
                                    <Text
                                        style={[
                                            s.typeButtonText,
                                            formType === 'percent' && s.typeButtonTextActive,
                                        ]}
                                    >
                                        Pourcentage
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        s.typeButton,
                                        formType === 'fixed' && s.typeButtonActive,
                                    ]}
                                    onPress={() => setFormType('fixed')}
                                    disabled={creating}
                                >
                                    <Text
                                        style={[
                                            s.typeButtonText,
                                            formType === 'fixed' && s.typeButtonTextActive,
                                        ]}
                                    >
                                        Montant fixe
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={s.label}>
                                Valeur * {formType === 'percent' ? '(%)' : '(FCFA)'}
                            </Text>
                            <TextInput
                                style={[s.input, { color: theme.text, borderColor: theme.border }]}
                                placeholder={formType === 'percent' ? 'Ex: 20' : 'Ex: 5000'}
                                placeholderTextColor={theme.textSecondary}
                                value={formValue}
                                onChangeText={(text) => setFormValue(text.replace(/[^0-9]/g, ''))}
                                keyboardType="number-pad"
                                editable={!creating}
                            />

                            <Text style={s.label}>Commande minimale (FCFA)</Text>
                            <TextInput
                                style={[s.input, { color: theme.text, borderColor: theme.border }]}
                                placeholder="Ex: 10000"
                                placeholderTextColor={theme.textSecondary}
                                value={formMinOrder}
                                onChangeText={(text) => setFormMinOrder(text.replace(/[^0-9]/g, ''))}
                                keyboardType="number-pad"
                                editable={!creating}
                            />
                        </View>

                        <View style={s.formActions}>
                            <TouchableOpacity
                                style={s.cancelButton}
                                onPress={() => setShowModal(false)}
                                disabled={creating}
                            >
                                <Text style={[s.buttonText, { color: theme.text }]}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[s.submitButton, { backgroundColor: theme.primary }]}
                                onPress={handleCreateCoupon}
                                disabled={creating}
                            >
                                {creating ? (
                                    <ActivityIndicator color="#fff" size={16} />
                                ) : (
                                    <Text style={s.submitButtonText}>Créer</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
        title: { fontSize: 17, fontWeight: '700', color: theme.text, flex: 1, textAlign: 'center' },
        list: { padding: 12, gap: 10, paddingBottom: 24 },
        couponCard: {
            backgroundColor: theme.surface,
            borderRadius: 12,
            padding: 14,
            borderWidth: 1,
            borderColor: theme.border,
            gap: 10,
        },
        couponCardInactive: { opacity: 0.6 },
        couponHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
        couponInfo: { flex: 1 },
        couponCode: { fontSize: 14, fontWeight: '700', color: theme.text },
        couponName: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },
        couponValue: { alignItems: 'flex-end' },
        discountValue: { fontSize: 18, fontWeight: '700', color: theme.primary },
        discountValueInactive: { color: theme.textSecondary },
        couponDescription: { fontSize: 11, color: theme.textSecondary, fontStyle: 'italic' },
        couponStats: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingTopVertical: 8,
            borderTopWidth: 1,
            borderTopColor: theme.border,
        },
        stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
        statText: { fontSize: 10, color: theme.textSecondary },
        progressBar: {
            height: 4,
            backgroundColor: `${theme.primary}20`,
            borderRadius: 2,
            overflow: 'hidden',
        },
        progressFill: { height: '100%' },
        empty: { alignItems: 'center', marginTop: 70, paddingHorizontal: 20 },
        emptyIcon: { fontSize: 46, marginBottom: 10 },
        emptyText: { fontSize: 14, color: theme.textSecondary, marginBottom: 20 },
        createButton: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 16,
            paddingVertical: 10,
            backgroundColor: theme.primary,
            borderRadius: 8,
        },
        createButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
        },
        modalContent: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 20,
            maxHeight: '90%',
        },
        modalHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
        },
        modalTitle: { fontSize: 17, fontWeight: '700', color: theme.text },
        formContent: { gap: 14, marginBottom: 20 },
        label: { fontSize: 12, fontWeight: '600', color: theme.text },
        input: {
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            fontSize: 13,
        },
        typeButtons: { flexDirection: 'row', gap: 10 },
        typeButton: {
            flex: 1,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: theme.background,
            borderWidth: 1,
            borderColor: theme.border,
        },
        typeButtonActive: { backgroundColor: theme.primary, borderColor: theme.primary },
        typeButtonText: { fontSize: 12, fontWeight: '600', color: theme.textSecondary, textAlign: 'center' },
        typeButtonTextActive: { color: '#fff' },
        formActions: { flexDirection: 'row', gap: 10 },
        cancelButton: {
            flex: 1,
            paddingVertical: 10,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: theme.border,
        },
        submitButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
        buttonText: { fontWeight: '600', fontSize: 13 },
        submitButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
    });
