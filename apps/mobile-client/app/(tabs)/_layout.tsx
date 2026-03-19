import { Tabs } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows, Radii } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useOrders } from '@/contexts/orders-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
    const colorScheme = useColorScheme();
    const { activeOrderCount } = useOrders();
    const theme = Colors[colorScheme ?? 'light'];
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: theme.tint,
                tabBarInactiveTintColor: theme.tabIconDefault,
                headerShown: false,
                tabBarButton: HapticTab,
                tabBarShowLabel: false,
                tabBarItemStyle: {
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: 64,
                },
                tabBarStyle: [
                    styles.tabBar,
                    {
                        backgroundColor: theme.surface,
                        bottom: insets.bottom > 0 ? insets.bottom : 20,
                    },
                    Shadows.lg,
                ],
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Accueil',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={styles.iconContainer}>
                            <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
                            {focused && <View style={[styles.activeIndicator, { backgroundColor: color }]} />}
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="explore"
                options={{
                    title: 'Explorer',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={styles.iconContainer}>
                            <Ionicons name={focused ? "search" : "search-outline"} size={24} color={color} />
                            {focused && <View style={[styles.activeIndicator, { backgroundColor: color }]} />}
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="orders"
                options={{
                    title: 'Commandes',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={styles.iconContainer}>
                            <View>
                                <Ionicons name={focused ? "receipt" : "receipt-outline"} size={24} color={color} />
                                {activeOrderCount > 0 && (
                                    <View style={[styles.badge, { backgroundColor: theme.primary, borderColor: theme.surface }]}>
                                        <Text style={styles.badgeText}>{activeOrderCount > 9 ? '9+' : activeOrderCount}</Text>
                                    </View>
                                )}
                            </View>
                            {focused && <View style={[styles.activeIndicator, { backgroundColor: color }]} />}
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profil',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={styles.iconContainer}>
                            <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
                            {focused && <View style={[styles.activeIndicator, { backgroundColor: color }]} />}
                        </View>
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        position: 'absolute',
        left: 24,
        right: 24,
        elevation: 0,
        height: 64,
        borderRadius: Radii.full,
        borderTopWidth: 0,
        paddingBottom: 0,
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
        paddingTop: 8,
    },
    activeIndicator: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginTop: 6,
    },
    badge: {
        position: 'absolute',
        top: -6,
        right: -8,
        borderRadius: 12,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
    },
});