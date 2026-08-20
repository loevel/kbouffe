import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { useFormatAmount } from '@/hooks/use-format-amount';
import { chargerHistorique } from '@/lib/driver';
import { formatDateTime } from '@/lib/format';
import type { Course } from '@/lib/types';

/** Les courses terminées, page par page. */
export default function HistoriqueScreen() {
    const theme = useTheme();
    const formatMontant = useFormatAmount();

    const [courses, setCourses] = useState<Course[]>([]);
    const [page, setPage] = useState(1);
    const [encore, setEncore] = useState(false);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [chargeantSuite, setChargeantSuite] = useState(false);
    const [erreur, setErreur] = useState<string | null>(null);

    const charger = useCallback(async (numeroPage: number, remplacer: boolean) => {
        if (remplacer) setLoading(true);
        else setChargeantSuite(true);

        try {
            const data = await chargerHistorique(numeroPage);
            setCourses((actuelles) =>
                remplacer ? data.courses : [...actuelles, ...data.courses]
            );
            setEncore(data.hasMore);
            setTotal(data.total);
            setPage(numeroPage);
            setErreur(null);
        } catch (error) {
            setErreur(error instanceof Error ? error.message : 'Chargement impossible.');
        } finally {
            setLoading(false);
            setChargeantSuite(false);
        }
    }, []);

    useEffect(() => {
        charger(1, true);
    }, [charger]);

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
            <ScrollView
                contentContainerStyle={styles.contenu}
                refreshControl={
                    <RefreshControl
                        refreshing={loading && courses.length > 0}
                        onRefresh={() => charger(1, true)}
                        tintColor={theme.primary}
                    />
                }
            >
                <Text style={[styles.titre, { color: theme.text }]}>Historique</Text>
                <Text style={[styles.sousTitre, { color: theme.textSecondary }]}>
                    {total > 0 ? `${total} course${total > 1 ? 's' : ''} livrée${total > 1 ? 's' : ''}` : 'Vos courses terminées'}
                </Text>

                {loading && courses.length === 0 ? (
                    <ActivityIndicator color={theme.primary} style={styles.chargement} />
                ) : courses.length === 0 ? (
                    <View style={[styles.vide, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Ionicons
                            name={erreur ? 'cloud-offline-outline' : 'time-outline'}
                            size={36}
                            color={theme.textSecondary}
                        />
                        <Text style={[styles.videTitre, { color: theme.text }]}>
                            {erreur ? 'Historique indisponible' : 'Pas encore de course livrée'}
                        </Text>
                        <Text style={[styles.videTexte, { color: theme.textSecondary }]}>
                            {erreur ?? 'Vos livraisons terminées s’afficheront ici.'}
                        </Text>
                        <Pressable
                            onPress={() => charger(1, true)}
                            style={({ pressed }) => [
                                styles.videBouton,
                                { borderColor: theme.primary, opacity: pressed ? 0.7 : 1 },
                            ]}
                        >
                            <Text style={[styles.videBoutonTexte, { color: theme.primary }]}>Réessayer</Text>
                        </Pressable>
                    </View>
                ) : (
                    <View style={styles.liste}>
                        {courses.map((course) => (
                            <View
                                key={course.id}
                                style={[styles.ligne, { backgroundColor: theme.card, borderColor: theme.border }]}
                            >
                                <View style={[styles.puce, { backgroundColor: `${theme.success}1f` }]}>
                                    <Ionicons name="checkmark" size={16} color={theme.success} />
                                </View>
                                <View style={styles.flex}>
                                    <Text style={[styles.ligneTitre, { color: theme.text }]} numberOfLines={1}>
                                        {course.restaurant.name}
                                    </Text>
                                    <Text style={[styles.ligneTexte, { color: theme.textSecondary }]} numberOfLines={1}>
                                        {course.deliveryAddress ?? 'Adresse non renseignée'}
                                    </Text>
                                    <Text style={[styles.ligneDate, { color: theme.textSecondary }]}>
                                        {formatDateTime(course.deliveredAt ?? course.updatedAt ?? course.createdAt)}
                                    </Text>
                                </View>
                                <Text style={[styles.gain, { color: theme.primary }]}>
                                    {formatMontant(course.deliveryFee)}
                                </Text>
                            </View>
                        ))}

                        {encore && (
                            <Pressable
                                onPress={() => charger(page + 1, false)}
                                disabled={chargeantSuite}
                                style={({ pressed }) => [
                                    styles.suite,
                                    { borderColor: theme.border, opacity: pressed || chargeantSuite ? 0.7 : 1 },
                                ]}
                            >
                                {chargeantSuite ? (
                                    <ActivityIndicator color={theme.primary} />
                                ) : (
                                    <Text style={[styles.suiteTexte, { color: theme.primary }]}>
                                        Charger les courses précédentes
                                    </Text>
                                )}
                            </Pressable>
                        )}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    flex: { flex: 1 },
    contenu: { padding: 16, paddingBottom: 32 },
    titre: { fontSize: 24, fontWeight: '800' },
    sousTitre: { fontSize: 13, marginTop: 2, marginBottom: 16 },
    chargement: { marginTop: 32 },
    liste: { gap: 10 },
    ligne: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
    },
    puce: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    ligneTitre: { fontSize: 14, fontWeight: '700' },
    ligneTexte: { fontSize: 12, marginTop: 1 },
    ligneDate: { fontSize: 11, marginTop: 3 },
    gain: { fontSize: 14, fontWeight: '800' },
    suite: { borderWidth: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
    suiteTexte: { fontSize: 14, fontWeight: '700' },
    vide: { borderWidth: 1, borderRadius: 14, padding: 24, alignItems: 'center', gap: 8 },
    videTitre: { fontSize: 16, fontWeight: '700' },
    videTexte: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
    videBouton: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10, marginTop: 6 },
    videBoutonTexte: { fontSize: 14, fontWeight: '700' },
});
