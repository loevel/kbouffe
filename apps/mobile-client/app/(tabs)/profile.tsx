import { StyleSheet, View, Text, Pressable, ScrollView, ActivityIndicator, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { CustomHeader } from '@/components/CustomHeader';
import { Colors, Spacing, Radii, Typography, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/auth-context';
import { useOrders } from '@/contexts/orders-context';
import { useLoyalty } from '@/contexts/loyalty-context';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';

interface MenuItem {
    icon: any;
    label: string;
    route: string;
}

const menuItems: MenuItem[] = [
    { icon: 'shield-outline', label: 'Vérification du compte', route: '/profile/account-verification' },
    { icon: 'person', label: 'Mon profil', route: '/profile/edit' },
    { icon: 'location', label: 'Mes adresses de livraison', route: '/profile/addresses' },
    { icon: 'heart', label: 'Mes favoris', route: '/profile/favorites' },
    { icon: 'calendar', label: 'Mes réservations', route: '/profile/reservations' },
    { icon: 'card', label: 'Méthodes de paiement', route: '/profile/payments' },
    { icon: 'nutrition', label: 'Préférences alimentaires', route: '/profile/preferences' },
    { icon: 'shield-checkmark', label: 'Sécurité', route: '/profile/security' },
    { icon: 'settings', label: 'Paramètres', route: '/profile/settings' },
];

// Composant MenuItem réutilisable
const MenuItemComponent = ({ item, theme, isLast, onPress }: { item: MenuItem; theme: any; isLast: boolean; onPress: () => void }) => (
    <Pressable
        onPress={onPress}
        style={({ pressed }) => [
            styles.menuItem,
            !isLast && { borderBottomWidth: 1, borderBottomColor: theme.border },
            pressed && { opacity: 0.6 },
        ]}
    >
        <View style={[styles.menuIconBox, { backgroundColor: theme.primary + '15' }]}>
            <Ionicons name={item.icon as any} size={20} color={theme.primary} />
        </View>
        <Text style={[styles.menuLabel, { color: theme.text }]}>{item.label}</Text>
        <Ionicons name="chevron-forward" size={20} color={theme.border} />
    </Pressable>
);

export default function ProfileScreen() {
    const router = useRouter();
    const { user, isAuthenticated, logout, updateProfile } = useAuth();
    const [uploading, setUploading] = useState(false);
    const { orders } = useOrders();
    const { favoriteRestaurantIds, favoriteProductIds } = useLoyalty();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const displayName = user?.fullName ?? 'Utilisateur Kbouffe';
    const displayPhone = user?.phone ?? 'Ajoutez votre numéro';

    const totalOrders = orders.filter(o => ['completed', 'delivered'].includes(o.status)).length;
    const totalSpent = orders.filter(o => ['completed', 'delivered'].includes(o.status)).reduce((s, o) => s + o.total, 0);
    const favCount = favoriteRestaurantIds.length + favoriteProductIds.length;

    const pickImage = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && user?.id) {
            uploadAvatar(result.assets[0].uri);
        }
    };

    const uploadAvatar = async (uri: string) => {
        setUploading(true);
        try {
            const fileExt = uri.split('.').pop() || 'jpg';
            const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
            
            const formData = new FormData();
            formData.append('file', {
                uri,
                name: `avatar.${fileExt}`,
                type: `image/${fileExt}`
            } as any);

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, formData, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);

            if (updateProfile) {
                await updateProfile({ avatarUrl: publicUrl });
            }

        } catch (error: any) {
            console.error('Error uploading avatar:', error);
            Alert.alert('Erreur', 'Impossible de mettre à jour la photo de profil.');
        } finally {
            setUploading(false);
        }
    };

    const confirmLogout = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
            'Déconnexion',
            'Êtes-vous sûr de vouloir vous déconnecter ?',
            [
                { text: 'Annuler', style: 'cancel' },
                { 
                    text: 'Se déconnecter', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await logout();
                            router.replace('/(auth)/login');
                        } catch {
                            Alert.alert('Erreur', 'Impossible de vous déconnecter.');
                        }
                    }
                }
            ]
        );
    };

    if (!isAuthenticated) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, flex: 1 }]}>
                <CustomHeader
                    title="Mon Profil"
                    showSearch={false}
                    showCart={false}
                    showBack={false}
                />
                <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>
                <View style={[styles.emptyGuest, { paddingTop: Spacing.xxl * 2 }]}>
                    <View style={[styles.guestAvatar, { backgroundColor: theme.primary + '15' }]}>
                        <Ionicons name="person" size={48} color={theme.primary} />
                    </View>
                    <Text style={[styles.guestTitle, { color: theme.text }]}>Votre espace Kbouffe</Text>
                    <Text style={[styles.guestSubtitle, { color: theme.textMuted }]}>
                        Connectez-vous pour retrouver vos commandes, vos favoris et vos adresses en un clin d&apos;œil.
                    </Text>
                    <Pressable
                        style={({ pressed }) => [
                            styles.authButton, 
                            { backgroundColor: theme.primary },
                            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
                        ]}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.push('/(auth)/login');
                        }}
                    >
                        <Text style={styles.authButtonText}>Me connecter</Text>
                    </Pressable>
                    <Pressable
                        style={({ pressed }) => [
                            styles.authGhostButton, 
                            { borderColor: theme.border },
                            pressed && { opacity: 0.8, backgroundColor: theme.border + '30' }
                        ]}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.push('/(auth)/register');
                        }}
                    >
                        <Text style={[styles.authGhostButtonText, { color: theme.text }]}>Créer un compte</Text>
                    </Pressable>
                </View>
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background, flex: 1 }]}>
            <CustomHeader
                title="Mon Profil"
                showSearch={false}
                showCart={false}
                showBack={false}
            />
            <ScrollView contentContainerStyle={{ paddingBottom: Spacing.xxl + 80 }}>
            {/* ── PROFILE CARD ── */}
            <View style={[styles.profileCard, { backgroundColor: theme.surface, marginHorizontal: Spacing.md, marginVertical: Spacing.md }]}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.lg }}>
                    <Pressable onPress={pickImage} style={[styles.avatar, { backgroundColor: theme.primaryLight }]}>
                        {uploading ? (
                            <ActivityIndicator color={theme.primary} />
                        ) : user?.avatarUrl ? (
                            <Image source={{ uri: user.avatarUrl }} style={{ width: '100%', height: '100%' }} />
                        ) : (
                            <Text style={[styles.avatarText, { color: theme.primary }]}>
                                {displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </Text>
                        )}
                        <View style={[styles.cameraBadge, { backgroundColor: theme.surface }]}>
                            <Ionicons name="camera" size={12} color={theme.text} />
                        </View>
                    </Pressable>
                    <View style={[styles.profileInfo, { flex: 1 }]}>
                        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{displayName}</Text>
                        <Text style={[styles.phone, { color: theme.textMuted }]}>{displayPhone}</Text>
                        <Text style={[styles.memberBadge, { color: theme.primary, marginTop: Spacing.xs }]}>Membre depuis 2024</Text>
                    </View>
                    <Pressable
                        onPress={() => router.push('/profile/edit')}
                        style={[styles.editBtn, { backgroundColor: theme.primary + '15' }]}
                    >
                        <Ionicons name="pencil" size={18} color={theme.primary} />
                    </Pressable>
                </View>

                {/* Quick Actions Row */}
                <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                    <Pressable
                        onPress={() => router.push('/offers')}
                        style={[styles.quickActionBtn, { borderColor: theme.primary }]}
                    >
                        <Ionicons name="pricetag-outline" size={18} color={theme.primary} />
                        <Text style={[styles.quickActionText, { color: theme.primary }]}>Offres</Text>
                    </Pressable>
                    <Pressable
                        onPress={() => router.push('/notifications')}
                        style={[styles.quickActionBtn, { borderColor: theme.border }]}
                    >
                        <Ionicons name="notifications-outline" size={18} color={theme.text} />
                        <Text style={[styles.quickActionText, { color: theme.text }]}>Notifications</Text>
                    </Pressable>
                </View>
            </View>

            {/* ── STATISTIQUES ── */}
            <View style={[styles.statsGrid, { paddingHorizontal: Spacing.md, marginBottom: Spacing.lg }]}>
                <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
                    <View style={[styles.statIconBox, { backgroundColor: theme.primary + '15' }]}>
                        <Ionicons name="receipt" size={20} color={theme.primary} />
                    </View>
                    <Text style={[styles.statValue, { color: theme.text }]}>{totalOrders}</Text>
                    <Text style={[styles.statLabel, { color: theme.textMuted }]}>Commandes</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
                    <View style={[styles.statIconBox, { backgroundColor: '#10b98115' }]}>
                        <Ionicons name="wallet" size={20} color="#10b981" />
                    </View>
                    <Text style={[styles.statValue, { color: theme.text }]}>{totalSpent > 0 ? (totalSpent / 1000).toFixed(0) + 'k' : '0'}</Text>
                    <Text style={[styles.statLabel, { color: theme.textMuted }]}>Dépenses</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
                    <View style={[styles.statIconBox, { backgroundColor: '#ef444415' }]}>
                        <Ionicons name="heart" size={20} color="#ef4444" />
                    </View>
                    <Text style={[styles.statValue, { color: theme.text }]}>{favCount}</Text>
                    <Text style={[styles.statLabel, { color: theme.textMuted }]}>Favoris</Text>
                </View>
            </View>

            {/* ── MENU GROUPÉ ── */}

            {/* Section Compte */}
            <View style={styles.menuSection}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Compte</Text>
                <View style={[styles.menuCard, { backgroundColor: theme.surface }]}>
                    {menuItems.slice(0, 3).map((item, index) => (
                        <MenuItemComponent
                            key={item.route}
                            item={item}
                            theme={theme}
                            isLast={index === 2}
                            onPress={() => {
                                Haptics.selectionAsync();
                                router.push(item.route as any);
                            }}
                        />
                    ))}
                </View>
            </View>

            {/* Section Préférences */}
            <View style={styles.menuSection}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Préférences</Text>
                <View style={[styles.menuCard, { backgroundColor: theme.surface }]}>
                    {menuItems.slice(3, 7).map((item, index) => (
                        <MenuItemComponent
                            key={item.route}
                            item={item}
                            theme={theme}
                            isLast={index === 3}
                            onPress={() => {
                                Haptics.selectionAsync();
                                router.push(item.route as any);
                            }}
                        />
                    ))}
                </View>
            </View>

            {/* Section Sécurité */}
            <View style={styles.menuSection}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Sécurité</Text>
                <View style={[styles.menuCard, { backgroundColor: theme.surface }]}>
                    {menuItems.slice(7).map((item, index) => (
                        <MenuItemComponent
                            key={item.route}
                            item={item}
                            theme={theme}
                            isLast={index === menuItems.length - 8}
                            onPress={() => {
                                Haptics.selectionAsync();
                                router.push(item.route as any);
                            }}
                        />
                    ))}
                </View>
            </View>

            {/* Section Support & Déconnexion */}
            <View style={styles.menuSection}>
                <View style={[styles.menuCard, { backgroundColor: theme.surface }]}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.menuItem,
                            { borderBottomWidth: 1, borderBottomColor: theme.border },
                            pressed && { opacity: 0.6 },
                        ]}
                        onPress={() => {
                            Haptics.selectionAsync();
                            router.push('/support');
                        }}
                    >
                        <View style={[styles.menuIconBox, { backgroundColor: theme.textMuted + '15' }]}>
                            <Ionicons name="help-buoy" size={20} color={theme.textMuted} />
                        </View>
                        <Text style={[styles.menuLabel, { color: theme.text }]}>Centre d&apos;aide</Text>
                        <Ionicons name="chevron-forward" size={20} color={theme.border} />
                    </Pressable>
                    <Pressable
                        style={({ pressed }) => [
                            styles.menuItem,
                            { backgroundColor: '#ef444408' },
                            pressed && { opacity: 0.6 },
                        ]}
                        onPress={confirmLogout}
                    >
                        <View style={[styles.menuIconBox, { backgroundColor: '#ef444415' }]}>
                            <Ionicons name="log-out" size={20} color="#ef4444" />
                        </View>
                        <Text style={[styles.menuLabel, { color: '#ef4444' }]}>Se déconnecter</Text>
                        <Ionicons name="chevron-forward" size={20} color="#ef4444" />
                    </Pressable>
                </View>
            </View>

            <Text style={[styles.version, { color: theme.textMuted }]}>Kbouffe v1.0.0</Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    emptyGuest: { alignItems: 'center', paddingHorizontal: Spacing.lg, gap: Spacing.md },
    guestAvatar: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
    guestTitle: { ...Typography.title2, textAlign: 'center' },
    guestSubtitle: { ...Typography.body, textAlign: 'center', lineHeight: 24, marginBottom: Spacing.lg },
    authButton: { width: '100%', height: 56, borderRadius: Radii.xl, alignItems: 'center', justifyContent: 'center' },
    authButtonText: { color: '#fff', ...Typography.bodySemibold },
    authGhostButton: { width: '100%', height: 56, borderRadius: Radii.xl, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    authGhostButtonText: { ...Typography.bodySemibold },
    
    header: { paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
    pageTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
    pageTitle: { ...Typography.title1, marginLeft: Spacing.xs },
    headerActions: { flexDirection: 'row', gap: Spacing.sm },
    headerActionBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: Radii.xl,
        ...Shadows.sm,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    cameraBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: { fontSize: 20, fontWeight: '800' },
    profileInfo: { flex: 1, marginLeft: Spacing.md },
    name: { ...Typography.title3, marginBottom: 2 },
    phone: { ...Typography.caption },
    memberBadge: { ...Typography.small, fontWeight: '600' },
    editBtn: {
        width: 40,
        height: 40,
        borderRadius: Radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickActionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.xs,
        paddingVertical: Spacing.sm,
        borderRadius: Radii.lg,
        borderWidth: 1,
    },
    quickActionText: { ...Typography.small, fontWeight: '600' },
    sectionTitle: { ...Typography.bodySemibold, marginLeft: Spacing.md, marginBottom: Spacing.sm },

    statsGrid: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.md,
        gap: Spacing.md,
        marginBottom: Spacing.xl,
    },
    statCard: {
        flex: 1,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xs,
        borderRadius: Radii.xl,
        alignItems: 'center',
        ...Shadows.sm,
    },
    statIconBox: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
    },
    statValue: { ...Typography.title3, fontWeight: '800', marginBottom: 2 },
    statLabel: { ...Typography.small, fontWeight: '500', textAlign: 'center' },
    
    menuSection: { paddingHorizontal: Spacing.md },
    menuCard: {
        borderRadius: Radii.xl,
        overflow: 'hidden',
        ...Shadows.sm,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        gap: Spacing.md,
    },
    menuIconBox: {
        width: 40,
        height: 40,
        borderRadius: Radii.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuLabel: { ...Typography.bodySemibold, flex: 1 },
    version: { textAlign: 'center', ...Typography.caption, marginTop: Spacing.xxl },
});