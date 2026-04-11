import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/colors';
import { View, Text, StyleSheet } from 'react-native';

function TabIcon({ name, color, focused, badge }: { name: any; color: string; focused: boolean; badge?: number }) {
    return (
        <View>
            <Ionicons name={name} size={24} color={color} />
            {badge != null && badge > 0 && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        position: 'absolute', top: -4, right: -8,
        backgroundColor: '#dc2626', borderRadius: 8,
        minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
    },
    badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
});

export default function TabsLayout() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.tabIconDefault,
                tabBarStyle: {
                    backgroundColor: colorScheme === 'dark' ? '#1e293b' : '#ffffff',
                    borderTopColor: colorScheme === 'dark' ? '#334155' : '#e2e8f0',
                    paddingBottom: 4,
                    height: 60,
                },
                headerShown: false,
            }}
        >
            <Tabs.Screen
                name="orders"
                options={{
                    title: 'Commandes',
                    tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'receipt' : 'receipt-outline'} color={color} focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="menu"
                options={{
                    title: 'Menu',
                    tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'restaurant' : 'restaurant-outline'} color={color} focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="stats"
                options={{
                    title: 'Stats',
                    tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'bar-chart' : 'bar-chart-outline'} color={color} focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="notifications"
                options={{
                    title: 'Alertes',
                    tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'notifications' : 'notifications-outline'} color={color} focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Paramètres',
                    tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'settings' : 'settings-outline'} color={color} focused={focused} />,
                }}
            />
        </Tabs>
    );
}
