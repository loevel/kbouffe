import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { Typography } from '@/constants/theme';

/** Hauteur visible du bandeau hors inset de sécurité. */
const BANNER_CONTENT_HEIGHT = 36;

/**
 * Bandeau hors-ligne affiché en haut de l'écran quand le réseau
 * est indisponible.
 *
 * - Slide-in animé depuis le haut (hauteur 0 → contenu + safe-area top)
 * - Slide-out animé à la reconnexion
 * - Position absolue : ne pousse pas le contenu en dessous
 * - Respect du safe-area inset top (encoche, Dynamic Island…)
 */
export function OfflineBanner() {
    const { isConnected } = useNetworkStatus();
    const { top } = useSafeAreaInsets();

    // La hauteur totale du bandeau inclut l'inset de sécurité supérieur
    const totalHeight = BANNER_CONTENT_HEIGHT + top;

    const heightAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(heightAnim, {
            toValue: isConnected ? 0 : totalHeight,
            duration: 280,
            useNativeDriver: false, // height n'est pas animable avec le native driver
        }).start();
    }, [isConnected, totalHeight, heightAnim]);

    return (
        <Animated.View
            style={[styles.container, { height: heightAnim }]}
            accessibilityLiveRegion="polite"
            accessibilityLabel={isConnected ? '' : 'Pas de connexion internet'}
        >
            {/* paddingTop dynamique pour respecter l'encoche/Dynamic Island */}
            <View style={[styles.inner, { paddingTop: top }]}>
                <Feather
                    name="wifi-off"
                    size={14}
                    color="#ffffff"
                    style={styles.icon}
                />
                <Text style={styles.label} numberOfLines={1}>
                    Pas de connexion internet
                </Text>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        // zIndex élevé pour passer au-dessus de tous les écrans
        zIndex: 9999,
        elevation: 99, // Android
        overflow: 'hidden',
        backgroundColor: '#dc2626', // Rouge (Tailwind red-600)
    },
    inner: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingBottom: 4,
    },
    icon: {
        marginRight: 6,
    },
    label: {
        ...Typography.small,
        color: '#ffffff',
        fontWeight: '600',
        letterSpacing: 0.2,
    },
});
