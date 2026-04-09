import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Shadows, Radii, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCart } from '@/contexts/cart-context';
import { useOrders } from '@/contexts/orders-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_ICONS = {
  index: { active: 'home', inactive: 'home-outline', label: 'Accueil' },
  explore: { active: 'search', inactive: 'search-outline', label: 'Explorer' },
  favorites: { active: 'heart', inactive: 'heart-outline', label: 'Favoris' },
  orders: { active: 'receipt', inactive: 'receipt-outline', label: 'Commandes' },
  profile: { active: 'person', inactive: 'person-outline', label: 'Profil' },
};

type TabName = keyof typeof TAB_ICONS;

export function CustomTabBar({ state, navigation: navProp }: BottomTabBarProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { items } = useCart();
  const { activeOrderCount } = useOrders();

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
          const config = TAB_ICONS[tabName] ?? {
            active: 'ellipse',
            inactive: 'ellipse-outline',
            label: route.name,
          };

          const onPress = () => {
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
            tabName === 'explore' ? cartCount : tabName === 'orders' ? activeOrderCount : 0;

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
              style={[
                styles.tabItem,
                isFocused && {
                  backgroundColor: theme.primaryLight,
                },
              ]}>
              <View style={styles.iconWrapper}>
                <Ionicons
                  name={isFocused ? config.active : config.inactive}
                  size={22}
                  color={isFocused ? theme.primary : theme.tabIconDefault}
                />
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
});
