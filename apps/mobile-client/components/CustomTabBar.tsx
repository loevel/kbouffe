import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Shadows, Radii, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCart } from '@/contexts/cart-context';
import { useOrders } from '@/contexts/orders-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/contexts/auth-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallScreen = SCREEN_WIDTH < 360;
const ICON_SIZE = isSmallScreen ? 20 : 22;

const TAB_ICONS = {
  index: { active: 'home' as const, inactive: 'home-outline' as const, label: 'Accueil' },
  explore: { active: 'search' as const, inactive: 'search-outline' as const, label: 'Explorer' },
  orders: { active: 'receipt' as const, inactive: 'receipt-outline' as const, label: 'Commandes' },
  profile: { active: 'person' as const, inactive: 'person-outline' as const, label: 'Profil' },
};

type TabName = keyof typeof TAB_ICONS;

export function CustomTabBar({ state, navigation: navProp }: BottomTabBarProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { items } = useCart();
  const { activeOrderCount } = useOrders();
  const { user } = useAuth();

  const cartCount = items.length;

  return (
    <View
      style={[
        styles.outer,
        {
          paddingBottom: Math.max(insets.bottom, Spacing.sm),
          backgroundColor: theme.background,
        },
      ]}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.surfaceElevated,
            borderColor: theme.border,
          },
          Shadows.lg,
        ]}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const tabName = route.name as TabName;

          // Skip rendering hidden tabs
          if (!TAB_ICONS[tabName]) return null;

          const config = TAB_ICONS[tabName];

          const onPress = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            const event = navProp.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navProp.navigate(route.name, route.params);
            }
          };

          const badgeCount =
            tabName === 'index' ? cartCount : tabName === 'orders' ? activeOrderCount : 0;

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              onLongPress={() =>
                navProp.emit({
                  type: 'tabLongPress',
                  target: route.key,
                })
              }
              activeOpacity={0.8}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={`${config.label}${badgeCount > 0 ? `, ${badgeCount} notification${badgeCount > 1 ? 's' : ''}` : ''}`}
              style={[
                styles.tabItem,
                isFocused && {
                  backgroundColor: theme.primaryLight,
                  transform: [{ scale: 1.05 }],
                },
              ]}>
              <View style={styles.iconWrapper}>
                {tabName === 'profile' && user?.avatarUrl ? (
                  <Image
                    source={{ uri: user.avatarUrl }}
                    style={[
                      styles.avatar,
                      isFocused && { borderWidth: 2, borderColor: theme.primary },
                    ]}
                  />
                ) : (
                  <Ionicons
                    name={isFocused ? config.active : config.inactive}
                    size={ICON_SIZE}
                    color={isFocused ? theme.primary : theme.tabIconDefault}
                  />
                )}
                {badgeCount > 0 ? (
                  <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                    <Text style={styles.badgeText}>{badgeCount > 9 ? '9+' : badgeCount}</Text>
                  </View>
                ) : null}
              </View>

              <Text
                style={[
                  styles.label,
                  {
                    color: isFocused ? theme.primary : theme.tabIconDefault,
                    fontWeight: isFocused ? '700' : '600',
                  },
                ]}>
                {config.label}
              </Text>

              {isFocused && (
                <View style={[styles.activeIndicator, { backgroundColor: theme.primary }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radii.xl,
    padding: 6,
    gap: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.lg,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  label: {
    ...Typography.smallSemibold,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  activeIndicator: {
    width: 16,
    height: 3,
    borderRadius: 1.5,
    marginTop: 2,
  },
});
