import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
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
import { PermissionGate } from '@/components/PermissionGate';

interface SocialLinks {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    twitter?: string;
    youtube?: string;
    whatsapp?: string;
}

interface ShowcaseData {
    description?: string;
    website?: string;
    social_links?: SocialLinks;
}

const SOCIAL_FIELDS: { key: keyof SocialLinks; label: string; icon: keyof typeof Ionicons.glyphMap; placeholder: string; color: string }[] = [
    { key: 'facebook',  label: 'Facebook',  icon: 'logo-facebook',  placeholder: 'https://facebook.com/monresto',  color: '#1877f2' },
    { key: 'instagram', label: 'Instagram', icon: 'logo-instagram', placeholder: 'https://instagram.com/monresto', color: '#e1306c' },
    { key: 'tiktok',    label: 'TikTok',    icon: 'logo-tiktok',    placeholder: 'https://tiktok.com/@monresto',   color: '#010101' },
    { key: 'twitter',   label: 'Twitter/X', icon: 'logo-twitter',   placeholder: 'https://x.com/monresto',         color: '#1da1f2' },
    { key: 'youtube',   label: 'YouTube',   icon: 'logo-youtube',   placeholder: 'https://youtube.com/@monresto',  color: '#ff0000' },
    { key: 'whatsapp',  label: 'WhatsApp',  icon: 'logo-whatsapp',  placeholder: '+237 6XX XXX XXX',               color: '#25d366' },
];

export default function ShowcaseScreen() {
    const { session } = useAuth();
    const router = useRouter();
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [description, setDescription] = useState('');
    const [website, setWebsite] = useState('');
    const [socialLinks, setSocialLinks] = useState<SocialLinks>({});

    const loadShowcase = useCallback(async () => {
        if (!session) { setLoading(false); return; }
        try {
            const data = await apiFetch<ShowcaseData>('/api/restaurant/showcase', session.access_token);
            if (data.description) setDescription(data.description);
            if (data.website) setWebsite(data.website);
            if (data.social_links) setSocialLinks(data.social_links);
        } catch (err) {
            console.error('Erreur chargement vitrine:', err);
        } finally {
            setLoading(false);
        }
    }, [session]);

    useEffect(() => { loadShowcase(); }, [loadShowcase]);

    const handleSave = async () => {
        if (!session) return;
        setSaving(true);
        try {
            await apiFetch('/api/restaurant/showcase', session.access_token, {
                method: 'PATCH',
                body: JSON.stringify({
                    description,
                    website,
                    social_links: socialLinks,
                }),
            });
            Alert.alert('Succès', 'Vitrine mise à jour');
        } catch (err) {
            Alert.alert('Erreur', getErrorMessage(err, 'Impossible d\'enregistrer'));
        } finally {
            setSaving(false);
        }
    };

    const setSocial = (key: keyof SocialLinks, value: string) =>
        setSocialLinks((prev) => ({ ...prev, [key]: value }));

    const s = styles(theme);

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
                <Text style={s.title}>Vitrine</Text>
                <TouchableOpacity
                    style={[s.saveBtn, { backgroundColor: theme.primary, opacity: saving ? 0.6 : 1 }]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    <Text style={s.saveBtnText}>{saving ? 'Enreg...' : 'Enregistrer'}</Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={s.content}>

                    {/* Description */}
                    <View style={s.section}>
                        <Text style={[s.sectionTitle, { color: theme.text }]}>Description</Text>
                        <Text style={[s.sectionSub, { color: theme.textSecondary }]}>
                            Présentez votre restaurant, votre cuisine et votre ambiance
                        </Text>
                        <View style={[s.card, { backgroundColor: theme.surface }]}>
                            <TextInput
                                style={[s.textarea, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                placeholder="Décrivez votre restaurant, vos spécialités, votre histoire..."
                                placeholderTextColor={theme.textSecondary}
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={5}
                                textAlignVertical="top"
                            />
                            <Text style={[s.charCount, { color: theme.textSecondary }]}>{description.length} caractères</Text>
                        </View>
                    </View>

                    {/* Site web */}
                    <View style={s.section}>
                        <Text style={[s.sectionTitle, { color: theme.text }]}>Site web</Text>
                        <View style={[s.card, { backgroundColor: theme.surface }]}>
                            <View style={s.inputRow}>
                                <View style={[s.iconWrap, { backgroundColor: theme.primary + '15' }]}>
                                    <Ionicons name="globe-outline" size={18} color={theme.primary} />
                                </View>
                                <TextInput
                                    style={[s.rowInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                    placeholder="https://monrestaurant.com"
                                    placeholderTextColor={theme.textSecondary}
                                    value={website}
                                    onChangeText={setWebsite}
                                    keyboardType="url"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Réseaux sociaux */}
                    <View style={s.section}>
                        <Text style={[s.sectionTitle, { color: theme.text }]}>Réseaux sociaux</Text>
                        <Text style={[s.sectionSub, { color: theme.textSecondary }]}>
                            Liez vos pages pour que vos clients vous retrouvent
                        </Text>
                        <View style={[s.card, { backgroundColor: theme.surface }]}>
                            {SOCIAL_FIELDS.map((field, index) => (
                                <View key={field.key}>
                                    {index > 0 && <View style={[s.divider, { backgroundColor: theme.border }]} />}
                                    <View style={s.inputRow}>
                                        <View style={[s.iconWrap, { backgroundColor: field.color + '15' }]}>
                                            <Ionicons name={field.icon} size={18} color={field.color} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>{field.label}</Text>
                                            <TextInput
                                                style={[s.rowInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                                                placeholder={field.placeholder}
                                                placeholderTextColor={theme.textSecondary}
                                                value={socialLinks[field.key] ?? ''}
                                                onChangeText={(v) => setSocial(field.key, v)}
                                                keyboardType={field.key === 'whatsapp' ? 'phone-pad' : 'url'}
                                                autoCapitalize="none"
                                            />
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Info sections avancées */}
                    <View style={[s.infoCard, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '30' }]}>
                        <Ionicons name="information-circle" size={16} color={theme.primary} />
                        <Text style={[s.infoText, { color: theme.primary }]}>
                            Pour les sections avancées (galerie, offres spéciales, avis), gérez votre vitrine depuis le tableau de bord web.
                        </Text>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
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
        saveBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
        saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

        content: { padding: 16, gap: 20, paddingBottom: 40 },
        section: { gap: 8 },
        sectionTitle: { fontSize: 13, fontWeight: '700', paddingHorizontal: 2 },
        sectionSub: { fontSize: 12, lineHeight: 17, paddingHorizontal: 2, marginTop: -2 },

        card: { borderRadius: 14, overflow: 'hidden', padding: 14, gap: 10 },
        divider: { height: 1, marginHorizontal: 0 },

        textarea: {
            borderWidth: 1, borderRadius: 10,
            paddingHorizontal: 12, paddingVertical: 10,
            fontSize: 14, minHeight: 110,
        },
        charCount: { fontSize: 11, textAlign: 'right' },

        inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
        iconWrap: { width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
        rowInput: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13 },
        fieldLabel: { fontSize: 11, fontWeight: '600', marginBottom: 4 },

        infoCard: { borderWidth: 1, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
        infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
    });
