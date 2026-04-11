import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';

export default function SettingsScreen() {
    const { profile, signOut } = useAuth();
    const theme = useTheme();
    const router = useRouter();

    const handleSignOut = () => {
        Alert.alert('Se déconnecter', 'Voulez-vous vraiment vous déconnecter ?', [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Déconnecter', style: 'destructive', onPress: signOut },
        ]);
    };

    const s = styles(theme);

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
                            {profile?.memberRole ?? 'Gérant'} · {profile?.phone ?? ''}
                        </Text>
                    </View>
                </View>

                {/* Menu items */}
                {[
                    { label: 'Horaires d\'ouverture', icon: 'time-outline', onPress: () => {} },
                    { label: 'Informations du restaurant', icon: 'business-outline', onPress: () => {} },
                    { label: 'Zones de livraison', icon: 'map-outline', onPress: () => {} },
                    { label: 'Modes de paiement', icon: 'card-outline', onPress: () => {} },
                    { label: 'Notifications push', icon: 'notifications-outline', onPress: () => {} },
                ].map((item) => (
                    <TouchableOpacity key={item.label} style={s.menuItem} onPress={item.onPress}>
                        <Ionicons name={item.icon as any} size={20} color={theme.primary} />
                        <Text style={[s.menuLabel, { color: theme.text }]}>{item.label}</Text>
                        <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
                    </TouchableOpacity>
                ))}

                <TouchableOpacity style={[s.menuItem, s.signOutItem]} onPress={handleSignOut}>
                    <Ionicons name="log-out-outline" size={20} color="#dc2626" />
                    <Text style={[s.menuLabel, { color: '#dc2626' }]}>Se déconnecter</Text>
                </TouchableOpacity>

                <Text style={[s.version, { color: theme.textSecondary }]}>Kbouffe Merchant v1.0.0</Text>
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
    menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.surface, borderRadius: 12, padding: 14, marginBottom: 8 },
    menuLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
    signOutItem: { marginTop: 12 },
    version: { textAlign: 'center', fontSize: 11, marginTop: 24 },
});
