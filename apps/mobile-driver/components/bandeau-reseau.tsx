import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';

/**
 * Bandeau d'état réseau.
 *
 * Un livreur doit savoir si ce qu'il voit est à jour et si ce qu'il a validé est
 * parti. Masquer une perte de réseau derrière une liste d'apparence normale est
 * exactement ce qui lui fait refaire — ou croire faite — une remise.
 */
export function BandeauReseau({ horsLigne, enAttente }: { horsLigne: boolean; enAttente: number }) {
    const theme = useTheme();

    if (!horsLigne && enAttente === 0) return null;

    const couleur = horsLigne ? theme.warning : theme.info;
    const message = horsLigne
        ? enAttente > 0
            ? `Hors ligne — ${enAttente} action${enAttente > 1 ? 's' : ''} en attente d’envoi`
            : 'Hors ligne — vous consultez la dernière version enregistrée'
        : `${enAttente} action${enAttente > 1 ? 's' : ''} en cours d’envoi`;

    return (
        <View style={[styles.bandeau, { backgroundColor: `${couleur}1f`, borderColor: couleur }]}>
            <Ionicons name={horsLigne ? 'cloud-offline-outline' : 'sync-outline'} size={16} color={couleur} />
            <Text style={[styles.texte, { color: couleur }]}>{message}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    bandeau: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 9,
        marginBottom: 12,
    },
    texte: { flex: 1, fontSize: 12, fontWeight: '600' },
});
