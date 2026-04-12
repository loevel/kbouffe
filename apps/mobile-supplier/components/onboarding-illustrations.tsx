import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

export function WelcomeIllustration() {
    const theme = useTheme();

    return (
        <View style={{ width: 160, height: 160, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <View style={{ position: 'relative', width: '100%', height: '100%' }}>
                {/* Phone outline */}
                <View style={{ width: 100, height: 140, borderRadius: 16, borderWidth: 3, borderColor: theme.primary, opacity: 0.3, margin: 'auto' }} />
                {/* Screen elements */}
                <View style={{ position: 'absolute', top: 30, left: 35, width: 90, height: 20, borderRadius: 4, backgroundColor: theme.primary, opacity: 0.2 }} />
                <View style={{ position: 'absolute', top: 60, left: 35, width: 90, height: 50, borderRadius: 4, backgroundColor: theme.primary, opacity: 0.15 }} />
            </View>
        </View>
    );
}

export function FeaturesIllustration() {
    const theme = useTheme();

    return (
        <View style={{ width: 160, height: 160, alignItems: 'center', justifyContent: 'center', marginBottom: 24, flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
            <View style={{ width: 60, height: 60, borderRadius: 12, backgroundColor: theme.primary, opacity: 0.15, borderWidth: 2, borderColor: theme.primary, opacity: 0.3 }} />
            <View style={{ width: 60, height: 60, borderRadius: 12, backgroundColor: theme.primary, opacity: 0.15, borderWidth: 2, borderColor: theme.primary, opacity: 0.3 }} />
            <View style={{ width: 60, height: 60, borderRadius: 12, backgroundColor: theme.primary, opacity: 0.15, borderWidth: 2, borderColor: theme.primary, opacity: 0.3 }} />
            <View style={{ width: 60, height: 60, borderRadius: 12, backgroundColor: theme.primary, opacity: 0.15, borderWidth: 2, borderColor: theme.primary, opacity: 0.3 }} />
        </View>
    );
}

export function CatalogIllustration() {
    const theme = useTheme();

    return (
        <View style={{ width: 160, height: 160, alignItems: 'center', justifyContent: 'center', marginBottom: 24, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <View style={{ width: 50, height: 50, borderRadius: 8, backgroundColor: theme.primary, opacity: 0.2, borderWidth: 1.5, borderColor: theme.primary }} />
            <View style={{ width: 50, height: 50, borderRadius: 8, backgroundColor: theme.primary, opacity: 0.2, borderWidth: 1.5, borderColor: theme.primary }} />
            <View style={{ width: 50, height: 50, borderRadius: 8, backgroundColor: theme.primary, opacity: 0.2, borderWidth: 1.5, borderColor: theme.primary }} />
            <View style={{ width: 50, height: 50, borderRadius: 8, backgroundColor: theme.primary, opacity: 0.2, borderWidth: 1.5, borderColor: theme.primary }} />
        </View>
    );
}

export function OrdersIllustration() {
    const theme = useTheme();

    return (
        <View style={{ width: 160, height: 160, alignItems: 'center', justifyContent: 'center', marginBottom: 24, paddingHorizontal: 20 }}>
            <View style={{ width: '100%', borderWidth: 2, borderColor: theme.primary, borderRadius: 12, padding: 12, opacity: 0.3, gap: 8 }}>
                <View style={{ height: 8, backgroundColor: theme.primary, opacity: 0.4, borderRadius: 4 }} />
                <View style={{ height: 6, backgroundColor: theme.primary, opacity: 0.2, borderRadius: 4 }} />
                <View style={{ height: 6, backgroundColor: theme.primary, opacity: 0.2, borderRadius: 4 }} />
                <View style={{ height: 6, backgroundColor: theme.primary, opacity: 0.2, borderRadius: 4 }} />
            </View>
        </View>
    );
}

export function MessagesIllustration() {
    const theme = useTheme();

    return (
        <View style={{ width: 160, height: 160, alignItems: 'center', justifyContent: 'center', marginBottom: 24, paddingHorizontal: 16 }}>
            <View style={{ width: '100%', borderWidth: 2, borderColor: theme.primary, borderRadius: 12, padding: 12, opacity: 0.3, gap: 8 }}>
                <View style={{ height: 12, backgroundColor: theme.primary, opacity: 0.3, borderRadius: 6, marginRight: '20%' }} />
                <View style={{ height: 12, backgroundColor: theme.primary, opacity: 0.2, borderRadius: 6, marginLeft: '30%' }} />
                <View style={{ height: 12, backgroundColor: theme.primary, opacity: 0.3, borderRadius: 6, marginRight: '15%' }} />
            </View>
        </View>
    );
}

export function ReadyIllustration() {
    const theme = useTheme();

    return (
        <View style={{ width: 160, height: 160, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <View style={{ width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: theme.primary, opacity: 0.3, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 60, color: theme.primary, opacity: 0.4 }}>✓</Text>
            </View>
        </View>
    );
}
