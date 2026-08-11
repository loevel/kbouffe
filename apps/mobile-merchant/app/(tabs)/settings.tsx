import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import Constants from 'expo-constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { usePermissions } from '@/hooks/use-permission';
import { getMemberRoleLabel } from '@/lib/member-role';
import { EmptyState, SearchBar } from '@/components/ui';

// Phone numbers are stored as raw digits (e.g. "699999999") and rendered
// as-is, unformatted, next to the role. Group them so they're readable.
function formatPhone(phone?: string | null) {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 6) return phone;
    return digits.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
}
import type { Permission } from '@/lib/permissions';

export default function SettingsScreen() {
    const { profile, signOut } = useAuth();
    const theme = useTheme();
    const router = useRouter();
    const can = usePermissions();
    const [query, setQuery] = useState('');

    const handleSignOut = () => {
        Alert.alert('Se déconnecter', 'Voulez-vous vraiment vous déconnecter ?', [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Déconnecter', style: 'destructive', onPress: signOut },
        ]);
    };

    const s = styles(theme);

    type MenuItem = { label: string; icon: keyof typeof Ionicons.glyphMap; href: string; permission?: Permission };
    type MenuSection = { title: string; items: MenuItem[] };

    /**
     * Regroupement par moment d'usage plutôt que par taxonomie.
     * Les 25 entrées vivaient auparavant dans « Opérations / Offres / Outils /
     * Configuration », qui mettait la Caisse et la Cuisine — consultées chaque
     * service — au même niveau que la Sécurité ou l'Export de données.
     */
    const allSections: MenuSection[] = [
        {
            title: 'Au quotidien',
            items: [
                { label: 'Caisse', icon: 'wallet-outline', href: '/caisse', permission: 'orders:manage' },
                { label: 'Cuisine', icon: 'flame-outline', href: '/kitchen', permission: 'orders:read' },
                { label: 'Tables', icon: 'grid-outline', href: '/tables', permission: 'tables:manage' },
                { label: 'Réservations', icon: 'calendar-outline', href: '/reservations', permission: 'reservations:read' },
                { label: 'Messages', icon: 'chatbubble-ellipses-outline', href: '/messages' },
            ],
        },
        {
            title: 'Pilotage',
            items: [
                { label: 'Statistiques', icon: 'bar-chart-outline', href: '/stats', permission: 'dashboard:read' },
                { label: 'Rapports', icon: 'document-text-outline', href: '/reports', permission: 'finances:read' },
                { label: 'Analytique avancée', icon: 'trending-up-outline', href: '/analytics', permission: 'finances:read' },
                { label: 'Finances', icon: 'cash-outline', href: '/finances', permission: 'finances:read' },
            ],
        },
        {
            title: 'Clients & fidélisation',
            items: [
                { label: 'Clients', icon: 'people-circle-outline', href: '/customers', permission: 'customers:read' },
                { label: 'Avis clients', icon: 'star-outline', href: '/reviews', permission: 'customers:read' },
                { label: 'Promotions', icon: 'pricetag-outline', href: '/promotions', permission: 'marketing:read' },
                { label: 'Fidélité', icon: 'heart-outline', href: '/loyalty', permission: 'marketing:read' },
                { label: 'Cartes cadeaux', icon: 'gift-outline', href: '/gift-cards', permission: 'marketing:read' },
            ],
        },
        {
            title: 'Mon restaurant',
            items: [
                { label: 'Informations du restaurant', icon: 'business-outline', href: '/settings/restaurant', permission: 'settings:manage' },
                { label: "Horaires d'ouverture", icon: 'time-outline', href: '/settings/hours', permission: 'settings:manage' },
                { label: 'Zones de livraison', icon: 'map-outline', href: '/settings/zones', permission: 'settings:manage' },
                { label: 'Modes de paiement', icon: 'card-outline', href: '/settings/payments', permission: 'settings:manage' },
                { label: 'Service sur place', icon: 'restaurant-outline', href: '/settings/dine-in', permission: 'settings:manage' },
                { label: 'Galerie photos', icon: 'images-outline', href: '/settings/gallery', permission: 'settings:manage' },
                { label: 'Identité visuelle', icon: 'color-palette-outline', href: '/settings/branding', permission: 'settings:manage' },
                { label: 'Vitrine en ligne', icon: 'storefront-outline', href: '/showcase', permission: 'store:manage' },
            ],
        },
        {
            title: 'Compte & système',
            items: [
                { label: 'Équipe', icon: 'people-outline', href: '/team', permission: 'team:read' },
                { label: 'Notifications push', icon: 'notifications-outline', href: '/settings/notifications' },
                { label: 'Sécurité', icon: 'shield-checkmark-outline', href: '/settings/security' },
                { label: 'Données & Export', icon: 'download-outline', href: '/settings/data', permission: 'finances:read' },
                { label: 'Marketplace', icon: 'bag-outline', href: '/marketplace', permission: 'store:manage' },
                { label: 'Aide & support', icon: 'help-circle-outline', href: '/support' },
            ],
        },
    ];

    const menuSections = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return allSections
            .map((section) => ({
                ...section,
                items: section.items.filter(
                    (item) =>
                        (!item.permission || can(item.permission)) &&
                        (!needle || item.label.toLowerCase().includes(needle))
                ),
            }))
            .filter((section) => section.items.length > 0);
        // `allSections` est reconstruit à chaque rendu ; seules la requête et les
        // permissions changent réellement le résultat.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, can]);

    const resultCount = menuSections.reduce((sum, section) => sum + section.items.length, 0);

    return (
        <SafeAreaView style={s.container} edges={['top']}>
            <View style={s.header}>
                <Text style={s.title}>Paramètres</Text>
            </View>
            <ScrollView contentContainerStyle={s.scroll}>
                {/* Restaurant info card */}
                <View style={s.restaurantCard}>
                    <View style={[s.restaurantAvatar, { backgroundColor: theme.primaryLight }]}>
                        <Text style={[s.restaurantAvatarText, { color: theme.primary }]}>
                            {profile?.restaurantName?.[0] ?? '?'}
                        </Text>
                    </View>
                    <View style={s.restaurantInfo}>
                        <Text style={[s.restaurantName, { color: theme.text }]}>{profile?.restaurantName ?? 'Restaurant'}</Text>
                        <Text style={[s.restaurantRole, { color: theme.textSecondary }]}>
                            {getMemberRoleLabel(profile?.memberRole)} · {formatPhone(profile?.phone)}
                        </Text>
                    </View>
                </View>

                <SearchBar
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Rechercher un réglage…"
                    resultCount={resultCount}
                    style={s.search}
                />

                {/* Menu sections */}
                {menuSections.map((section) => (
                    <View key={section.title} style={s.section}>
                        <Text style={[s.sectionTitle, { color: theme.textSecondary }]}>{section.title}</Text>
                        {section.items.map((item) => (
                            <TouchableOpacity
                                key={item.label}
                                style={s.menuItem}
                                onPress={() => router.push(item.href as never)}
                                accessibilityRole="button"
                                accessibilityLabel={item.label}
                            >
                                <Ionicons name={item.icon} size={20} color={theme.primary} />
                                <Text style={[s.menuLabel, { color: theme.text }]}>{item.label}</Text>
                                <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}

                {query.trim() && menuSections.length === 0 && (
                    <EmptyState
                        icon="search-outline"
                        title="Aucun réglage trouvé"
                        message={`Rien ne correspond à « ${query.trim()} ».`}
                        action={{ label: 'Effacer la recherche', onPress: () => setQuery('') }}
                    />
                )}

                <TouchableOpacity
                    style={[s.menuItem, s.signOutItem]}
                    onPress={handleSignOut}
                    accessibilityRole="button"
                    accessibilityLabel="Se déconnecter"
                >
                    <Ionicons name="log-out-outline" size={20} color={theme.error} />
                    <Text style={[s.menuLabel, { color: theme.error }]}>Se déconnecter</Text>
                </TouchableOpacity>

                <Text style={[s.version, { color: theme.textSecondary }]}>
                    Kbouffe Gestionnaire v{Constants.expoConfig?.version ?? '—'}
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = (theme: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: { padding: 16, backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.border },
    title: { fontSize: 22, fontWeight: '700', color: theme.text },
    scroll: { padding: 16 },
    search: { marginBottom: 20 },
    restaurantCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: theme.surface, borderRadius: 14, padding: 16, marginBottom: 20 },
    restaurantAvatar: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    restaurantAvatarText: { fontSize: 24, fontWeight: '800' },
    restaurantInfo: { flex: 1 },
    restaurantName: { fontSize: 16, fontWeight: '700' },
    restaurantRole: { fontSize: 12, marginTop: 2 },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 12, fontWeight: '700', paddingHorizontal: 4, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.surface, borderRadius: 12, padding: 14, marginBottom: 8 },
    menuLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
    signOutItem: { marginTop: 12 },
    version: { textAlign: 'center', fontSize: 11, marginTop: 24 },
});
