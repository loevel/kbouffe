import { StyleSheet, View, Text, Pressable, ScrollView, ActivityIndicator, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
    { icon: 'person', label: 'Mon profil', route: '/profile/edit' },
    { icon: 'location', label: 'Mes adresses de livraison', route: '/profile/addresses' },
    { icon: 'heart', label: 'Mes favoris', route: '/profile/favorites' },
    { icon: 'settings', label: 'Paramètres & Préférences', route: '/profile/settings' },
];

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
            <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: Spacing.xxl }}>
                <View style={[styles.emptyGuest, { paddingTop: Spacing.xxl * 2 }]}>
                    <View style={[styles.guestAvatar, { backgroundColor: theme.primary + '15' }]}>
                        <Ionicons name="person" size={48} color={theme.primary} />
                    </View>
                    <Text style={[styles.guestTitle, { color: theme.text }]}>Votre espace Kbouffe</Text>
                    <Text style={[styles.guestSubtitle, { color: theme.textMuted }]}>
                        Connectez-vous pour retrouver vos commandes, vos favoris et vos adresses en un clin d&apos;œil.
                    </Text>
                    <Pressable
                        style={[styles.authButton, { backgroundColor: theme.primary }]}
                        onPress={() => router.push('/(auth)/login')}
                    >
                        <Text style={styles.authButtonText}>Me connecter</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.authGhostButton, { borderColor: theme.border }]}
                        onPress={() => router.push('/(auth)/register')}
                    >
                        <Text style={[styles.authGhostButtonText, { color: theme.text }]}>Créer un compte</Text>
                    </Pressable>
                </View>
            </ScrollView>
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={{ paddingTop: Math.max(insets.top, Spacing.md), paddingBottom: Spacing.xxl + 80 }}>
            {/* Header / Profil */}
            <View style={styles.header}>
                <Text style={[styles.pageTitle, { color: theme.text }]}>Mon Profil</Text>
                <View style={[styles.profileCard, { backgroundColor: theme.surface }]}>
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
                    <View style={styles.profileInfo}>
                        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{displayName}</Text>
                        <Text style={[styles.phone, { color: theme.textMuted }]}>{displayPhone}</Text>
                    </View>
                </View>
            </View>

            {/* Statistiques */}
            <View style={styles.statsGrid}>
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

            {/* Menu */}
            <View style={styles.menuSection}>
                <View style={[styles.menuCard, { backgroundColor: theme.surface }]}>
                    {menuItems.map((item, index) => (
                        <Pressable
                            key={item.route}
                            onPress={() => router.push(item.route as any)}
                            style={({ pressed }) => [
                                styles.menuItem,
                                index !== menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
                                pressed && { opacity: 0.6 },
                            ]}
                        >
                            <View style={[styles.menuIconBox, { backgroundColor: theme.primary + '15' }]}>
                                <Ionicons name={item.icon} size={20} color={theme.primary} />
                            </View>
                            <Text style={[styles.menuLabel, { color: theme.text }]}>{item.label}</Text>
                            <Ionicons name="chevron-forward" size={20} color={theme.border} />
                        </Pressable>
                    ))}
                </View>
            </View>

            {/* Actions secondaires */}
            <View style={[styles.menuSection, { marginTop: Spacing.lg }]}>
                <View style={[styles.menuCard, { backgroundColor: theme.surface }]}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.menuItem,
                            { borderBottomWidth: 1, borderBottomColor: theme.border },
                            pressed && { opacity: 0.6 },
                        ]}
                        onPress={() => router.push('/support')}
                    >
                        <View style={[styles.menuIconBox, { backgroundColor: theme.textMuted + '15' }]}>
                            <Ionicons name="help-buoy" size={20} color={theme.textMuted} />
                        </View>
                        <Text style={[styles.menuLabel, { color: theme.text }]}>Centre d&apos;aide</Text>
                        <Ionicons name="chevron-forward" size={20} color={theme.border} />
                    </Pressable>
                    <Pressable
                        style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.6 }]}
                        onPress={confirmLogout}
                    >
                        <View style={[styles.menuIconBox, { backgroundColor: '#ef444415' }]}>
                            <Ionicons name="log-out" size={20} color="#ef4444" />
                        </View>
                        <Text style={[styles.menuLabel, { color: '#ef4444' }]}>Se déconnecter</Text>
                    </Pressable>
                </View>
            </View>

            <Text style={[styles.version, { color: theme.textMuted }]}>Kbouffe v1.0.0</Text>
        </ScrollView>
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
    pageTitle: { ...Typography.title1, marginBottom: Spacing.md, marginLeft: Spacing.xs },
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