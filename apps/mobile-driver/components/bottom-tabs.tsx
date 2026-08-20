import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';

const ONGLETS = [
    { name: 'index', label: 'Courses', icon: 'bicycle-outline' },
    { name: 'historique', label: 'Historique', icon: 'time-outline' },
    { name: 'gains', label: 'Gains', icon: 'cash-outline' },
    { name: 'profil', label: 'Profil', icon: 'person-outline' },
] as const;

export function BottomTabs({ badgeCourses = 0 }: { badgeCourses?: number }) {
    const theme = useTheme();
    const router = useRouter();
    const segments = useSegments();
    const insets = useSafeAreaInsets();
    const courant = segments[segments.length - 1] || 'index';

    return (
        <View
            style={[
                styles.barre,
                {
                    backgroundColor: theme.card,
                    borderTopColor: theme.border,
                    paddingBottom: Math.max(insets.bottom, 8),
                },
            ]}
        >
            {ONGLETS.map((onglet) => {
                const actif = courant === onglet.name;
                const badge = onglet.name === 'index' ? badgeCourses : 0;

                return (
                    <Pressable
                        key={onglet.name}
                        onPress={() => router.replace(`/(tabs)/${onglet.name}` as any)}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: actif }}
                        accessibilityLabel={onglet.label}
                        style={({ pressed }) => [styles.onglet, { opacity: pressed ? 0.7 : 1 }]}
                    >
                        <View>
                            <Ionicons
                                name={onglet.icon as any}
                                size={24}
                                color={actif ? theme.tabIconSelected : theme.tabIconDefault}
                            />
                            {badge > 0 && (
                                <View style={[styles.badge, { backgroundColor: theme.error, borderColor: theme.card }]}>
                                    <Text style={styles.badgeTexte}>{badge > 9 ? '9+' : badge}</Text>
                                </View>
                            )}
                        </View>
                        <Text
                            style={[
                                styles.label,
                                {
                                    color: actif ? theme.tabIconSelected : theme.tabIconDefault,
                                    fontWeight: actif ? '700' : '500',
                                },
                            ]}
                        >
                            {onglet.label}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    barre: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        borderTopWidth: 1,
        paddingTop: 8,
    },
    onglet: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
    label: { fontSize: 11 },
    badge: {
        position: 'absolute',
        top: -5,
        right: -9,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 3,
    },
    badgeTexte: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
