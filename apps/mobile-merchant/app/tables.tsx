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
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { PermissionGate } from '@/components/PermissionGate';

interface Table {
    id: string;
    restaurantId: string;
    number: string;
    capacity: number;
    status: 'available' | 'occupied' | 'reserved' | 'dirty';
    currentOrderId?: string;
    customerCount?: number;
    reservedUntil?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
    available: { label: 'Libre', color: '#22c55e', icon: 'checkmark-circle' },
    occupied: { label: 'Occupée', color: '#3b82f6', icon: 'people' },
    reserved: { label: 'Réservée', color: '#f59e0b', icon: 'calendar' },
    dirty: { label: 'À nettoyer', color: '#ef4444', icon: 'alert-circle' },
};

export default function TablesScreen() {
    const { profile, session } = useAuth();
    const theme = useTheme();
    const router = useRouter();

    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
    const [showActionModal, setShowActionModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [customerCount, setCustomerCount] = useState('');
    const [tableNumber, setTableNumber] = useState('');
    const [tableCapacity, setTableCapacity] = useState('');
    const [processing, setProcessing] = useState(false);

    const loadTables = useCallback(async () => {
        if (!profile?.restaurantId || !session) {
            setLoading(false);
            return;
        }

        try {
            const { data: tablesData, error } = await supabase
                .from('restaurant_tables')
                .select('*')
                .eq('restaurant_id', profile.restaurantId)
                .order('number', { ascending: true });

            if (!error && tablesData) {
                const processed: Table[] = (tablesData as any[]).map((t: any) => ({
                    id: t.id,
                    restaurantId: t.restaurant_id,
                    number: t.number,
                    capacity: t.capacity,
                    status: t.status,
                    currentOrderId: t.current_order_id,
                    customerCount: t.customer_count,
                    reservedUntil: t.reserved_until,
                }));

                setTables(processed);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des tables:', error);
        } finally {
            setLoading(false);
        }
    }, [profile?.restaurantId, session]);

    useEffect(() => {
        loadTables();
    }, [loadTables]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadTables();
        setRefreshing(false);
    };

    const handleStatusChange = async (table: Table, newStatus: string) => {
        if (!profile?.restaurantId) return;

        setProcessing(true);
        try {
            const updateData: any = { status: newStatus };

            // If marking as occupied, save customer count
            if (newStatus === 'occupied' && customerCount) {
                updateData.customer_count = parseInt(customerCount);
            }

            // If marking as dirty, clear customer count
            if (newStatus === 'dirty') {
                updateData.customer_count = null;
            }

            // If marking as available, clear everything
            if (newStatus === 'available') {
                updateData.customer_count = null;
                updateData.current_order_id = null;
            }

            await supabase
                .from('restaurant_tables')
                .update(updateData)
                .eq('id', table.id);

            Alert.alert('Succès', `Table ${table.number} mise à jour`);
            setShowActionModal(false);
            setCustomerCount('');
            setSelectedTable(null);
            await loadTables();
        } catch (error) {
            console.error('Erreur:', error);
            Alert.alert('Erreur', 'Impossible de mettre à jour la table');
        } finally {
            setProcessing(false);
        }
    };

    const handleCreateTable = async () => {
        if (!tableNumber.trim() || !tableCapacity.trim() || !profile?.restaurantId) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs');
            return;
        }

        setProcessing(true);
        try {
            await supabase.from('restaurant_tables').insert({
                restaurant_id: profile.restaurantId,
                number: tableNumber.trim(),
                capacity: parseInt(tableCapacity),
                status: 'available',
            });

            Alert.alert('Succès', `Table ${tableNumber} créée`);
            setShowCreateModal(false);
            setTableNumber('');
            setTableCapacity('');
            await loadTables();
        } catch (error) {
            console.error('Erreur:', error);
            Alert.alert('Erreur', 'Impossible de créer la table');
        } finally {
            setProcessing(false);
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

    const renderTable = ({ item }: { item: Table }) => {
        const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.available;

        return (
            <TouchableOpacity
                style={[s.tableCard, { borderColor: config.color }]}
                onPress={() => {
                    setSelectedTable(item);
                    setShowActionModal(true);
                }}
            >
                <View style={s.tableHeader}>
                    <View>
                        <Text style={s.tableNumber}>Table {item.number}</Text>
                        <Text style={s.tableCapacity}>{item.capacity} place{item.capacity > 1 ? 's' : ''}</Text>
                    </View>
                    <View style={[s.statusBadge, { backgroundColor: `${config.color}20`, borderColor: config.color }]}>
                        <Ionicons name={config.icon as any} size={14} color={config.color} />
                        <Text style={[s.statusLabel, { color: config.color }]}>{config.label}</Text>
                    </View>
                </View>

                {item.status === 'occupied' && item.customerCount && (
                    <View style={s.tableInfo}>
                        <Ionicons name="people" size={12} color={theme.textSecondary} />
                        <Text style={s.tableInfoText}>{item.customerCount} client{item.customerCount > 1 ? 's' : ''}</Text>
                    </View>
                )}

                {item.status === 'reserved' && item.reservedUntil && (
                    <View style={s.tableInfo}>
                        <Ionicons name="time" size={12} color={theme.textSecondary} />
                        <Text style={s.tableInfoText}>
                            Jusqu'à {new Date(item.reservedUntil).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <PermissionGate permission="tables:manage">
        <SafeAreaView style={s.container} edges={['top']}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={s.title}>Tables</Text>
                <TouchableOpacity onPress={() => setShowCreateModal(true)} style={s.backButton}>
                    <Ionicons name="add-circle" size={22} color={theme.primary} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={tables}
                keyExtractor={(item) => item.id}
                renderItem={renderTable}
                contentContainerStyle={s.list}
                numColumns={2}
                columnWrapperStyle={s.row}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
                ListEmptyComponent={
                    <View style={s.empty}>
                        <Text style={s.emptyIcon}>🪑</Text>
                        <Text style={s.emptyText}>Aucune table</Text>
                        <TouchableOpacity style={[s.createButton, { backgroundColor: theme.primary }]} onPress={() => setShowCreateModal(true)}>
                            <Ionicons name="add" size={16} color="#fff" />
                            <Text style={s.createButtonText}>Créer une table</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            {/* Action Modal */}
            <Modal
                visible={showActionModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowActionModal(false)}
            >
                <View style={s.modalOverlay}>
                    <View style={[s.modalContent, { backgroundColor: theme.surface }]}>
                        <View style={s.modalHeader}>
                            <Text style={s.modalTitle}>Table {selectedTable?.number}</Text>
                            <TouchableOpacity onPress={() => setShowActionModal(false)}>
                                <Ionicons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={s.statusGrid}>
                            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                                <TouchableOpacity
                                    key={status}
                                    style={[s.statusOption, selectedTable?.status === status && s.statusOptionActive]}
                                    onPress={() => {
                                        if (status === 'occupied') {
                                            // Prompt for customer count
                                            Alert.prompt(
                                                'Nombre de clients',
                                                'Combien de clients à cette table?',
                                                [
                                                    { text: 'Annuler', style: 'cancel' },
                                                    {
                                                        text: 'OK',
                                                        onPress: (count) => {
                                                            setCustomerCount(count || '0');
                                                            handleStatusChange(selectedTable!, status);
                                                        },
                                                    },
                                                ],
                                                'plain-text',
                                                String(selectedTable?.customerCount || ''),
                                                'number-pad'
                                            );
                                        } else {
                                            handleStatusChange(selectedTable!, status);
                                        }
                                    }}
                                    disabled={processing}
                                >
                                    <Ionicons
                                        name={config.icon as any}
                                        size={18}
                                        color={selectedTable?.status === status ? '#fff' : config.color}
                                    />
                                    <Text
                                        style={[
                                            s.statusOptionText,
                                            selectedTable?.status === status && s.statusOptionTextActive,
                                        ]}
                                    >
                                        {config.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={s.formActions}>
                            <TouchableOpacity
                                style={[s.closeModalButton, { borderColor: theme.border }]}
                                onPress={() => setShowActionModal(false)}
                                disabled={processing}
                            >
                                <Text style={[s.buttonText, { color: theme.text }]}>Fermer</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Create Table Modal */}
            <Modal
                visible={showCreateModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowCreateModal(false)}
            >
                <View style={s.modalOverlay}>
                    <View style={[s.modalContent, { backgroundColor: theme.surface }]}>
                        <View style={s.modalHeader}>
                            <Text style={s.modalTitle}>Créer une table</Text>
                            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                                <Ionicons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={s.formContent}>
                            <Text style={s.label}>Numéro de table</Text>
                            <TextInput
                                style={[s.input, { color: theme.text, borderColor: theme.border }]}
                                placeholder="Ex: A1, 01, Table 1"
                                placeholderTextColor={theme.textSecondary}
                                value={tableNumber}
                                onChangeText={setTableNumber}
                                editable={!processing}
                            />

                            <Text style={s.label}>Capacité</Text>
                            <TextInput
                                style={[s.input, { color: theme.text, borderColor: theme.border }]}
                                placeholder="Ex: 4"
                                placeholderTextColor={theme.textSecondary}
                                value={tableCapacity}
                                onChangeText={(text) => setTableCapacity(text.replace(/[^0-9]/g, ''))}
                                keyboardType="number-pad"
                                editable={!processing}
                            />
                        </View>

                        <View style={s.formActions}>
                            <TouchableOpacity
                                style={s.cancelButton}
                                onPress={() => setShowCreateModal(false)}
                                disabled={processing}
                            >
                                <Text style={[s.buttonText, { color: theme.text }]}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[s.submitButton, { backgroundColor: theme.primary }]}
                                onPress={handleCreateTable}
                                disabled={processing}
                            >
                                {processing ? (
                                    <ActivityIndicator color="#fff" size={14} />
                                ) : (
                                    <Text style={s.submitButtonText}>Créer</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
        </PermissionGate>
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
        row: { gap: 10 },
        tableCard: {
            flex: 1,
            backgroundColor: theme.surface,
            borderRadius: 12,
            padding: 12,
            borderWidth: 2,
            minHeight: 120,
        },
        tableHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
        tableNumber: { fontSize: 14, fontWeight: '700', color: theme.text },
        tableCapacity: { fontSize: 11, color: theme.textSecondary, marginTop: 2 },
        statusBadge: { paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6, borderWidth: 1, alignItems: 'center', gap: 2 },
        statusLabel: { fontSize: 9, fontWeight: '600' },
        tableInfo: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
        tableInfoText: { fontSize: 10, color: theme.textSecondary },
        empty: { alignItems: 'center', marginTop: 70, paddingHorizontal: 20 },
        emptyIcon: { fontSize: 48, marginBottom: 12 },
        emptyText: { fontSize: 14, color: theme.textSecondary, marginBottom: 20 },
        createButton: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 16,
            paddingVertical: 10,
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
        },
        modalHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
        },
        modalTitle: { fontSize: 17, fontWeight: '700', color: theme.text },
        statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
        statusOption: {
            flex: 1,
            minWidth: '45%',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.background,
            gap: 6,
        },
        statusOptionActive: { backgroundColor: theme.primary, borderColor: theme.primary },
        statusOptionText: { fontSize: 11, fontWeight: '600', color: theme.textSecondary, textAlign: 'center' },
        statusOptionTextActive: { color: '#fff' },
        formContent: { gap: 14, marginBottom: 20 },
        label: { fontSize: 12, fontWeight: '600', color: theme.text },
        input: {
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            fontSize: 13,
        },
        formActions: { flexDirection: 'row', gap: 10 },
        cancelButton: {
            flex: 1,
            paddingVertical: 10,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: theme.border,
        },
        submitButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
        closeModalButton: {
            flex: 1,
            paddingVertical: 10,
            borderRadius: 8,
            borderWidth: 1,
            alignItems: 'center',
        },
        buttonText: { fontWeight: '600', fontSize: 13 },
        submitButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
    });
