import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    ScrollView,
    StyleSheet,
    Switch,
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

interface LoyaltyProgram {
    id: string;
    restaurantId: string;
    isActive: boolean;
    pointsPerFcfa: number;
    pointsPerOrder?: number;
    rewardThreshold?: number;
    rewardValue?: number;
    createdAt: string;
}

interface CustomerLoyalty {
    id: string;
    customerId: string;
    customerName: string;
    currentPoints: number;
    totalPointsEarned: number;
    totalPointsRedeemed: number;
    lastTransactionAt?: string;
}

export default function LoyaltyScreen() {
    const { profile, session } = useAuth();
    const theme = useTheme();
    const router = useRouter();

    const [program, setProgram] = useState<LoyaltyProgram | null>(null);
    const [members, setMembers] = useState<CustomerLoyalty[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [pointsPerFcfa, setPointsPerFcfa] = useState('0');
    const [tab, setTab] = useState<'config' | 'members'>('config');

    const loadLoyaltyData = useCallback(async () => {
        if (!profile?.restaurantId || !session) {
            setLoading(false);
            return;
        }

        try {
            // Fetch loyalty program config
            const { data: programData, error: programError } = await supabase
                .from('loyalty_programs')
                .select('*')
                .eq('restaurant_id', profile.restaurantId)
                .maybeSingle();

            if (!programError && programData) {
                setProgram(programData);
                setIsActive(programData.is_active);
                setPointsPerFcfa(String(programData.points_per_fcfa || 0));
            }

            // Fetch member loyalty data
            const { data: memberData, error: memberError } = await supabase
                .from('customer_loyalty')
                .select(
                    `
                    id,
                    customer_id,
                    current_points,
                    total_points_earned,
                    total_points_redeemed,
                    last_transaction_at,
                    users(full_name)
                    `
                )
                .eq('restaurant_id', profile.restaurantId)
                .order('current_points', { ascending: false })
                .limit(100);

            if (!memberError && memberData) {
                const processed: CustomerLoyalty[] = (memberData as any[]).map((m: any) => ({
                    id: m.id,
                    customerId: m.customer_id,
                    customerName: m.users?.full_name || 'Client',
                    currentPoints: m.current_points || 0,
                    totalPointsEarned: m.total_points_earned || 0,
                    totalPointsRedeemed: m.total_points_redeemed || 0,
                    lastTransactionAt: m.last_transaction_at,
                }));

                setMembers(processed);
            }
        } catch (error) {
            console.error('Erreur lors du chargement du programme de fidélité:', error);
        } finally {
            setLoading(false);
        }
    }, [profile?.restaurantId, session]);

    useEffect(() => {
        loadLoyaltyData();
    }, [loadLoyaltyData]);

    const handleSaveConfig = async () => {
        if (!profile?.restaurantId || !session) return;

        setSaving(true);
        try {
            if (program) {
                // Update existing program
                await supabase
                    .from('loyalty_programs')
                    .update({
                        is_active: isActive,
                        points_per_fcfa: parseFloat(pointsPerFcfa) || 0,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', program.id);
            } else {
                // Create new program
                await supabase
                    .from('loyalty_programs')
                    .insert({
                        restaurant_id: profile.restaurantId,
                        is_active: isActive,
                        points_per_fcfa: parseFloat(pointsPerFcfa) || 0,
                    });
            }

            await loadLoyaltyData();
            Alert.alert('Succès', 'Programme de fidélité mis à jour');
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            Alert.alert('Erreur', 'Impossible de mettre à jour le programme');
        } finally {
            setSaving(false);
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

    const renderMember = ({ item }: { item: CustomerLoyalty }) => (
        <View style={s.memberCard}>
            <View style={s.memberHeader}>
                <View>
                    <Text style={s.memberName}>{item.customerName}</Text>
                    <Text style={s.memberStats}>
                        {item.totalPointsEarned} gagnés • {item.totalPointsRedeemed} utilisés
                    </Text>
                </View>
                <View style={s.memberPoints}>
                    <Text style={s.pointsValue}>{item.currentPoints}</Text>
                    <Text style={s.pointsLabel}>points</Text>
                </View>
            </View>
            {item.lastTransactionAt && (
                <Text style={s.lastTransaction}>
                    Dernière transaction:{' '}
                    {new Date(item.lastTransactionAt).toLocaleDateString('fr-FR')}
                </Text>
            )}
        </View>
    );

    return (
        <SafeAreaView style={s.container} edges={['top']}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={s.title}>Programme de fidélité</Text>
                <View style={s.backButton} />
            </View>

            <View style={s.tabBar}>
                <TouchableOpacity
                    style={[s.tab, tab === 'config' && s.tabActive]}
                    onPress={() => setTab('config')}
                >
                    <Ionicons name="settings" size={16} color={theme.text} />
                    <Text style={[s.tabText, tab === 'config' && s.tabTextActive]}>
                        Configuration
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[s.tab, tab === 'members' && s.tabActive]}
                    onPress={() => setTab('members')}
                >
                    <Ionicons name="people" size={16} color={theme.text} />
                    <Text style={[s.tabText, tab === 'members' && s.tabTextActive]}>
                        Membres ({members.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {tab === 'config' ? (
                <ScrollView contentContainerStyle={s.content}>
                    <View style={s.card}>
                        <View style={s.configRow}>
                            <View>
                                <Text style={s.configLabel}>Programme actif</Text>
                                <Text style={s.configDescription}>
                                    {isActive ? 'Points attribués aux commandes' : 'Programme désactivé'}
                                </Text>
                            </View>
                            <Switch
                                value={isActive}
                                onValueChange={setIsActive}
                                disabled={saving}
                                trackColor={{ false: theme.border, true: `${theme.primary}80` }}
                                thumbColor={isActive ? theme.primary : theme.textSecondary}
                            />
                        </View>

                        {isActive && (
                            <>
                                <View style={s.configRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.configLabel}>Points par FCFA</Text>
                                        <Text style={s.configDescription}>
                                            1 point tous les X FCFA
                                        </Text>
                                    </View>
                                    <TextInput
                                        style={[
                                            s.configInput,
                                            { color: theme.text, borderColor: theme.border },
                                        ]}
                                        placeholder="Ex: 100"
                                        placeholderTextColor={theme.textSecondary}
                                        value={pointsPerFcfa}
                                        onChangeText={(text) =>
                                            setPointsPerFcfa(text.replace(/[^0-9]/g, ''))
                                        }
                                        keyboardType="number-pad"
                                        editable={!saving}
                                    />
                                </View>

                                <View style={s.infoBox}>
                                    <Ionicons name="information-circle" size={16} color={theme.primary} />
                                    <Text style={[s.infoText, { color: theme.primary }]}>
                                        Les clients gagneront des points automatiquement lors du paiement
                                        de leurs commandes.
                                    </Text>
                                </View>
                            </>
                        )}
                    </View>

                    <TouchableOpacity
                        style={[s.saveButton, { backgroundColor: theme.primary }]}
                        onPress={handleSaveConfig}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={s.saveButtonText}>Enregistrer</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            ) : (
                <FlatList
                    data={members}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMember}
                    contentContainerStyle={s.membersList}
                    ListEmptyComponent={
                        <View style={s.empty}>
                            <Text style={s.emptyIcon}>💎</Text>
                            <Text style={s.emptyText}>Aucun membre du programme pour le moment</Text>
                        </View>
                    }
                />
            )}
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
        title: { fontSize: 17, fontWeight: '700', color: theme.text },
        tabBar: {
            flexDirection: 'row',
            backgroundColor: theme.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        tab: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingVertical: 12,
            borderBottomWidth: 2,
            borderBottomColor: 'transparent',
        },
        tabActive: { borderBottomColor: theme.primary },
        tabText: { fontSize: 12, fontWeight: '600', color: theme.textSecondary },
        tabTextActive: { color: theme.primary },
        content: { padding: 16, gap: 16, paddingBottom: 32 },
        card: {
            backgroundColor: theme.surface,
            borderRadius: 12,
            padding: 14,
            gap: 12,
            borderWidth: 1,
            borderColor: theme.border,
        },
        configRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        configLabel: { fontSize: 13, fontWeight: '600', color: theme.text },
        configDescription: { fontSize: 11, color: theme.textSecondary, marginTop: 2 },
        configInput: {
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 8,
            fontSize: 13,
            width: 80,
            textAlign: 'center',
        },
        infoBox: {
            backgroundColor: `${theme.primary}10`,
            borderRadius: 8,
            padding: 10,
            flexDirection: 'row',
            gap: 8,
            alignItems: 'flex-start',
        },
        infoText: { fontSize: 11, flex: 1, lineHeight: 16 },
        saveButton: {
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: 'center',
        },
        saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
        membersList: { padding: 12, gap: 10, paddingBottom: 24 },
        memberCard: {
            backgroundColor: theme.surface,
            borderRadius: 12,
            padding: 12,
            borderWidth: 1,
            borderColor: theme.border,
            gap: 8,
        },
        memberHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
        memberName: { fontSize: 13, fontWeight: '700', color: theme.text },
        memberStats: { fontSize: 11, color: theme.textSecondary, marginTop: 2 },
        memberPoints: { alignItems: 'center' },
        pointsValue: { fontSize: 18, fontWeight: '700', color: theme.primary },
        pointsLabel: { fontSize: 10, color: theme.textSecondary },
        lastTransaction: { fontSize: 10, color: theme.textSecondary },
        empty: { alignItems: 'center', marginTop: 70, paddingHorizontal: 20 },
        emptyIcon: { fontSize: 46, marginBottom: 10 },
        emptyText: { fontSize: 14, color: theme.textSecondary, textAlign: 'center' },
    });
