import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { usePermissions } from '@/hooks/use-permission';
import { getMemberRoleLabel } from '@/lib/member-role';
import type { Permission } from '@/lib/permissions';

export default function SettingsScreen() {
    const { profile, signOut } = useAuth();
    const theme = useTheme();
    const router = useRouter();
    const can = usePermissions();

    const handleSignOut = () => {
        Alert.alert('Se déconnecter', 'Voulez-vous vraiment vous déconnecter ?', [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Déconnecter', style: 'destructive', onPress: signOut },
        ]);
    };

    const s = styles(theme);

    type MenuItem = { label: string; icon: string; href: string; permission?: Permission };
    type MenuSection = { title: string; items: MenuItem[] };

    const allSections: MenuSection[] = [
        {
            title: 'Opérations',
            items: [
                { label: 'Statistiques', icon: 'bar-chart-outline', href: '/stats', permission: 'dashboard:read' },
                { label: 'Rapports', icon: 'document-text-outline', href: '/reports', permission: 'finances:read' },
                { label: 'Messages', icon: 'chatbubble-ellipses-outline', href: '/messages' },
                { label: 'Finances', icon: 'cash-outline', href: '/finances', permission: 'finances:read' },
                { label: 'Réservations', icon: 'calendar-outline', href: '/reservations', permission: 'reservations:read' },
                { label: 'Équipe', icon: 'people-outline', href: '/team', permission: 'team:read' },
                { label: 'Avis clients', icon: 'star-outline', href: '/reviews', permission: 'customers:read' },
                { label: 'Clients', icon: 'people-circle-outline', href: '/customers', permission: 'customers:read' },
                { label: 'Caisse', icon: 'wallet-outline', href: '/caisse', permission: 'orders:manage' },
                { label: 'Tables', icon: 'square-outline', href: '/tables', permission: 'tables:manage' },
                { label: 'Cuisine', icon: 'restaurant-outline', href: '/kitchen', permission: 'orders:read' },
            ],
        },
        {
            title: 'Offres & Promotions',
            items: [
                { label: 'Promotions', icon: 'pricetag-outline', href: '/promotions', permission: 'marketing:read' },
                { label: 'Fidélité', icon: 'heart-outline', href: '/loyalty', permission: 'marketing:read' },
                { label: 'Cartes cadeaux', icon: 'gift-outline', href: '/gift-cards', permission: 'marketing:read' },
            ],
        },
        {
            title: 'Outils',
            items: [
                { label: 'Analytique', icon: 'bar-chart-outline', href: '/analytics', permission: 'finances:read' },
                { label: 'Vitrine', icon: 'storefront-outline', href: '/showcase', permission: 'store:manage' },
                { label: 'Marketplace', icon: 'bag-outline', href: '/marketplace', permission: 'store:manage' },
                { label: 'Support', icon: 'help-circle-outline', href: '/support' },
            ],
        },
        {
            title: 'Configuration',
            items: [
                { label: 'Informations du restaurant', icon: 'business-outline', href: '/settings/restaurant', permission: 'settings:manage' },
                { label: "Horaires d'ouverture", icon: 'time-outline', href: '/settings/hours', permission: 'settings:manage' },
                { label: 'Zones de livraison', icon: 'map-outline', href: '/settings/zones', permission: 'settings:manage' },
                { label: 'Modes de paiement', icon: 'card-outline', href: '/settings/payments', permission: 'settings:manage' },
                { label: 'Notifications push', icon: 'notifications-outline', href: '/settings/notifications' },
                { label: 'Identité visuelle', icon: 'palette-outline', href: '/settings/branding', permission: 'settings:manage' },
                { label: 'Service sur place', icon: 'restaurant-outline', href: '/settings/dine-in', permission: 'settings:manage' },
                { label: 'Galerie photos', icon: 'images-outline', href: '/settings/gallery', permission: 'settings:manage' },
                { label: 'Sécurité', icon: 'shield-checkmark-outline', href: '/settings/security' },
                { label: 'Données & Export', icon: 'download-outline', href: '/settings/data', permission: 'finances:read' },
            ],
        },
    ];

    const menuSections = allSections
        .map((section) => ({
            ...section,
            items: section.items.filter((item) => !item.permission || can(item.permission)),
        }))
        .filter((section) => section.items.length > 0);

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
                            {getMemberRoleLabel(profile?.memberRole)} · {profile?.phone ?? ''}
                        </Text>
                    </View>
                </View>

                {/* Menu sections */}
                {menuSections.map((section) => (
                    <View key={section.title} style={s.section}>
                        <Text style={[s.sectionTitle, { color: theme.textSecondary }]}>{section.title}</Text>
                        {section.items.map((item) => (
                            <TouchableOpacity key={item.label} style={s.menuItem} onPress={() => router.push(item.href as never)}>
                                <Ionicons name={item.icon as any} size={20} color={theme.primary} />
                                <Text style={[s.menuLabel, { color: theme.text }]}>{item.label}</Text>
                                <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}

                <TouchableOpacity style={[s.menuItem, s.signOutItem]} onPress={handleSignOut}>
                    <Ionicons name="log-out-outline" size={20} color="#dc2626" />
                    <Text style={[s.menuLabel, { color: '#dc2626' }]}>Se déconnecter</Text>
                </TouchableOpacity>

                <Text style={[s.version, { color: theme.textSecondary }]}>Kbouffe Gestionnaire v1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = (theme: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: { padding: 16, backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.border },
    title: { fontSize: 22, fontWeight: '700', color: theme.text },
    scroll: { padding: 16 },
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
