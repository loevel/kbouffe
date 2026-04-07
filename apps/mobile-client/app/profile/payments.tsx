import { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Alert, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Radii, Typography, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type PaymentType = 'mtn_momo' | 'orange_money' | 'cash';

interface SavedPaymentMethod {
    id: string;
    type: PaymentType;
    label: string;
    number: string;
    isDefault: boolean;
}

const PAYMENT_ICONS: Record<PaymentType, string> = {
    mtn_momo: 'phone-portrait-outline',
    orange_money: 'phone-portrait-outline',
    cash: 'cash-outline',
};

const PAYMENT_COLORS: Record<PaymentType, string> = {
    mtn_momo: '#FFC107',
    orange_money: '#FF5722',
    cash: '#4CAF50',
};

const PAYMENT_LABELS: Record<PaymentType, string> = {
    mtn_momo: 'MTN Mobile Money',
    orange_money: 'Orange Money',
    cash: 'Paiement en espèces',
};

export default function PaymentsScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();

    const [methods, setMethods] = useState<SavedPaymentMethod[]>([
        { id: '1', type: 'cash', label: 'Espèces', number: '', isDefault: true },
    ]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newType, setNewType] = useState<'mtn_momo' | 'orange_money'>('mtn_momo');
    const [newNumber, setNewNumber] = useState('');

    const setDefault = (id: string) => {
        Haptics.selectionAsync();
        setMethods(prev => prev.map(m => ({ ...m, isDefault: m.id === id })));
    };

    const removeMethod = (id: string) => {
        const method = methods.find(m => m.id === id);
        if (method?.isDefault) {
            Alert.alert('Impossible', 'Vous ne pouvez pas supprimer votre méthode par défaut. Définissez-en une autre d\'abord.');
            return;
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert('Supprimer', 'Supprimer cette méthode de paiement ?', [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Supprimer',
                style: 'destructive',
                onPress: () => setMethods(prev => prev.filter(m => m.id !== id)),
            },
        ]);
    };

    const addMethod = () => {
        if (!newNumber.trim()) {
            Alert.alert('Champ requis', 'Veuillez entrer un numéro de téléphone.');
            return;
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const newMethod: SavedPaymentMethod = {
            id: Date.now().toString(),
            type: newType,
            label: PAYMENT_LABELS[newType],
            number: newNumber.trim(),
            isDefault: false,
        };
        setMethods(prev => [...prev, newMethod]);
        setNewNumber('');
        setShowAddModal(false);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top, Spacing.md) }]}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Méthodes de paiement</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={[styles.sectionTitle, { color: theme.icon }]}>Méthodes enregistrées</Text>
                <View style={[styles.card, { backgroundColor: theme.surface }]}>
                    {methods.map((method, index) => (
                        <View
                            key={method.id}
                            style={[
                                styles.methodRow,
                                index !== methods.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
                            ]}
                        >
                            <View style={[styles.methodIcon, { backgroundColor: PAYMENT_COLORS[method.type] + '20' }]}>
                                <Ionicons
                                    name={PAYMENT_ICONS[method.type] as any}
                                    size={22}
                                    color={PAYMENT_COLORS[method.type]}
                                />
                            </View>
                            <View style={styles.methodInfo}>
                                <View style={styles.methodLabelRow}>
                                    <Text style={[styles.methodLabel, { color: theme.text }]}>{method.label}</Text>
                                    {method.isDefault && (
                                        <View style={[styles.defaultBadge, { backgroundColor: theme.primary + '20' }]}>
                                            <Text style={[styles.defaultBadgeText, { color: theme.primary }]}>Par défaut</Text>
                                        </View>
                                    )}
                                </View>
                                {method.number ? (
                                    <Text style={[styles.methodNumber, { color: theme.icon }]}>{method.number}</Text>
                                ) : (
                                    <Text style={[styles.methodNumber, { color: theme.icon }]}>Règlement au moment de la livraison</Text>
                                )}
                            </View>
                            <View style={styles.methodActions}>
                                {!method.isDefault && (
                                    <Pressable
                                        onPress={() => setDefault(method.id)}
                                        style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.6 }]}
                                        accessibilityLabel="Définir par défaut"
                                    >
                                        <Ionicons name="star-outline" size={18} color={theme.icon} />
                                    </Pressable>
                                )}
                                {method.type !== 'cash' && (
                                    <Pressable
                                        onPress={() => removeMethod(method.id)}
                                        style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.6 }]}
                                        accessibilityLabel="Supprimer"
                                    >
                                        <Ionicons name="trash-outline" size={18} color={theme.error ?? '#ef4444'} />
                                    </Pressable>
                                )}
                            </View>
                        </View>
                    ))}
                </View>

                <Pressable
                    style={[styles.addButton, { borderColor: theme.primary, backgroundColor: theme.primary + '10' }]}
                    onPress={() => {
                        Haptics.selectionAsync();
                        setShowAddModal(true);
                    }}
                >
                    <Ionicons name="add-circle-outline" size={22} color={theme.primary} />
                    <Text style={[styles.addButtonText, { color: theme.primary }]}>Ajouter un compte Mobile Money</Text>
                </Pressable>

                {/* Info card */}
                <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Ionicons name="information-circle-outline" size={20} color={theme.icon} />
                    <Text style={[styles.infoText, { color: theme.icon }]}>
                        Vos numéros de Mobile Money sont stockés localement sur votre appareil et utilisés pour pré-remplir le checkout.
                    </Text>
                </View>
            </ScrollView>

            {/* Add modal */}
            <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <Pressable style={styles.modalOverlay} onPress={() => setShowAddModal(false)} />
                    <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
                        <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
                        <Text style={[styles.modalTitle, { color: theme.text }]}>Ajouter un compte</Text>

                        <View style={styles.typeSelector}>
                            {(['mtn_momo', 'orange_money'] as const).map(t => (
                                <Pressable
                                    key={t}
                                    onPress={() => setNewType(t)}
                                    style={[
                                        styles.typeOption,
                                        {
                                            borderColor: newType === t ? PAYMENT_COLORS[t] : theme.border,
                                            backgroundColor: newType === t ? PAYMENT_COLORS[t] + '15' : 'transparent',
                                        },
                                    ]}
                                >
                                    <Ionicons
                                        name="phone-portrait-outline"
                                        size={18}
                                        color={newType === t ? PAYMENT_COLORS[t] : theme.icon}
                                    />
                                    <Text style={[styles.typeLabel, { color: newType === t ? PAYMENT_COLORS[t] : theme.icon }]}>
                                        {t === 'mtn_momo' ? 'MTN MoMo' : 'Orange Money'}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>

                        <View style={[styles.inputContainer, { borderColor: theme.border }]}>
                            <Ionicons name="call-outline" size={20} color={theme.icon} style={{ marginRight: Spacing.sm }} />
                            <TextInput
                                placeholder="Numéro de téléphone"
                                placeholderTextColor={theme.icon}
                                style={[styles.modalInput, { color: theme.text }]}
                                value={newNumber}
                                onChangeText={setNewNumber}
                                keyboardType="phone-pad"
                                autoFocus
                            />
                        </View>

                        <Pressable
                            style={[styles.modalButton, { backgroundColor: theme.primary }]}
                            onPress={addMethod}
                        >
                            <Text style={styles.modalButtonText}>Ajouter</Text>
                        </Pressable>

                        <Pressable
                            style={[styles.modalCancel, { borderColor: theme.border }]}
                            onPress={() => setShowAddModal(false)}
                        >
                            <Text style={[styles.modalCancelText, { color: theme.icon }]}>Annuler</Text>
                        </Pressable>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
    },
    backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { ...Typography.title3 },
    scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xxl },
    sectionTitle: {
        ...Typography.small,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: Spacing.sm,
        marginLeft: Spacing.xs,
    },
    card: { borderRadius: Radii.xl, overflow: 'hidden', ...Shadows.sm, marginBottom: Spacing.lg },
    methodRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        gap: Spacing.md,
    },
    methodIcon: {
        width: 44,
        height: 44,
        borderRadius: Radii.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    methodInfo: { flex: 1 },
    methodLabelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    methodLabel: { ...Typography.bodySemibold },
    methodNumber: { ...Typography.caption, marginTop: 2 },
    defaultBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radii.full },
    defaultBadgeText: { ...Typography.small, fontWeight: '700' },
    methodActions: { flexDirection: 'row', gap: Spacing.xs },
    actionBtn: { padding: Spacing.xs },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        padding: Spacing.md,
        borderRadius: Radii.xl,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        marginBottom: Spacing.lg,
    },
    addButtonText: { ...Typography.bodySemibold },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
        padding: Spacing.md,
        borderRadius: Radii.lg,
        borderWidth: 1,
    },
    infoText: { ...Typography.small, flex: 1, lineHeight: 18 },
    modalOverlay: { flex: 1, backgroundColor: '#00000040' },
    modalSheet: {
        borderTopLeftRadius: Radii.xl,
        borderTopRightRadius: Radii.xl,
        padding: Spacing.lg,
        paddingBottom: Spacing.xxl,
        gap: Spacing.md,
    },
    modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.sm },
    modalTitle: { ...Typography.title3, textAlign: 'center' },
    typeSelector: { flexDirection: 'row', gap: Spacing.md },
    typeOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.xs,
        padding: Spacing.md,
        borderRadius: Radii.lg,
        borderWidth: 1.5,
    },
    typeLabel: { ...Typography.captionSemibold },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: Radii.lg,
        paddingHorizontal: Spacing.md,
        height: 52,
    },
    modalInput: { flex: 1, ...Typography.body },
    modalButton: {
        height: 52,
        borderRadius: Radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalButtonText: { color: '#fff', ...Typography.bodySemibold },
    modalCancel: {
        height: 48,
        borderRadius: Radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    modalCancelText: { ...Typography.bodySemibold },
});
