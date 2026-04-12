import React, { useEffect } from 'react';
import { StyleSheet, StyleProp, ViewStyle, View } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
} from 'react-native-reanimated';
import { Colors, Radii, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface SkeletonProps {
    width?: number | string;
    height?: number | string;
    borderRadius?: number;
    style?: StyleProp<ViewStyle>;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = Radii.sm, style }: SkeletonProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.7, { duration: 800 }),
                withTiming(0.3, { duration: 800 })
            ),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                styles.skeleton,
                {
                    width: width as any,
                    height: height as any,
                    borderRadius,
                    backgroundColor: theme.border,
                },
                style,
                animatedStyle,
            ]}
        />
    );
}

const styles = StyleSheet.create({
    skeleton: {
        overflow: 'hidden',
    },
});

// ── Compound skeletons ──────────────────────────────────────────────────────

/** Full-page skeleton for a list of order cards. */
export function OrdersListSkeleton() {
    return (
        <View style={compound.container}>
            {[...Array(4)].map((_, i) => (
                <View key={i} style={compound.card}>
                    <View style={compound.row}>
                        <Skeleton width={40} height={40} borderRadius={20} />
                        <View style={{ flex: 1, marginLeft: Spacing.sm, gap: 6 }}>
                            <Skeleton width="60%" height={14} />
                            <Skeleton width="40%" height={11} />
                        </View>
                        <Skeleton width={80} height={24} borderRadius={12} />
                    </View>
                    <Skeleton height={8} style={{ marginTop: Spacing.md }} borderRadius={4} />
                    <View style={[compound.row, { marginTop: Spacing.md }]}>
                        <Skeleton width={60} height={60} borderRadius={8} />
                        <Skeleton width={60} height={60} borderRadius={8} style={{ marginLeft: 8 }} />
                        <Skeleton width={60} height={60} borderRadius={8} style={{ marginLeft: 8 }} />
                    </View>
                </View>
            ))}
        </View>
    );
}

/** Full-page skeleton for a list of restaurant cards. */
export function RestaurantListSkeleton() {
    return (
        <View style={compound.container}>
            {[...Array(3)].map((_, i) => (
                <View key={i} style={[compound.card, { padding: 0, overflow: 'hidden' }]}>
                    <Skeleton width="100%" height={180} borderRadius={0} />
                    <View style={{ padding: Spacing.md, gap: 8 }}>
                        <Skeleton width="70%" height={16} />
                        <Skeleton width="50%" height={12} />
                        <View style={[compound.row, { marginTop: 4 }]}>
                            <Skeleton width={80} height={28} borderRadius={8} />
                            <Skeleton width={80} height={28} borderRadius={8} style={{ marginLeft: 8 }} />
                        </View>
                    </View>
                </View>
            ))}
        </View>
    );
}

/** Skeleton for the profile page header. */
export function ProfileHeaderSkeleton() {
    return (
        <View style={[compound.container, { alignItems: 'center', paddingTop: Spacing.xl }]}>
            <Skeleton width={80} height={80} borderRadius={40} />
            <Skeleton width={120} height={18} style={{ marginTop: Spacing.md }} />
            <Skeleton width={80} height={13} style={{ marginTop: 8 }} />
        </View>
    );
}

const compound = StyleSheet.create({
    container: {
        flex: 1,
        padding: Spacing.md,
    },
    card: {
        borderRadius: Radii.xl,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});
