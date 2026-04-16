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

interface TeamMember {
    id: string;
    userId: string;
    name: string;
    email: string;
    role: 'owner' | 'manager' | 'cashier' | 'cook' | 'driver' | 'delivery_partner';
    status: 'active' | 'pending' | 'inactive';
    joinedAt: string;
}

const ROLE_LABELS: Record<string, string> = {
    owner: 'Propriétaire',
    manager: 'Gérant',
    cashier: 'Caissier',
    cook: 'Cuisinier',
    driver: 'Chauffeur',
    delivery_partner: 'Partenaire de livraison',
};

const ROLE_COLORS: Record<string, string> = {
    owner: '#dc2626',
    manager: '#2563eb',
    cashier: '#16a34a',
    cook: '#ea580c',
    driver: '#6366f1',
    delivery_partner: '#8b5cf6',
};

export default function TeamScreen() {
    const { profile, session } = useAuth();
    const theme = useTheme();
    const router = useRouter();

    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'manager' | 'cashier' | 'cook'>('cashier');
    const [sending, setSending] = useState(false);

    const loadTeamMembers = useCallback(async () => {
        if (!profile?.restaurantId || !session) {
            setLoading(false);
            return;
        }

        try {
            const { data: membersData, error } = await supabase
                .from('restaurant_members')
                .select(`
                    id,
                    user_id,
                    role,
                    status,
                    created_at,
                    users(full_name, email)
                `)
                .eq('restaurant_id', profile.restaurantId)
                .order('created_at', { ascending: false });

            if (!error && membersData) {
                const processed: TeamMember[] = (membersData as any[]).map((m: any) => ({
                    id: m.id,
                    userId: m.user_id,
                    name: m.users?.full_name || 'Non défini',
                    email: m.users?.email || '',
                    role: m.role,
                    status: m.status,
                    joinedAt: m.created_at,
                }));

                setMembers(processed);
            }
        } catch (error) {
            console.error('Erreur lors du chargement de l\'équipe:', error);
        } finally {
            setLoading(false);
        }
    }, [profile?.restaurantId, session]);

    useEffect(() => {
        loadTeamMembers();
    }, [loadTeamMembers]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadTeamMembers();
        setRefreshing(false);
    };

    const handleInviteMember = async () => {
        if (!inviteEmail.trim()) {
            Alert.alert('Erreur', 'Veuillez entrer une adresse email');
            return;
        }

        if (!profile?.restaurantId) return;

        setSending(true);
        try {
            // Insert pending member
            await supabase
                .from('restaurant_members')
                .insert({
                    restaurant_id: profile.restaurantId,
                    user_id: null, // Will be filled when user accepts
                    role: inviteRole,
                    status: 'pending',
                    invitation_email: inviteEmail.trim(),
                });

            Alert.alert('Succès', 'Invitation envoyée à ' + inviteEmail);
            setShowInviteModal(false);
            setInviteEmail('');
            setInviteRole('cashier');
            await loadTeamMembers();
        } catch (error: any) {
            if (error.code === '23505') {
                Alert.alert('Erreur', 'Cet utilisateur est déjà un membre de votre équipe');
            } else {
                Alert.alert('Erreur', 'Impossible d\'inviter ce membre');
            }
        } finally {
            setSending(false);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!profile?.restaurantId) return;

        Alert.alert('Supprimer le membre', 'Êtes-vous sûr ?', [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Supprimer',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await supabase
                            .from('restaurant_members')
                            .update({ status: 'inactive' })
                            .eq('id', memberId);

                        await loadTeamMembers();
                        Alert.alert('Succès', 'Membre supprimé');
                    } catch (error) {
                        Alert.alert('Erreur', 'Impossible de supprimer ce membre');
                    }
                },
            },
        ]);
    };

    const s = styles(theme);

    if (loading) {
        return (
            <SafeAreaView style={s.container} edges={['top']}>
                <ActivityIndicator style={{ marginTop: 40 }} size="large" color={theme.primary} />
            </SafeAreaView>
        );
    }

    const renderMember = ({ item }: { item: TeamMember }) => {
        const roleColor = ROLE_COLORS[item.role] || theme.primary;
        const isPending = item.status === 'pending';

        return (
            <View style={[s.memberCard, isPending && s.memberCardPending]}>
                <View style={s.memberContent}>
                    <View style={s.memberHeader}>
                        <View>
                            <Text style={[s.memberName, isPending && s.memberNamePending]}>
                                {item.name}
                            </Text>
                            <Text style={s.memberEmail}>{item.email}</Text>
                        </View>
                        <View
                            style={[
                                s.roleBadge,
                                { backgroundColor: `${roleColor}20`, borderColor: roleColor },
                            ]}
                        >
                            <Text style={[s.roleLabel, { color: roleColor }]}>
                                {ROLE_LABELS[item.role] || item.role}
                            </Text>
                        </View>
                    </View>

                    {isPending && (
                        <View style={s.statusBadge}>
                            <Ionicons name="time" size={12} color={theme.warning} />
                            <Text style={[s.statusText, { color: theme.warning }]}>
                                Invitation en attente
                            </Text>
                        </View>
                    )}

                    <Text style={s.joinedDate}>
                        Membre depuis {new Date(item.joinedAt).toLocaleDateString('fr-FR')}
                    </Text>
                </View>

                {item.status !== 'pending' && (
                    <TouchableOpacity
                        style={s.deleteButton}
                        onPress={() => handleRemoveMember(item.id)}
                    >
                        <Ionicons name="trash-outline" size={18} color={theme.error} />
                    </TouchableOpacity>
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
                <Text style={s.title}>Équipe</Text>
                <TouchableOpacity onPress={() => setShowInviteModal(true)} style={s.backButton}>
                    <Ionicons name="person-add" size={22} color={theme.primary} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={members}
                keyExtractor={(item) => item.id}
                renderItem={renderMember}
                contentContainerStyle={s.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
                ListEmptyComponent={
                    <View style={s.empty}>
                        <Text style={s.emptyIcon}>👥</Text>
                        <Text style={s.emptyText}>Aucun membre d\'équipe</Text>
                        <TouchableOpacity style={s.inviteButton} onPress={() => setShowInviteModal(true)}>
                            <Ionicons name="person-add" size={16} color="#fff" />
                            <Text style={s.inviteButtonText}>Inviter un membre</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            {/* Invite Modal */}
            <Modal
                visible={showInviteModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowInviteModal(false)}
            >
                <View style={s.modalOverlay}>
                    <View style={[s.modalContent, { backgroundColor: theme.surface }]}>
                        <View style={s.modalHeader}>
                            <Text style={s.modalTitle}>Inviter un membre</Text>
                            <TouchableOpacity onPress={() => setShowInviteModal(false)}>
                                <Ionicons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={s.formContent}>
                            <Text style={s.label}>Email</Text>
                            <TextInput
                                style={[s.input, { color: theme.text, borderColor: theme.border }]}
                                placeholder="email@example.com"
                                placeholderTextColor={theme.textSecondary}
                                value={inviteEmail}
                                onChangeText={setInviteEmail}
                                keyboardType="email-address"
                                editable={!sending}
                            />

                            <Text style={s.label}>Rôle</Text>
                            <View style={s.roleSelect}>
                                {(['manager', 'cashier', 'cook'] as const).map((role) => (
                                    <TouchableOpacity
                                        key={role}
                                        style={[
                                            s.roleOption,
                                            inviteRole === role && s.roleOptionActive,
                                        ]}
                                        onPress={() => setInviteRole(role)}
                                        disabled={sending}
                                    >
                                        <Text
                                            style={[
                                                s.roleOptionText,
                                                inviteRole === role && s.roleOptionTextActive,
                                            ]}
                                        >
                                            {ROLE_LABELS[role]}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={s.formActions}>
                            <TouchableOpacity
                                style={s.cancelButton}
                                onPress={() => setShowInviteModal(false)}
                                disabled={sending}
                            >
                                <Text style={[s.buttonText, { color: theme.text }]}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[s.submitButton, { backgroundColor: theme.primary }]}
                                onPress={handleInviteMember}
                                disabled={sending}
                            >
                                {sending ? (
                                    <ActivityIndicator color="#fff" size={14} />
                                ) : (
                                    <Text style={s.submitButtonText}>Inviter</Text>
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
        memberCard: {
            backgroundColor: theme.surface,
            borderRadius: 12,
            padding: 14,
            borderWidth: 1,
            borderColor: theme.border,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        memberCardPending: { opacity: 0.7 },
        memberContent: { flex: 1 },
        memberHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
        memberName: { fontSize: 13, fontWeight: '700', color: theme.text },
        memberNamePending: { color: theme.textSecondary },
        memberEmail: { fontSize: 11, color: theme.textSecondary, marginTop: 2 },
        roleBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
        roleLabel: { fontSize: 10, fontWeight: '600' },
        statusBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            marginTop: 6,
            paddingHorizontal: 8,
            paddingVertical: 4,
            backgroundColor: `${theme.warning}15`,
            borderRadius: 4,
            alignSelf: 'flex-start',
        },
        statusText: { fontSize: 10, fontWeight: '600' },
        joinedDate: { fontSize: 10, color: theme.textSecondary, marginTop: 6 },
        deleteButton: { paddingHorizontal: 8 },
        empty: { alignItems: 'center', marginTop: 70, paddingHorizontal: 20 },
        emptyIcon: { fontSize: 46, marginBottom: 10 },
        emptyText: { fontSize: 14, color: theme.textSecondary, marginBottom: 20 },
        inviteButton: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 16,
            paddingVertical: 10,
            backgroundColor: theme.primary,
            borderRadius: 8,
        },
        inviteButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
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
        formContent: { gap: 14, marginBottom: 20 },
        label: { fontSize: 12, fontWeight: '600', color: theme.text },
        input: {
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            fontSize: 13,
        },
        roleSelect: { gap: 8 },
        roleOption: {
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 8,
            backgroundColor: theme.background,
            borderWidth: 1,
            borderColor: theme.border,
        },
        roleOptionActive: { backgroundColor: theme.primary, borderColor: theme.primary },
        roleOptionText: { fontSize: 12, fontWeight: '600', color: theme.textSecondary, textAlign: 'center' },
        roleOptionTextActive: { color: '#fff' },
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
