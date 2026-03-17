import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MOCK_ORDERS } from '@/data/mocks';
import { useAuth } from '@/contexts/auth-context';

export default function TabLayout() {
    const colorScheme = useColorScheme();
    const { isAuthenticated } = useAuth();
    const activeOrderCount = MOCK_ORDERS.filter(o => !['completed', 'cancelled'].includes(o.status)).length;

    if (!isAuthenticated) {
        return <Redirect href="/(auth)/login" />;
    }

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
                headerShown: false,
                tabBarButton: HapticTab,
                tabBarStyle: {
                    borderTopColor: Colors[colorScheme ?? 'light'].border,
                },
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Accueil',
                    tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="explore"
                options={{
                    title: 'Explorer',
                    tabBarIcon: ({ color, size }) => <Ionicons name="search" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="orders"
                options={{
                    title: 'Commandes',
                    tabBarIcon: ({ color, size }) => (
                        <View>
                            <Ionicons name="receipt-outline" size={size} color={color} />
                            {activeOrderCount > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{activeOrderCount}</Text>
                                </View>
                            )}
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profil',
                    tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    badge: {
        position: 'absolute',
        top: -4,
        right: -8,
        backgroundColor: '#f97316',
        borderRadius: 10,
        width: 18,
        height: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
});
