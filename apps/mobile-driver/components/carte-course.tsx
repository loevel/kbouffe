import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { useFormatAmount } from '@/hooks/use-format-amount';
import { relativeTime } from '@/lib/format';
import { distanceKm, formatDistance } from '@/lib/geo';
import type { Course, StatutCourse } from '@/lib/types';

const LIBELLES: Record<StatutCourse, string> = {
    ready: 'À récupérer',
    out_for_delivery: 'En route',
    delivering: 'En route',
    delivered: 'Livrée',
    completed: 'Livrée',
};

/** Couleur de statut : à récupérer = attention, en route = information. */
function couleurStatut(statut: StatutCourse, theme: ReturnType<typeof useTheme>) {
    if (statut === 'ready') return theme.warning;
    if (statut === 'delivered' || statut === 'completed') return theme.success;
    return theme.info;
}

export function CarteCourse({
    course,
    position,
    onPress,
}: {
    course: Course;
    /** Position du livreur, si connue — sert à afficher la distance restante. */
    position?: { lat: number; lng: number } | null;
    onPress: () => void;
}) {
    const theme = useTheme();
    const formatMontant = useFormatAmount();

    const enRoute = course.status === 'out_for_delivery' || course.status === 'delivering';
    // Avant la prise en charge, la prochaine étape est le restaurant ; après,
    // c'est le client. Afficher l'autre distance n'aiderait personne.
    const cible = enRoute
        ? { lat: course.customerLat, lng: course.customerLng }
        : { lat: course.restaurant.lat, lng: course.restaurant.lng };

    const distance =
        position && typeof cible.lat === 'number' && typeof cible.lng === 'number'
            ? distanceKm(position, { lat: cible.lat, lng: cible.lng })
            : null;

    const couleur = couleurStatut(course.status, theme);
    const nbArticles = course.items.reduce((total, ligne) => total + (ligne.quantity ?? 1), 0);

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`Course ${LIBELLES[course.status]} pour ${course.customerName ?? 'un client'}`}
            style={({ pressed }) => [
                styles.carte,
                { backgroundColor: theme.card, borderColor: theme.border, opacity: pressed ? 0.85 : 1 },
            ]}
        >
            <View style={styles.entete}>
                <View style={[styles.pastille, { backgroundColor: `${couleur}1f` }]}>
                    <Text style={[styles.pastilleTexte, { color: couleur }]}>{LIBELLES[course.status]}</Text>
                </View>
                <Text style={[styles.heure, { color: theme.textSecondary }]}>
                    {relativeTime(course.createdAt)}
                </Text>
            </View>

            <View style={styles.etapes}>
                <View style={styles.etape}>
                    <Ionicons name="restaurant-outline" size={16} color={theme.textSecondary} />
                    <Text style={[styles.etapeTexte, { color: theme.text }]} numberOfLines={1}>
                        {course.restaurant.name}
                    </Text>
                </View>
                <View style={styles.etape}>
                    <Ionicons name="location-outline" size={16} color={theme.textSecondary} />
                    <Text style={[styles.etapeTexte, { color: theme.text }]} numberOfLines={2}>
                        {course.deliveryAddress ?? 'Adresse non renseignée'}
                    </Text>
                </View>
            </View>

            <View style={[styles.pied, { borderTopColor: theme.border }]}>
                <Text style={[styles.detail, { color: theme.textSecondary }]}>
                    {nbArticles} article{nbArticles > 1 ? 's' : ''}
                </Text>
                {distance !== null && (
                    <Text style={[styles.detail, { color: theme.textSecondary }]}>
                        {formatDistance(distance)} à vol d’oiseau
                    </Text>
                )}
                <Text style={[styles.gain, { color: theme.primary }]}>
                    {formatMontant(course.deliveryFee)}
                </Text>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    carte: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 12 },
    entete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    pastille: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    pastilleTexte: { fontSize: 12, fontWeight: '700' },
    heure: { fontSize: 12 },
    etapes: { gap: 8 },
    etape: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    etapeTexte: { flex: 1, fontSize: 14, fontWeight: '500', lineHeight: 19 },
    pied: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        paddingTop: 10,
        gap: 8,
    },
    detail: { fontSize: 12 },
    gain: { fontSize: 15, fontWeight: '800' },
});
