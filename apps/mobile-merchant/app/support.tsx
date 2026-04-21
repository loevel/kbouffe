import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
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

interface Ticket {
    id: string;
    subject: string;
    description: string;
    type: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    created_at: string;
    updated_at: string;
}

type TicketType = { id: string; label: string; icon: keyof typeof Ionicons.glyphMap };
type Priority = { id: string; label: string; color: string };

const TICKET_TYPES: TicketType[] = [
    { id: 'general',   label: 'Général',     icon: 'help-circle' },
    { id: 'billing',   label: 'Facturation', icon: 'card' },
    { id: 'technical', label: 'Technique',   icon: 'construct' },
    { id: 'other',     label: 'Autre',       icon: 'ellipsis-horizontal' },
];

const PRIORITIES: Priority[] = [
    { id: 'low',    label: 'Basse',   color: '#6B7280' },
    { id: 'normal', label: 'Normale', color: '#3B82F6' },
    { id: 'high',   label: 'Haute',   color: '#F97316' },
    { id: 'urgent', label: 'Urgente', color: '#EF4444' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    open:        { label: 'Ouvert',    color: '#F59E0B' },
    in_progress: { label: 'En cours',  color: '#0891B2' },
    resolved:    { label: 'Résolu',    color: '#22C55E' },
    closed:      { label: 'Fermé',     color: '#6B7280' },
};

export default function SupportScreen() {
    const { session } = useAuth();
    const router = useRouter();
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [ticketType, setTicketType] = useState('general');
    const [priority, setPriority] = useState('normal');

    const loadTickets = useCallback(async () => {
        if (!session) { setLoading(false); return; }
        try {
            const data = await apiFetch<{ tickets: Ticket[] }>('/api/restaurant/support/tickets', session.access_token);
            setTickets(data.tickets || []);
        } catch {
            setTickets([]);
        } finally {
            setLoading(false);
        }
    }, [session]);

    useEffect(() => { loadTickets(); }, [loadTickets]);

    const handleCreate = async () => {
        if (!subject.trim() || !description.trim()) {
            Alert.alert('Champs requis', 'Veuillez remplir le sujet et la description');
            return;
        }
        if (!session) return;
        setSaving(true);
        try {
            await apiFetch('/api/restaurant/support/tickets', session.access_token, {
                method: 'POST',
                body: JSON.stringify({ subject: subject.trim(), description: description.trim(), type: ticketType, priority }),
            });
            setShowModal(false);
            setSubject('');
            setDescription('');
            setTicketType('general');
            setPriority('normal');
            await loadTickets();
        } catch (err) {
            Alert.alert('Erreur', getErrorMessage(err, 'Impossible de créer le ticket'));
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

    return (
        <SafeAreaView style={s.container} edges={['top']}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={s.title}>Support</Text>
                <TouchableOpacity onPress={() => setShowModal(true)} style={s.backButton}>
                    <Ionicons name="add" size={24} color={theme.primary} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={tickets}
                keyExtractor={(item) => item.id}
                contentContainerStyle={s.list}
                ListHeaderComponent={
                    <View style={s.listHeader}>
                        {/* Contacts rapides */}
                        <View style={[s.contactCard, { backgroundColor: theme.surface }]}>
                            <Text style={[s.contactTitle, { color: theme.text }]}>Contactez-nous</Text>
                            <Text style={[s.contactSub, { color: theme.textSecondary }]}>Réponse moyenne : 2h · Support 24/7</Text>
                            <View style={s.contactRow}>
                                <TouchableOpacity
                                    style={[s.contactBtn, { backgroundColor: '#25D36615' }]}
                                    onPress={() => Linking.openURL('https://wa.me/237XXXXXXXXX')}
                                >
                                    <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                                    <Text style={[s.contactBtnText, { color: '#25D366' }]}>WhatsApp</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[s.contactBtn, { backgroundColor: theme.primary + '15' }]}
                                    onPress={() => Linking.openURL('mailto:contact@kbouffe.com')}
                                >
                                    <Ionicons name="mail" size={18} color={theme.primary} />
                                    <Text style={[s.contactBtnText, { color: theme.primary }]}>Email</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {tickets.length > 0 && (
                            <Text style={[s.sectionLabel, { color: theme.textSecondary }]}>MES TICKETS</Text>
                        )}
                    </View>
                }
                renderItem={({ item }) => {
                    const status = STATUS_CONFIG[item.status] ?? { label: item.status, color: theme.textSecondary };
                    const prio = PRIORITIES.find((p) => p.id === item.priority);
                    return (
                        <View style={[s.ticketCard, { backgroundColor: theme.surface }]}>
                            <View style={s.ticketTop}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[s.ticketSubject, { color: theme.text }]}>{item.subject}</Text>
                                    <Text style={[s.ticketDate, { color: theme.textSecondary }]}>
                                        {new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </Text>
                                </View>
                                <View style={[s.statusBadge, { backgroundColor: status.color + '20' }]}>
                                    <Text style={[s.statusText, { color: status.color }]}>{status.label}</Text>
                                </View>
                            </View>
                            <Text style={[s.ticketDesc, { color: theme.textSecondary }]} numberOfLines={2}>{item.description}</Text>
                            <View style={s.ticketFooter}>
                                <View style={[s.typeBadge, { backgroundColor: theme.border }]}>
                                    <Text style={[s.typeText, { color: theme.textSecondary }]}>
                                        {TICKET_TYPES.find((t) => t.id === item.type)?.label ?? item.type}
                                    </Text>
                                </View>
                                {prio && (
                                    <View style={[s.prioBadge, { backgroundColor: prio.color + '15' }]}>
                                        <Text style={[s.prioText, { color: prio.color }]}>{prio.label}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    );
                }}
                ListEmptyComponent={
                    <View style={s.empty}>
                        <Ionicons name="headset-outline" size={52} color={theme.textSecondary} />
                        <Text style={[s.emptyTitle, { color: theme.text }]}>Aucun ticket</Text>
                        <Text style={[s.emptySub, { color: theme.textSecondary }]}>Créez un ticket pour contacter le support</Text>
                        <TouchableOpacity style={[s.emptyBtn, { backgroundColor: theme.primary }]} onPress={() => setShowModal(true)}>
                            <Text style={s.emptyBtnText}>Nouveau ticket</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            {/* Modal création */}
            <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                    <View style={s.modalOverlay}>
                        <View style={[s.modalContent, { backgroundColor: theme.surface }]}>
                            <View style={s.modalHeader}>
                                <Text style={[s.modalTitle, { color: theme.text }]}>Nouveau ticket</Text>
                                <TouchableOpacity onPress={() => setShowModal(false)} style={s.closeBtn}>
                                    <Ionicons name="close" size={20} color={theme.text} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
                                {/* Type */}
                                <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>CATÉGORIE</Text>
                                <View style={s.typeGrid}>
                                    {TICKET_TYPES.map((t) => (
                                        <TouchableOpacity
                                            key={t.id}
                                            style={[s.typeOption, { borderColor: ticketType === t.id ? theme.primary : theme.border, backgroundColor: ticketType === t.id ? theme.primary + '10' : 'transparent' }]}
                                            onPress={() => setTicketType(t.id)}
                                        >
                                            <Ionicons name={t.icon} size={16} color={ticketType === t.id ? theme.primary : theme.textSecondary} />
                                            <Text style={[s.typeOptionText, { color: ticketType === t.id ? theme.primary : theme.textSecondary }]}>{t.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Priority */}
                                <Text style={[s.fieldLabel, { color: theme.textSecondary, marginTop: 14 }]}>PRIORITÉ</Text>
                                <View style={s.prioRow}>
                                    {PRIORITIES.map((p) => (
                                        <TouchableOpacity
                                            key={p.id}
                                            style={[s.prioOption, { borderColor: priority === p.id ? p.color : theme.border, backgroundColor: priority === p.id ? p.color + '15' : 'transparent' }]}
                                            onPress={() => setPriority(p.id)}
                                        >
                                            <Text style={[s.prioOptionText, { color: priority === p.id ? p.color : theme.textSecondary }]}>{p.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Subject */}
                                <Text style={[s.fieldLabel, { color: theme.textSecondary, marginTop: 14 }]}>SUJET</Text>
                                <TextInput
                                    style={[s.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background }]}
                                    placeholder="Ex: Problème de paiement client"
                                    placeholderTextColor={theme.textSecondary}
                                    value={subject}
                                    onChangeText={setSubject}
                                />

                                {/* Description */}
                                <Text style={[s.fieldLabel, { color: theme.textSecondary, marginTop: 14 }]}>DESCRIPTION</Text>
                                <TextInput
                                    style={[s.textarea, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background }]}
                                    placeholder="Décrivez votre problème en détail..."
                                    placeholderTextColor={theme.textSecondary}
                                    value={description}
                                    onChangeText={setDescription}
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                />
                            </ScrollView>

                            <View style={[s.modalActions, { borderTopColor: theme.border }]}>
                                <TouchableOpacity style={[s.actionBtn, { borderWidth: 1, borderColor: theme.border, flex: 0.45 }]} onPress={() => setShowModal(false)} disabled={saving}>
                                    <Text style={[s.actionBtnText, { color: theme.text }]}>Annuler</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[s.actionBtn, { backgroundColor: theme.primary, flex: 0.52, opacity: saving ? 0.6 : 1 }]} onPress={handleCreate} disabled={saving}>
                                    {saving ? <ActivityIndicator color="#fff" size={14} /> : <Text style={[s.actionBtnText, { color: '#fff' }]}>Envoyer</Text>}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
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

        list: { padding: 16, gap: 10, paddingBottom: 40 },
        listHeader: { gap: 14, marginBottom: 4 },
        sectionLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, paddingHorizontal: 2 },

        contactCard: { borderRadius: 14, padding: 16, gap: 10 },
        contactTitle: { fontSize: 15, fontWeight: '700' },
        contactSub: { fontSize: 12, marginTop: -4 },
        contactRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
        contactBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 11, borderRadius: 10 },
        contactBtnText: { fontSize: 13, fontWeight: '700' },

        ticketCard: { borderRadius: 14, padding: 14, gap: 8 },
        ticketTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
        ticketSubject: { fontSize: 14, fontWeight: '700' },
        ticketDate: { fontSize: 11, marginTop: 3 },
        statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
        statusText: { fontSize: 11, fontWeight: '600' },
        ticketDesc: { fontSize: 12, lineHeight: 18 },
        ticketFooter: { flexDirection: 'row', gap: 8, marginTop: 2 },
        typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
        typeText: { fontSize: 11 },
        prioBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
        prioText: { fontSize: 11, fontWeight: '600' },

        empty: { alignItems: 'center', paddingVertical: 50, gap: 10 },
        emptyTitle: { fontSize: 17, fontWeight: '700' },
        emptySub: { fontSize: 13, textAlign: 'center' },
        emptyBtn: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 11, borderRadius: 10 },
        emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

        modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
        modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
        modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
        modalTitle: { fontSize: 17, fontWeight: '700' },
        closeBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.border },

        fieldLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8 },
        typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
        typeOption: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
        typeOptionText: { fontSize: 12, fontWeight: '600' },
        prioRow: { flexDirection: 'row', gap: 8 },
        prioOption: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
        prioOptionText: { fontSize: 12, fontWeight: '600' },
        input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
        textarea: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, minHeight: 100 },

        modalActions: { flexDirection: 'row', gap: 10, paddingTop: 16, borderTopWidth: 1, marginTop: 16 },
        actionBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
        actionBtnText: { fontSize: 14, fontWeight: '700' },
    });
