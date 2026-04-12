import { View, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';

interface TabItem {
    name: string;
    label: string;
    icon: string;
    badge?: number;
}

interface CustomBottomTabsProps {
    tabs?: TabItem[];
    activeColor?: string;
    inactiveColor?: string;
    backgroundColor?: string;
    height?: number;
    borderTopColor?: string;
    borderTopWidth?: number;
    labelSize?: number;
    iconSize?: number;
    showBadge?: boolean;
    badgeColor?: string;
}

const defaultTabs: TabItem[] = [
    { name: 'index', label: 'Accueil', icon: 'home-outline' },
    { name: 'orders', label: 'Commandes', icon: 'basket-outline', badge: 0 },
    { name: 'catalog', label: 'Catalogue', icon: 'leaf-outline' },
    { name: 'notifications', label: 'Alertes', icon: 'notifications-outline', badge: 0 },
    { name: 'settings', label: 'Paramètres', icon: 'settings-outline' },
];

export function CustomBottomTabs({
    tabs = defaultTabs,
    activeColor = '#007AFF',
    inactiveColor = '#999',
    backgroundColor = '#fff',
    height = 70,
    borderTopColor = '#e0e0e0',
    borderTopWidth = 1,
    labelSize = 11,
    iconSize = 26,
    showBadge = true,
    badgeColor = '#FF3B30',
}: CustomBottomTabsProps) {
    const router = useRouter();
    const segments = useSegments();
    const currentTab = segments[segments.length - 1] || 'index';

    return (
        <View
            style={{
                flexDirection: 'row',
                justifyContent: 'space-around',
                alignItems: 'center',
                height,
                backgroundColor,
                borderTopWidth,
                borderTopColor,
                paddingBottom: 8,
                paddingTop: 4,
            }}
        >
            {tabs.map((tab) => {
                const isActive = currentTab === tab.name;
                return (
                    <Pressable
                        key={tab.name}
                        onPress={() => router.push(`/(tabs)/${tab.name}`)}
                        style={({ pressed }) => ({
                            flex: 1,
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            opacity: pressed ? 0.7 : 1,
                        })}
                    >
                        <View style={{ position: 'relative' }}>
                            <Ionicons
                                name={tab.icon as any}
                                size={iconSize}
                                color={isActive ? activeColor : inactiveColor}
                            />
                            {showBadge && tab.badge && tab.badge > 0 && (
                                <View
                                    style={{
                                        position: 'absolute',
                                        top: -6,
                                        right: -8,
                                        backgroundColor: badgeColor,
                                        borderRadius: 10,
                                        minWidth: 20,
                                        height: 20,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderWidth: 2,
                                        borderColor: backgroundColor,
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: '#fff',
                                            fontSize: 12,
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {tab.badge}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <Text
                            style={{
                                fontSize: labelSize,
                                color: isActive ? activeColor : inactiveColor,
                                fontWeight: isActive ? '700' : '500',
                                marginTop: 2,
                            }}
                        >
                            {tab.label}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}
