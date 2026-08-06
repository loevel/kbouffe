import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/colors';
import { Springs } from '@/constants/theme';
import { View, Text, StyleSheet } from 'react-native';

type TabIconName = keyof typeof Ionicons.glyphMap;

// react-navigation's default tab label truncates with an ellipsis ("Com...",
// "Para...") once 7 tabs share 402pt of width — there just isn't room for
// full French words at a fixed font size. Shrinking the font instead of
// cutting the word keeps every label readable.
function TabLabel({ title, color }: { title: string; color: string }) {
    return (
        <Text
            style={[tabLabelStyles.label, { color }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            allowFontScaling={false}
        >
            {title}
        </Text>
    );
}

const tabLabelStyles = StyleSheet.create({
    label: {
        fontSize: 10,
        fontWeight: '700',
        marginTop: 4,
        letterSpacing: 0.2,
        textAlign: 'center',
    },
});

function TabIcon({ name, color, badge, focused }: { name: TabIconName; color: string; badge?: number; focused: boolean }) {
    const scale = useSharedValue(1);

    useEffect(() => {
        scale.value = withSpring(focused ? 1.15 : 1, Springs.snappy);
    }, [focused, scale]);

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <View style={styles.iconContainer}>
            <Animated.View style={animStyle}>
                <Ionicons name={name} size={22} color={color} />
            </Animated.View>
            {badge != null && badge > 0 && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
                </View>
            )}
            {focused && <View style={[styles.indicator, { backgroundColor: color }]} />}
        </View>
    );
}

const styles = StyleSheet.create({
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#ef4444',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: '#fff',
    },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
    indicator: {
        position: 'absolute',
        bottom: -8,
        width: 24,
        height: 3,
        borderRadius: 1.5,
    },
});

export default function TabsLayout() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme];

    return (
        <Tabs
            screenListeners={{
                tabPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
            }}
            screenOptions={{
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.tabIconDefault,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    paddingBottom: 10,
                    paddingTop: 8,
                    height: 72,
                    elevation: 8,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                },
                tabBarItemStyle: {
                    paddingVertical: 4,
                    paddingHorizontal: 1,
                },
                tabBarHideOnKeyboard: true,
                headerShown: false,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Aperçu',
                    tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'home' : 'home-outline'} color={color} focused={focused} />,
                    tabBarLabel: ({ color }) => <TabLabel title="Aperçu" color={color} />,
                }}
            />
            <Tabs.Screen
                name="orders"
                options={{
                    title: 'Commandes',
                    tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'receipt' : 'receipt-outline'} color={color} focused={focused} />,
                    tabBarLabel: ({ color }) => <TabLabel title="Commandes" color={color} />,
                }}
            />
            <Tabs.Screen
                name="menu"
                options={{
                    title: 'Menu',
                    tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'restaurant' : 'restaurant-outline'} color={color} focused={focused} />,
                    tabBarLabel: ({ color }) => <TabLabel title="Menu" color={color} />,
                }}
            />
            <Tabs.Screen
                name="stats"
                options={{
                    title: 'Stats',
                    tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'bar-chart' : 'bar-chart-outline'} color={color} focused={focused} />,
                    tabBarLabel: ({ color }) => <TabLabel title="Stats" color={color} />,
                }}
            />
            <Tabs.Screen
                name="messages"
                options={{
                    title: 'Messages',
                    tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'} color={color} focused={focused} />,
                    tabBarLabel: ({ color }) => <TabLabel title="Messages" color={color} />,
                }}
            />
            <Tabs.Screen
                name="notifications"
                options={{
                    // Previously undeclared — expo-router auto-added this file as
                    // a raw 7th tab with the filename as title ("notifi...") and
                    // no icon (rendered as react-navigation's fallback glyph, the
                    // stray "▽" seen in the tab bar). Declaring it explicitly
                    // gives it a real icon/label and keeps it out of the way of
                    // the truncation fix above.
                    title: 'Activité',
                    tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'notifications' : 'notifications-outline'} color={color} focused={focused} />,
                    tabBarLabel: ({ color }) => <TabLabel title="Activité" color={color} />,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Paramètres',
                    tabBarLabel: ({ color }) => <TabLabel title="Paramètres" color={color} />,
                    tabBarIcon: ({ color, focused }) => <TabIcon name={focused ? 'settings' : 'settings-outline'} color={color} focused={focused} />,
                }}
            />
        </Tabs>
    );
}
