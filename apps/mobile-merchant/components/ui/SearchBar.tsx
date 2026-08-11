import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { TouchTarget, hitSlopFor } from '@/constants/theme';

interface SearchBarProps {
    value: string;
    onChangeText: (value: string) => void;
    placeholder?: string;
    /** Nombre de résultats, annoncé aux lecteurs d'écran quand la requête change. */
    resultCount?: number;
    style?: object;
}

const CLEAR_HIT_SLOP = hitSlopFor(24);

/**
 * Champ de recherche des listes longues. Un menu de 50 articles ou un
 * historique de plusieurs centaines de commandes n'offraient jusqu'ici aucun
 * moyen de filtrer au-delà du bouton « En cours / Toutes ».
 */
export function SearchBar({ value, onChangeText, placeholder = 'Rechercher…', resultCount, style }: SearchBarProps) {
    const theme = useTheme();

    return (
        <View style={style}>
            <View style={[styles.field, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Ionicons name="search" size={17} color={theme.textSecondary} />
                <TextInput
                    style={[styles.input, { color: theme.text }]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={theme.textSecondary}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="search"
                    clearButtonMode="never"
                    accessibilityLabel={placeholder}
                />
                {value.length > 0 && (
                    <TouchableOpacity
                        onPress={() => onChangeText('')}
                        hitSlop={CLEAR_HIT_SLOP}
                        accessibilityRole="button"
                        accessibilityLabel="Effacer la recherche"
                    >
                        <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>
            {value.length > 0 && resultCount !== undefined && (
                <Text
                    style={[styles.count, { color: theme.textSecondary }]}
                    accessibilityLiveRegion="polite"
                >
                    {resultCount} résultat{resultCount > 1 ? 's' : ''}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    field: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        minHeight: TouchTarget.min,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    input: { flex: 1, fontSize: 15, paddingVertical: 0 },
    count: { fontSize: 12, marginTop: 6, marginLeft: 4 },
});
