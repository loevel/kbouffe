import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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

type ThemeLayout = 'grid' | 'luxury' | 'story';

interface BrandingData {
    primary_color: string | null;
    secondary_color: string | null;
    logo_url: string | null;
    banner_url: string | null;
    theme_layout: ThemeLayout | null;
}

const COLOR_PRESETS = [
    { id: 'orange', label: 'Orange',  color: '#f97316' },
    { id: 'green',  label: 'Vert',    color: '#16a34a' },
    { id: 'red',    label: 'Rouge',   color: '#dc2626' },
    { id: 'blue',   label: 'Bleu',    color: '#2563eb' },
    { id: 'purple', label: 'Violet',  color: '#7c3aed' },
];

const THEMES: { id: ThemeLayout; name: string; description: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: 'grid',   name: 'Fast-Food',      icon: 'grid',        description: 'Grille compacte, commande rapide' },
    { id: 'luxury', name: 'Gastronomique',  icon: 'book',        description: 'Grandes photos, style élégant' },
    { id: 'story',  name: 'Instagram',      icon: 'images',      description: 'Cards plein écran, moderne' },
];

export default function BrandingSettingsScreen() {
    const { session } = useAuth();
    const router = useRouter();
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [themeLayout, setThemeLayout] = useState<ThemeLayout>('grid');
    const [primaryColor, setPrimaryColor] = useState('#f97316');
    const [customHex, setCustomHex] = useState('');

    const loadBranding = useCallback(async () => {
        if (!session) { setLoading(false); return; }
        try {
            const data = await apiFetch<BrandingData>('/api/restaurant/branding', session.access_token);
            if (data.theme_layout) setThemeLayout(data.theme_layout);
            if (data.primary_color) {
                setPrimaryColor(data.primary_color);
                setCustomHex(data.primary_color);
            }
        } catch (err) {
            console.error('Erreur chargement branding:', err);
        } finally {
            setLoading(false);
        }
    }, [session]);

    useEffect(() => { loadBranding(); }, [loadBranding]);

    const handleSave = async () => {
        if (!session) return;
        setSaving(true);
        try {
            await apiFetch('/api/restaurant/branding', session.access_token, {
                method: 'PATCH',
                body: JSON.stringify({ theme_layout: themeLayout, primary_color: primaryColor }),
            });
            Alert.alert('Succès', 'Identité visuelle mise à jour');
        } catch (err) {
            Alert.alert('Erreur', getErrorMessage(err, 'Impossible d\'enregistrer'));
        } finally {
            setSaving(false);
        }
    };

    const selectColor = (color: string) => {
        setPrimaryColor(color);
        setCustomHex(color);
    };

    const handleCustomHex = (val: string) => {
        setCustomHex(val);
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) setPrimaryColor(val);
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
                <Text style={s.title}>Identité visuelle</Text>
                <TouchableOpacity
                    style={[s.saveBtn, { backgroundColor: theme.primary, opacity: saving ? 0.6 : 1 }]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    <Text style={s.saveBtnText}>{saving ? 'Enreg...' : 'Enregistrer'}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={s.content}>

                {/* Thème du menu */}
                <View style={s.section}>
                    <Text style={[s.sectionTitle, { color: theme.text }]}>Thème du menu</Text>
                    <Text style={[s.sectionSub, { color: theme.textSecondary }]}>
                        Choisissez le style visuel de votre vitrine pour vos clients
                    </Text>
                    <View style={s.themesGrid}>
                        {THEMES.map((t) => {
                            const selected = themeLayout === t.id;
                            return (
                                <TouchableOpacity
                                    key={t.id}
                                    style={[s.themeCard, { backgroundColor: theme.surface, borderColor: selected ? primaryColor : theme.border, borderWidth: selected ? 2 : 1 }]}
                                    onPress={() => setThemeLayout(t.id)}
                                    activeOpacity={0.8}
                                >
                                    {selected && (
                                        <View style={[s.themeCheck, { backgroundColor: primaryColor }]}>
                                            <Ionicons name="checkmark" size={12} color="#fff" />
                                        </View>
                                    )}
                                    <View style={[s.themeIcon, { backgroundColor: selected ? primaryColor + '15' : theme.background }]}>
                                        <Ionicons name={t.icon} size={24} color={selected ? primaryColor : theme.textSecondary} />
                                    </View>
                                    <Text style={[s.themeName, { color: theme.text, fontWeight: selected ? '700' : '600' }]}>{t.name}</Text>
                                    <Text style={[s.themeDesc, { color: theme.textSecondary }]}>{t.description}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Couleur de marque */}
                <View style={s.section}>
                    <Text style={[s.sectionTitle, { color: theme.text }]}>Couleur de marque</Text>
                    <Text style={[s.sectionSub, { color: theme.textSecondary }]}>
                        Appliquée aux boutons, prix et onglets actifs de votre vitrine
                    </Text>

                    <View style={[s.card, { backgroundColor: theme.surface }]}>
                        {/* Présets */}
                        <View style={s.presetsRow}>
                            {COLOR_PRESETS.map((p) => {
                                const active = primaryColor.toLowerCase() === p.color.toLowerCase();
                                return (
                                    <TouchableOpacity
                                        key={p.id}
                                        style={[s.colorSwatch, { backgroundColor: p.color, borderWidth: active ? 3 : 0, borderColor: '#fff', shadowColor: p.color, shadowOpacity: active ? 0.5 : 0, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: active ? 4 : 0 }]}
                                        onPress={() => selectColor(p.color)}
                                        activeOpacity={0.8}
                                    >
                                        {active && <Ionicons name="checkmark" size={16} color="#fff" />}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <View style={[s.divider, { backgroundColor: theme.border }]} />

                        {/* Hex personnalisé */}
                        <View style={s.hexRow}>
                            <View style={[s.hexPreview, { backgroundColor: primaryColor }]} />
                            <TextInput
                                style={[s.hexInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background }]}
                                value={customHex}
                                onChangeText={handleCustomHex}
                                placeholder="#f97316"
                                placeholderTextColor={theme.textSecondary}
                                autoCapitalize="none"
                                maxLength={7}
                            />
                            <View style={[s.previewBadge, { backgroundColor: primaryColor }]}>
                                <Ionicons name="checkmark" size={12} color="#fff" />
                                <Text style={s.previewBadgeText}>Aperçu</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Aperçu live */}
                <View style={s.section}>
                    <Text style={[s.sectionTitle, { color: theme.text }]}>Aperçu</Text>
                    <View style={[s.previewCard, { backgroundColor: theme.surface }]}>
                        <View style={s.previewHeader}>
                            <View style={[s.previewAvatar, { backgroundColor: primaryColor + '20' }]}>
                                <Ionicons name="restaurant" size={18} color={primaryColor} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <View style={[s.previewLine, { backgroundColor: theme.border, width: '60%' }]} />
                                <View style={[s.previewLine, { backgroundColor: theme.border, width: '40%', marginTop: 4 }]} />
                            </View>
                        </View>
                        <View style={s.previewItems}>
                            {[1, 2].map((i) => (
                                <View key={i} style={[s.previewItem, { backgroundColor: theme.background }]}>
                                    <View style={[s.previewItemImg, { backgroundColor: primaryColor + '15' }]} />
                                    <View style={{ flex: 1, gap: 4, padding: 8 }}>
                                        <View style={[s.previewLine, { backgroundColor: theme.border, width: '70%' }]} />
                                        <View style={[s.previewLine, { backgroundColor: theme.border, width: '40%' }]} />
                                        <View style={[s.previewBtn, { backgroundColor: primaryColor }]}>
                                            <View style={[s.previewLine, { backgroundColor: 'rgba(255,255,255,0.8)', width: '50%', marginBottom: 0 }]} />
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

            </ScrollView>
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
        saveBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
        saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

        content: { padding: 16, gap: 24, paddingBottom: 40 },
        section: { gap: 10 },
        sectionTitle: { fontSize: 13, fontWeight: '700', paddingHorizontal: 2 },
        sectionSub: { fontSize: 12, lineHeight: 17, paddingHorizontal: 2, marginTop: -4 },

        themesGrid: { flexDirection: 'row', gap: 10 },
        themeCard: { flex: 1, borderRadius: 14, padding: 12, alignItems: 'center', gap: 8, position: 'relative' },
        themeCheck: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
        themeIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
        themeName: { fontSize: 12, textAlign: 'center' },
        themeDesc: { fontSize: 10, textAlign: 'center', lineHeight: 14 },

        card: { borderRadius: 14, padding: 16, gap: 14 },
        divider: { height: 1 },
        presetsRow: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
        colorSwatch: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
        hexRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
        hexPreview: { width: 42, height: 42, borderRadius: 10 },
        hexInput: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, fontWeight: '600' },
        previewBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
        previewBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },

        previewCard: { borderRadius: 14, padding: 14, gap: 12 },
        previewHeader: { flexDirection: 'row', alignItems: 'center' },
        previewAvatar: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
        previewLine: { height: 8, borderRadius: 4, marginBottom: 0 },
        previewItems: { flexDirection: 'row', gap: 10 },
        previewItem: { flex: 1, borderRadius: 10, overflow: 'hidden' },
        previewItemImg: { height: 60 },
        previewBtn: { borderRadius: 6, paddingVertical: 6, alignItems: 'center' },
    });
