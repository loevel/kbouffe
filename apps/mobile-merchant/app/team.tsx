import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
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
import { apiFetch, getErrorMessage } from '@/lib/api';
import { PermissionGate } from '@/components/PermissionGate';

interface TeamMember {
    id: string;
    userId: string;
    role: string;
    status: 'active' | 'pending' | 'revoked';
    createdAt: string;
    acceptedAt: string | null;
    hasPin: boolean;
    email: string;
    fullName: string | null;
    phone: string | null;
    avatarUrl: string | null;
}

const ROLE_LABELS: Record<string, string> = {
    owner: 'Propriétaire',
    manager: 'Gérant',
    cashier: 'Caissier',
    cook: 'Cuisinier',
    driver: 'Livreur',
    delivery_partner: 'Partenaire livraison',
};

const ROLE_COLORS: Record<string, string> = {
    owner: '#dc2626',
    manager: '#2563eb',
    cashier: '#16a34a',
    cook: '#ea580c',
    driver: '#6366f1',
    delivery_partner: '#8b5cf6',
};

const ASSIGNABLE_ROLES = ['manager', 'cashier', 'cook', 'driver'] as const;
type AssignableRole = typeof ASSIGNABLE_ROLES[number];

type InviteMode = 'invite' | 'create';

export default function TeamScreen() {
    const { session } = useAuth();
    const theme = useTheme();
    const router = useRouter();

    const [members, setMembers] = useState<TeamMember[]>([]);
    const [callerRole, setCallerRole] = useState<string>('owner');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [inviteMode, setInviteMode] = useState<InviteMode>('invite');
    const [inviteEmail, setInviteEmail] = useState('');
    const [createName, setCreateName] = useState('');
    const [createPhone, setCreatePhone] = useState('');
    const [createPassword, setCreatePassword] = useState('');
    const [selectedRole, setSelectedRole] = useState<AssignableRole>('cashier');
    const [sending, setSending] = useState(false);

    const loadTeam = useCallback(async () => {
        if (!session) { setLoading(false); return; }
        try {
            const data = await apiFetch<{ members: TeamMember[]; callerRole: string }>(
                '/api/team',
                session.access_token,
            );
            setMembers(data.members);
            setCallerRole(data.callerRole);
        } catch (err) {
            console.error('Erreur chargement équipe:', err);
        } finally {
            setLoading(false);
        }
    }, [session]);

    useEffect(() => { loadTeam(); }, [loadTeam]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadTeam();
        setRefreshing(false);
    };

    const resetModal = () => {
        setInviteEmail('');
        setCreateName('');
        setCreatePhone('');
        setCreatePassword('');
        setSelectedRole('cashier');
        setInviteMode('invite');
    };

    const handleInvite = async () => {
        if (!session) return;

        if (inviteMode === 'invite') {
            if (!inviteEmail.trim()) {
                Alert.alert('Erreur', 'Veuillez entrer une adresse email');
                return;
            }
            setSending(true);
            try {
                await apiFetch('/api/team/invite', session.access_token, {
                    method: 'POST',
                    body: JSON.stringify({ email: inviteEmail.trim(), role: selectedRole }),
                });
                Alert.alert('Succès', `Invitation envoyée à ${inviteEmail.trim()}`);
                setShowModal(false);
                resetModal();
                await loadTeam();
            } catch (err) {
                Alert.alert('Erreur', getErrorMessage(err, 'Impossible d\'envoyer l\'invitation'));
            } finally {
                setSending(false);
            }
        } else {
            if (!createName.trim() || !inviteEmail.trim() || !createPassword.trim()) {
                Alert.alert('Erreur', 'Nom, email et mot de passe sont requis');
                return;
            }
            if (createPassword.length < 8) {
                Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 8 caractères');
                return;
            }
            setSending(true);
            try {
                await apiFetch('/api/team/create', session.access_token, {
                    method: 'POST',
                    body: JSON.stringify({
                        fullName: createName.trim(),
                        email: inviteEmail.trim(),
                        phone: createPhone.trim() || undefined,
                        password: createPassword,
                        role: selectedRole,
                    }),
                });
                Alert.alert('Succès', `Compte créé pour ${createName.trim()}`);
                setShowModal(false);
                resetModal();
                await loadTeam();
            } catch (err) {
                Alert.alert('Erreur', getErrorMessage(err, 'Impossible de créer le compte'));
            } finally {
                setSending(false);
            }
        }
    };

    const handleRemove = (member: TeamMember) => {
        if (!session) return;
        Alert.alert(
            'Révoquer le membre',
            `Voulez-vous révoquer l'accès de ${member.fullName || member.email} ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Révoquer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await apiFetch(`/api/team/${member.id}`, session.access_token, { method: 'DELETE' });
                            await loadTeam();
                        } catch (err) {
                            Alert.alert('Erreur', getErrorMessage(err, 'Impossible de révoquer ce membre'));
                        }
                    },
                },
            ],
        );
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
        const displayName = item.fullName || item.email || 'Membre';

        return (
            <View style={[s.memberCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={[s.avatar, { backgroundColor: roleColor + '20' }]}>
                    {item.avatarUrl ? (
                        <Image source={{ uri: item.avatarUrl }} style={s.avatarImg} />
                    ) : (
                        <Text style={[s.avatarText, { color: roleColor }]}>
                            {displayName.charAt(0).toUpperCase()}
                        </Text>
                    )}
                </View>

                <View style={s.memberInfo}>
                    <View style={s.memberRow}>
                        <Text style={[s.memberName, { color: isPending ? theme.textSecondary : theme.text }]} numberOfLines={1}>
                            {displayName}
                        </Text>
                        <View style={[s.roleBadge, { backgroundColor: roleColor + '15', borderColor: roleColor }]}>
                            <Text style={[s.roleLabel, { color: roleColor }]}>
                                {ROLE_LABELS[item.role] || item.role}
                            </Text>
                        </View>
                    </View>

                    <Text style={[s.memberEmail, { color: theme.textSecondary }]} numberOfLines={1}>
                        {item.email}
                    </Text>

                    <View style={s.memberMeta}>
                        {isPending ? (
                            <View style={[s.statusBadge, { backgroundColor: '#f59e0b15' }]}>
                                <Ionicons name="time" size={11} color="#f59e0b" />
                                <Text style={[s.statusText, { color: '#f59e0b' }]}>En attente</Text>
                            </View>
                        ) : (
                            <Text style={[s.joinDate, { color: theme.textSecondary }]}>
                                Depuis {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                            </Text>
                        )}
                        {item.hasPin && (
                            <View style={[s.pinBadge, { backgroundColor: theme.primary + '15' }]}>
                                <Ionicons name="keypad" size={11} color={theme.primary} />
                                <Text style={[s.pinText, { color: theme.primary }]}>PIN</Text>
                            </View>
                        )}
                    </View>
                </View>

                {item.role !== 'owner' && (
                    <TouchableOpacity
                        style={s.deleteBtn}
                        onPress={() => handleRemove(item)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Ionicons name="trash-outline" size={17} color={theme.error || '#dc2626'} />
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const canInvite = callerRole === 'owner' || callerRole === 'manager';

    return (
        <PermissionGate permission="team:read">
        <SafeAreaView style={s.container} edges={['top']}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={s.title}>Équipe</Text>
                {canInvite ? (
                    <TouchableOpacity onPress={() => setShowModal(true)} style={s.backButton}>
                        <Ionicons name="person-add" size={22} color={theme.primary} />
                    </TouchableOpacity>
                ) : (
                    <View style={s.backButton} />
                )}
            </View>

            <FlatList
                data={members}
                keyExtractor={(item) => item.id}
                renderItem={renderMember}
                contentContainerStyle={s.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
                }
                ListEmptyComponent={
                    <View style={s.empty}>
                        <Ionicons name="people-outline" size={48} color={theme.textSecondary} />
                        <Text style={[s.emptyText, { color: theme.text }]}>Aucun membre d'équipe</Text>
                        <Text style={[s.emptySub, { color: theme.textSecondary }]}>
                            Invitez des collaborateurs pour gérer votre restaurant
                        </Text>
                        {canInvite && (
                            <TouchableOpacity
                                style={[s.inviteBtn, { backgroundColor: theme.primary }]}
                                onPress={() => setShowModal(true)}
                            >
                                <Ionicons name="person-add" size={16} color="#fff" />
                                <Text style={s.inviteBtnText}>Ajouter un membre</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                }
            />

            {/* Add Member Modal */}
            <Modal
                visible={showModal}
                transparent
                animationType="slide"
                onRequestClose={() => { setShowModal(false); resetModal(); }}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={s.modalWrapper}
                >
                    <TouchableOpacity
                        style={s.modalOverlay}
                        activeOpacity={1}
                        onPress={() => { setShowModal(false); resetModal(); }}
                    />
                    <View style={[s.modalContent, { backgroundColor: theme.surface }]}>
                        <View style={s.modalHandle} />
                        <View style={s.modalHeader}>
                            <Text style={[s.modalTitle, { color: theme.text }]}>Ajouter un membre</Text>
                            <TouchableOpacity onPress={() => { setShowModal(false); resetModal(); }}>
                                <Ionicons name="close" size={22} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Mode tabs */}
                        <View style={[s.modeTabs, { backgroundColor: theme.background }]}>
                            <TouchableOpacity
                                style={[s.modeTab, inviteMode === 'invite' && { backgroundColor: theme.surface }]}
                                onPress={() => setInviteMode('invite')}
                            >
                                <Ionicons name="mail-outline" size={15} color={inviteMode === 'invite' ? theme.primary : theme.textSecondary} />
                                <Text style={[s.modeTabText, { color: inviteMode === 'invite' ? theme.primary : theme.textSecondary }]}>
                                    Inviter
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[s.modeTab, inviteMode === 'create' && { backgroundColor: theme.surface }]}
                                onPress={() => setInviteMode('create')}
                            >
                                <Ionicons name="person-add-outline" size={15} color={inviteMode === 'create' ? theme.primary : theme.textSecondary} />
                                <Text style={[s.modeTabText, { color: inviteMode === 'create' ? theme.primary : theme.textSecondary }]}>
                                    Créer un compte
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ maxHeight: 400 }} contentContainerStyle={s.formContent}>
                            {inviteMode === 'create' && (
                                <>
                                    <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>Nom complet *</Text>
                                    <TextInput
                                        style={[s.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                        placeholder="Jean Dupont"
                                        placeholderTextColor={theme.textSecondary}
                                        value={createName}
                                        onChangeText={setCreateName}
                                    />
                                </>
                            )}

                            <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>Email *</Text>
                            <TextInput
                                style={[s.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                placeholder="email@exemple.com"
                                placeholderTextColor={theme.textSecondary}
                                value={inviteEmail}
                                onChangeText={setInviteEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />

                            {inviteMode === 'create' && (
                                <>
                                    <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>Téléphone</Text>
                                    <TextInput
                                        style={[s.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                        placeholder="+237 6XX XXX XXX"
                                        placeholderTextColor={theme.textSecondary}
                                        value={createPhone}
                                        onChangeText={setCreatePhone}
                                        keyboardType="phone-pad"
                                    />

                                    <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>Mot de passe * (min. 8 car.)</Text>
                                    <TextInput
                                        style={[s.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                        placeholder="••••••••"
                                        placeholderTextColor={theme.textSecondary}
                                        value={createPassword}
                                        onChangeText={setCreatePassword}
                                        secureTextEntry
                                    />
                                </>
                            )}

                            <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>Rôle</Text>
                            <View style={s.roleGrid}>
                                {ASSIGNABLE_ROLES.map((role) => (
                                    <TouchableOpacity
                                        key={role}
                                        style={[
                                            s.roleOption,
                                            { borderColor: theme.border, backgroundColor: theme.background },
                                            selectedRole === role && { borderColor: ROLE_COLORS[role], backgroundColor: ROLE_COLORS[role] + '15' },
                                        ]}
                                        onPress={() => setSelectedRole(role)}
                                    >
                                        <Text style={[
                                            s.roleOptionText,
                                            { color: theme.textSecondary },
                                            selectedRole === role && { color: ROLE_COLORS[role], fontWeight: '700' },
                                        ]}>
                                            {ROLE_LABELS[role]}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {inviteMode === 'invite' && (
                                <Text style={[s.hint, { color: theme.textSecondary }]}>
                                    L'utilisateur doit déjà avoir un compte Kbouffe. Une invitation lui sera envoyée.
                                </Text>
                            )}
                        </ScrollView>

                        <View style={s.modalActions}>
                            <TouchableOpacity
                                style={[s.cancelBtn, { borderColor: theme.border }]}
                                onPress={() => { setShowModal(false); resetModal(); }}
                                disabled={sending}
                            >
                                <Text style={[s.cancelBtnText, { color: theme.text }]}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[s.submitBtn, { backgroundColor: theme.primary, opacity: sending ? 0.6 : 1 }]}
                                onPress={handleInvite}
                                disabled={sending}
                            >
                                {sending ? (
                                    <ActivityIndicator color="#fff" size={14} />
                                ) : (
                                    <Text style={s.submitBtnText}>
                                        {inviteMode === 'invite' ? 'Inviter' : 'Créer'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
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

        list: { padding: 12, gap: 8, paddingBottom: 24 },
        memberCard: {
            flexDirection: 'row', alignItems: 'center', gap: 12,
            borderRadius: 14, padding: 12, borderWidth: 1,
        },
        avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' },
        avatarImg: { width: 44, height: 44, borderRadius: 22 },
        avatarText: { fontSize: 18, fontWeight: '700' },
        memberInfo: { flex: 1, gap: 3 },
        memberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
        memberName: { fontSize: 13, fontWeight: '700', flex: 1 },
        memberEmail: { fontSize: 11 },
        memberMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
        roleBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
        roleLabel: { fontSize: 10, fontWeight: '600' },
        statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
        statusText: { fontSize: 10, fontWeight: '600' },
        joinDate: { fontSize: 10 },
        pinBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
        pinText: { fontSize: 10, fontWeight: '600' },
        deleteBtn: { padding: 6 },

        empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32, gap: 10 },
        emptyText: { fontSize: 16, fontWeight: '700' },
        emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
        inviteBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 10, marginTop: 10 },
        inviteBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

        modalWrapper: { flex: 1, justifyContent: 'flex-end' },
        modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
        modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingBottom: 32 },
        modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#ccc', alignSelf: 'center', marginTop: 10, marginBottom: 4 },
        modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
        modalTitle: { fontSize: 17, fontWeight: '700' },

        modeTabs: { flexDirection: 'row', borderRadius: 10, padding: 4, marginBottom: 16 },
        modeTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 8 },
        modeTabText: { fontSize: 13, fontWeight: '600' },

        formContent: { gap: 10, paddingBottom: 8 },
        fieldLabel: { fontSize: 12, fontWeight: '600' },
        input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
        roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
        roleOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
        roleOptionText: { fontSize: 12, fontWeight: '600' },
        hint: { fontSize: 11, lineHeight: 16 },

        modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
        cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
        cancelBtnText: { fontWeight: '600', fontSize: 13 },
        submitBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
        submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    });
