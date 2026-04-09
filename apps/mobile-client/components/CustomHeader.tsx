import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Shadows, Radii, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCart } from '@/contexts/cart-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CustomHeaderProps {
  title?: string;
  showSearch?: boolean;
  onSearchChange?: (text: string) => void;
  showCart?: boolean;
  showBack?: boolean;
}

export function CustomHeader({
  title = 'Accueil',
  showSearch = true,
  onSearchChange,
  showCart = true,
  showBack = false,
}: CustomHeaderProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { items } = useCart();
  const [searchFocused, setSearchFocused] = useState(false);

  const cartCount = items.length;

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: theme.background,
          paddingTop: insets.top + Spacing.sm,
          paddingBottom: Spacing.sm,
        },
      ]}>
      <View style={[styles.topRow, { paddingHorizontal: Spacing.md }]}>
        <View style={styles.titleSection}>
          {showBack ? (
            <TouchableOpacity
              onPress={() => router.back()}
              style={[
                styles.iconButton,
                {
                  backgroundColor: theme.surfaceElevated,
                  borderColor: theme.border,
                },
                Shadows.sm,
              ]}>
              <Ionicons name="chevron-back" size={22} color={theme.primary} />
            </TouchableOpacity>
          ) : null}

          <View style={styles.titleCopy}>
            <Text style={[styles.eyebrow, { color: theme.textMuted }]}>Kbouffe</Text>
            <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
              {title}
            </Text>
          </View>
        </View>

        {showCart ? (
          <TouchableOpacity
            onPress={() => router.navigate('/cart')}
            style={[
              styles.iconButton,
              {
                backgroundColor: theme.surfaceElevated,
                borderColor: theme.border,
              },
              Shadows.sm,
            ]}>
            <Ionicons name="cart-outline" size={20} color={theme.primary} />
            {cartCount > 0 ? (
              <View style={[styles.cartBadge, { backgroundColor: theme.primary }]}>
                <Text style={styles.cartBadgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ) : null}
      </View>

      {showSearch ? (
        <View style={[styles.searchContainer, { paddingHorizontal: Spacing.md }]}>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: theme.inputBackground,
                borderColor: searchFocused ? theme.primary : theme.border,
              },
              Shadows.sm,
            ]}>
            <View style={[styles.searchIconWrap, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="search" size={16} color={theme.primary} />
            </View>
            <TextInput
              placeholder="Plats, restaurants, cuisines..."
              placeholderTextColor={theme.tabIconDefault}
              style={[styles.searchInput, { color: theme.text }]}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onChangeText={onSearchChange}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 56,
  },
  titleSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  titleCopy: {
    flex: 1,
  },
  eyebrow: {
    ...Typography.smallSemibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  title: {
    ...Typography.title3,
  },
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  searchContainer: {
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: Radii.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
  },
  searchIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    ...Typography.body,
  },
});
