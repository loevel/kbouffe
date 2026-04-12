import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Switch,
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

interface DeliveryZone {
    id: string;
    name: string;
    type: string | null;
    description: string | null;
    is_active: boolean | null;
    sort_order: number | null;
}

interface ZonesResponse {
    zones: DeliveryZone[];
}

export default function ZonesSettingsScreen() {
    const { session } = useAuth();
    const router = useRouter();
    const theme = useTheme();
    const [zones, setZones] = useState<DeliveryZone[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newZoneName, setNewZoneName] = useState('');

    const loadZones = useCallback(async () => {
        if (!session) {
            setLoading(false);
            return;
        }

        try {
            const data = await apiFetch<ZonesResponse>('/api/orders/zones', session.access_token);
            setZones((data.zones ?? []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)));
        } catch (error) {
            Alert.alert('Erreur', getErrorMessage(error, 'Impossible de charger les zones'));
        } finally {
            setLoading(false);
        }
    }, [session]);

    useEffect(() => {
        loadZones();
    }, [loadZones]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadZones();
        setRefreshing(false);
    };

    const handleCreateZone = async () => {
        if (!session) return;
        if (!newZoneName.trim()) {
            Alert.alert('Validation', 'Le nom de la zone est obligatoire.');
            return;
        }

        setSaving(true);
        try {
            await apiFetch('/api/orders/zones', session.access_token, {
                method: 'POST',
                body: JSON.stringify({ name: newZoneName.trim(), type: 'delivery' }),
            });
            setNewZoneName('');
            await loadZones();
        } catch (error) {
            Alert.alert('Erreur', getErrorMessage(error, 'Impossible de créer la zone'));
        } finally {
            setSaving(false);
        }
    };

    const handleToggleZone = async (zone: DeliveryZone, value: boolean) => {
        if (!session) return;

        setZones((prev) => prev.map((item) => (item.id === zone.id ? { ...item, is_active: value } : item)));

        try {
            await apiFetch(`/api/orders/zones/${zone.id}`, session.access_token, {
                method: 'PATCH',
                body: JSON.stringify({ is_active: value }),
            });
        } catch (error) {
            setZones((prev) => prev.map((item) => (item.id === zone.id ? { ...item, is_active: !value } : item)));
            Alert.alert('Erreur', getErrorMessage(error, 'Impossible de mettre à jour la zone'));
        }
    };

    const handleDeleteZone = (zone: DeliveryZone) => {
        Alert.alert(
            'Supprimer la zone',
            `Voulez-vous supprimer "${zone.name}" ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        if (!session) return;
                        try {
                            await apiFetch(`/api/orders/zones/${zone.id}`, session.access_token, { method: 'DELETE' });
                            setZones((prev) => prev.filter((item) => item.id !== zone.id));
                        } catch (error) {
                            Alert.alert('Erreur', getErrorMessage(error, 'Impossible de supprimer la zone'));
                        }
                    },
                },
            ]
        );
    };

    const s = styles(theme);

    if (loading) {
        return (
            <SafeAreaView style={s.container} edges={['top']}>
                <ActivityIndicator style={{ marginTop: 40 }} color={theme.primary} size="large" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={s.container} edges={['top']}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={s.title}>Zones de livraison</Text>
                <View style={s.backButton} />
            </View>

            <FlatList
                data={zones}
                keyExtractor={(item) => item.id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
                contentContainerStyle={s.list}
                ListHeaderComponent={
                    <View style={s.createCard}>
                        <Text style={s.sectionTitle}>Ajouter une zone</Text>
                        <TextInput
                            style={s.input}
                            value={newZoneName}
                            onChangeText={setNewZoneName}
                            placeholder="Ex: Centre-ville, Bastos..."
                            placeholderTextColor={theme.textSecondary}
                        />
                        <TouchableOpacity
                            style={[s.addButton, saving && s.addButtonDisabled]}
                            onPress={handleCreateZone}
                            disabled={saving}
                        >
                            {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.addButtonText}>Créer la zone</Text>}
                        </TouchableOpacity>
                    </View>
                }
                renderItem={({ item }) => (
                    <View style={s.zoneCard}>
                        <View style={s.zoneContent}>
                            <Text style={s.zoneName}>{item.name}</Text>
                            <Text style={s.zoneMeta}>
                                {(item.type ?? 'zone').toUpperCase()} · {item.is_active ? 'Active' : 'Inactive'}
                            </Text>
                            {!!item.description && <Text style={s.zoneDescription}>{item.description}</Text>}
                        </View>

                        <View style={s.zoneActions}>
                            <Switch
                                value={Boolean(item.is_active)}
                                onValueChange={(value) => handleToggleZone(item, value)}
                                trackColor={{ false: theme.border, true: `${theme.primary}99` }}
                                thumbColor={item.is_active ? theme.primary : theme.textSecondary}
                            />
                            <TouchableOpacity style={s.deleteButton} onPress={() => handleDeleteZone(item)}>
                                <Ionicons name="trash-outline" size={18} color={theme.error} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={s.empty}>
                        <Text style={s.emptyIcon}>📍</Text>
                        <Text style={s.emptyText}>Aucune zone enregistrée</Text>
                    </View>
                }
            />
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
        list: { padding: 14, gap: 10, paddingBottom: 30 },
        createCard: {
            backgroundColor: theme.surface,
            borderRadius: 14,
            padding: 14,
            marginBottom: 10,
        },
        sectionTitle: { fontSize: 14, fontWeight: '700', color: theme.text, marginBottom: 10 },
        input: {
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: theme.text,
            backgroundColor: theme.background,
            marginBottom: 10,
        },
        addButton: {
            backgroundColor: theme.primary,
            borderRadius: 10,
            alignItems: 'center',
            paddingVertical: 11,
        },
        addButtonDisabled: { opacity: 0.6 },
        addButtonText: { color: '#fff', fontWeight: '700' },
        zoneCard: {
            backgroundColor: theme.surface,
            borderRadius: 14,
            padding: 14,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
        },
        zoneContent: { flex: 1, gap: 3 },
        zoneName: { fontSize: 14, fontWeight: '700', color: theme.text },
        zoneMeta: { fontSize: 11, color: theme.textSecondary },
        zoneDescription: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },
        zoneActions: { alignItems: 'center', gap: 8 },
        deleteButton: {
            width: 30,
            height: 30,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: `${theme.error}18`,
        },
        empty: {
            alignItems: 'center',
            marginTop: 50,
        },
        emptyIcon: { fontSize: 38, marginBottom: 8 },
        emptyText: { color: theme.textSecondary, fontSize: 14 },
    });
