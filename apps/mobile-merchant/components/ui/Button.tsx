import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/use-theme';
import { Opacity, TouchTarget } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'small' | 'medium';

interface ButtonProps {
    label: string;
    onPress: () => void;
    variant?: Variant;
    size?: Size;
    icon?: keyof typeof Ionicons.glyphMap;
    loading?: boolean;
    disabled?: boolean;
    /** Étire le bouton sur toute la largeur disponible. */
    fullWidth?: boolean;
    /** Décrit l'action si le libellé visible ne suffit pas hors contexte. */
    accessibilityLabel?: string;
    style?: object;
}

/**
 * Bouton partagé. Le retour haptique est porté par le composant plutôt que
 * laissé à chaque écran : jusqu'ici seuls la barre d'onglets et l'aperçu en
 * déclenchaient, alors que les actions à enjeu (changement de statut de
 * commande, création de produit) n'en avaient aucun.
 */
export function Button({
    label,
    onPress,
    variant = 'primary',
    size = 'medium',
    icon,
    loading = false,
    disabled = false,
    fullWidth = false,
    accessibilityLabel,
    style,
}: ButtonProps) {
    const theme = useTheme();
    const inactive = disabled || loading;

    const palette: Record<Variant, { background: string; border: string; foreground: string }> = {
        primary: { background: theme.primary, border: theme.primary, foreground: '#ffffff' },
        secondary: { background: 'transparent', border: theme.border, foreground: theme.text },
        ghost: { background: `${theme.primary}1a`, border: 'transparent', foreground: theme.primary },
        danger: { background: 'transparent', border: theme.error, foreground: theme.error },
    };
    const { background, border, foreground } = palette[variant];

    const handlePress = () => {
        if (inactive) return;
        // Le retour haptique n'existe pas sur toutes les plateformes (web) et sa
        // promesse y est rejetée : l'échec ne doit pas empêcher l'action.
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            disabled={inactive}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel ?? label}
            accessibilityState={{ disabled: inactive, busy: loading }}
            style={[
                styles.base,
                size === 'small' ? styles.small : styles.medium,
                { backgroundColor: background, borderColor: border },
                fullWidth && styles.fullWidth,
                inactive && { opacity: Opacity.disabled },
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator size="small" color={foreground} />
            ) : (
                <>
                    {icon && <Ionicons name={icon} size={size === 'small' ? 15 : 18} color={foreground} />}
                    <Text
                        style={[styles.label, size === 'small' ? styles.labelSmall : styles.labelMedium, { color: foreground }]}
                        numberOfLines={1}
                    >
                        {label}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderRadius: 12,
        borderWidth: 1,
    },
    // Même en variante compacte, la hauteur reste au minimum tappable HIG.
    small: { minHeight: TouchTarget.min, paddingHorizontal: 14 },
    medium: { minHeight: TouchTarget.button, paddingHorizontal: 18 },
    fullWidth: { alignSelf: 'stretch' },
    label: { fontWeight: '700' },
    labelSmall: { fontSize: 13 },
    labelMedium: { fontSize: 15 },
});
