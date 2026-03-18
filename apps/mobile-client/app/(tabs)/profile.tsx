import { StyleSheet, View, Text, Pressable, ScrollView, ActivityIndicator, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radii, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/auth-context';
import { useOrders } from '@/contexts/orders-context';
import { useLoyalty } from '@/contexts/loyalty-context';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';

interface MenuItem {
    icon: string;
    label: string;
    route: string;
    badge?: string;
}

const menuItems: MenuItem[] = [
    { icon: 'person-outline', label: 'Modifier le profil', route: '/profile/edit' },
    { icon: 'location-outline', label: 'Mes adresses', route: '/profile/addresses' },
    { icon: 'heart-outline', label: 'Favoris', route: '/profile/favorites' },
    { icon: 'settings-outline', label: 'Paramètres', route: '/profile/settings' },
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
            
            // React Native fetch implementation for file upload to Supabase storage
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

            // Update user profile via API (or auth context)
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

    if (!isAuthenticated) {
        return (
            <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: Spacing.xxl }}>
                <View style={[styles.emptyGuest, { paddingTop: Spacing.xxl }]}>
                    <View style={[styles.avatar, { backgroundColor: theme.primary + '18' }]}>
                        <Ionicons name="person-outline" size={36} color={theme.primary} />
                    </View>
                    <Text style={[styles.name, { color: theme.text }]}>Connectez-vous pour personnaliser votre experience</Text>
                    <Text style={[styles.phone, { color: theme.icon, textAlign: 'center', maxWidth: 280 }]}>
                        Accedez a votre profil, vos favoris, vos adresses et vos commandes en quelques secondes.
                    </Text>
                    <Pressable
                        style={[styles.authButton, { backgroundColor: theme.primary }]}
                        onPress={() => router.push('/(auth)/login')}
                    >
                        <Text style={styles.authButtonText}>Se connecter</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.authGhostButton, { borderColor: theme.border }]}
                        onPress={() => router.push('/(auth)/register')}
                    >
                        <Text style={[styles.authGhostButtonText, { color: theme.text }]}>Creer un compte</Text>
                    </Pressable>
                </View>
            </ScrollView>
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: Spacing.xxl }}>
            <View style={styles.header}>
                <Pressable onPress={pickImage} style={[styles.avatar, { backgroundColor: theme.primary, overflow: 'hidden' }]}>
                    {uploading ? (
                        <ActivityIndicator color="#fff" />
                    ) : user?.avatarUrl ? (
                        <Image source={{ uri: user.avatarUrl }} style={{ width: '100%', height: '100%' }} />
                    ) : (
                        <Text style={styles.avatarText}>
                            {displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </Text>
                    )}
                    <View style={styles.cameraBadge}>
                        <Ionicons name="camera" size={14} color="#fff" />
                    </View>
                </Pressable>
                <Text style={[styles.name, { color: theme.text }]}>{displayName}</Text>
                <Text style={[styles.phone, { color: theme.icon }]}>{displayPhone}</Text>
            </View>

            <View style={[styles.statsRow, { borderColor: theme.border }]}>
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: theme.text }]}>{totalOrders}</Text>
                    <Text style={[styles.statLabel, { color: theme.icon }]}>Commandes</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: theme.text }]}>{(totalSpent / 1000).toFixed(0)}k</Text>
                    <Text style={[styles.statLabel, { color: theme.icon }]}>FCFA dépensés</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: theme.text }]}>{favCount}</Text>
                    <Text style={[styles.statLabel, { color: theme.icon }]}>Favoris</Text>
                </View>
            </View>

            <View style={styles.menuSection}>
                {menuItems.map((item) => (
                    <Pressable
                        key={item.route}
                        onPress={() => router.push(item.route as any)}
                        style={({ pressed }) => [
                            styles.menuItem,
                            { backgroundColor: theme.background, borderColor: theme.border },
                            pressed && { opacity: 0.8 },
                        ]}
                    >
                        <View style={[styles.menuIcon, { backgroundColor: theme.primary + '15' }]}>
                            <Ionicons name={item.icon as any} size={20} color={theme.primary} />
                        </View>
                        <Text style={[styles.menuLabel, { color: theme.text }]}>{item.label}</Text>
                        <Ionicons name="chevron-forward" size={20} color={theme.icon} />
                    </Pressable>
                ))}
            </View>

            <View style={[styles.menuSection, { marginTop: Spacing.md }]}>
                <Pressable
                    style={({ pressed }) => [
                        styles.menuItem,
                        { backgroundColor: theme.background, borderColor: theme.border },
                        pressed && { opacity: 0.8 },
                    ]}
                    onPress={() => router.push('/support')}
                >
                    <View style={[styles.menuIcon, { backgroundColor: '#ef444415' }]}>
                        <Ionicons name="help-circle-outline" size={20} color="#ef4444" />
                    </View>
                    <Text style={[styles.menuLabel, { color: theme.text }]}>Aide & support</Text>
                    <Ionicons name="chevron-forward" size={20} color={theme.icon} />
                </Pressable>
                <Pressable
                    style={({ pressed }) => [
                        styles.menuItem,
                        { backgroundColor: theme.background, borderColor: theme.border },
                        pressed && { opacity: 0.8 },
                    ]}
                    onPress={async () => {
                        try {
                            await logout();
                            router.replace('/(auth)/login');
                        } catch {
                            Alert.alert('Erreur', 'Impossible de vous déconnecter pour le moment.');
                        }
                    }}
                >
                    <View style={[styles.menuIcon, { backgroundColor: '#ef444415' }]}>
                        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                    </View>
                    <Text style={[styles.menuLabel, { color: '#ef4444' }]}>Déconnexion</Text>
                    <Ionicons name="chevron-forward" size={20} color={theme.icon} />
                </Pressable>
            </View>

            <Text style={[styles.version, { color: theme.icon }]}>Kbouffe v1.0.0</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    emptyGuest: { alignItems: 'center', paddingHorizontal: Spacing.lg, gap: Spacing.md },
    header: { alignItems: 'center', padding: Spacing.lg },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
        position: 'relative',
    },
    cameraBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: Colors.light.primary,
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    avatarText: { color: '#fff', fontSize: 24, fontWeight: '700' },
    authButton: {
        marginTop: Spacing.md,
        minWidth: 220,
        height: 52,
        borderRadius: Radii.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    authButtonText: { color: '#fff', ...Typography.body, fontWeight: '700' },
    authGhostButton: {
        minWidth: 220,
        height: 52,
        borderRadius: Radii.lg,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    authGhostButtonText: { ...Typography.body, fontWeight: '600' },
    name: { ...Typography.title3, marginBottom: 4 },
    phone: { ...Typography.body },
    statsRow: {
        flexDirection: 'row',
        marginHorizontal: Spacing.md,
        borderRadius: Radii.lg,
        borderWidth: 1,
        padding: Spacing.md,
        marginBottom: Spacing.lg,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { ...Typography.title2, marginBottom: 2 },
    statLabel: { ...Typography.caption },
    statDivider: { width: 1, marginVertical: Spacing.xs },
    menuSection: { paddingHorizontal: Spacing.md, gap: Spacing.xs },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: Radii.lg,
        borderWidth: 1,
        gap: Spacing.md,
    },
    menuIcon: {
        width: 40,
        height: 40,
        borderRadius: Radii.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuLabel: { ...Typography.body, fontWeight: '500', flex: 1 },
    version: { textAlign: 'center', ...Typography.small, marginTop: Spacing.xl },
});
