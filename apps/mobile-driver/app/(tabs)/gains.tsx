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
import { chargerGains } from '@/lib/driver';
import type { Gains } from '@/lib/types';

/**
 * Gains du livreur.
 *
 * Le chiffre affiché est la somme des frais de livraison des courses réellement
 * remises. Aucune commission, aucun bonus, aucune projection : la plateforme
 * n'en modélise pas, et un montant estimé sur un écran de paie est un montant
 * que le livreur réclamera. Chaque total doit rester recomposable course par
 * course depuis l'historique.
 */
export default function GainsScreen() {
    const theme = useTheme();
    const formatMontant = useFormatAmount();

    const [gains, setGains] = useState<Gains | null>(null);
    const [loading, setLoading] = useState(true);
    const [erreur, setErreur] = useState<string | null>(null);

    const charger = useCallback(async () => {
        setLoading(true);
        try {
            setGains(await chargerGains());
            setErreur(null);
        } catch (error) {
            setErreur(error instanceof Error ? error.message : 'Chargement impossible.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        charger();
    }, [charger]);

    const cartes = gains
        ? [
              { cle: 'jour', label: "Aujourd'hui", montant: gains.jour, courses: gains.coursesJour, icone: 'today-outline' },
              { cle: 'semaine', label: 'Cette semaine', montant: gains.semaine, courses: gains.coursesSemaine, icone: 'calendar-outline' },
              { cle: 'mois', label: 'Ce mois-ci', montant: gains.mois, courses: gains.coursesMois, icone: 'stats-chart-outline' },
          ]
        : [];

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
            <ScrollView
                contentContainerStyle={styles.contenu}
                refreshControl={
                    <RefreshControl refreshing={loading && !!gains} onRefresh={charger} tintColor={theme.primary} />
                }
            >
                <Text style={[styles.titre, { color: theme.text }]}>Gains</Text>
                <Text style={[styles.sousTitre, { color: theme.textSecondary }]}>
                    Frais de livraison des courses que vous avez remises.
                </Text>

                {loading && !gains ? (
                    <ActivityIndicator color={theme.primary} style={styles.chargement} />
                ) : erreur && !gains ? (
                    <View style={[styles.vide, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Ionicons name="cloud-offline-outline" size={36} color={theme.textSecondary} />
                        <Text style={[styles.videTitre, { color: theme.text }]}>Gains indisponibles</Text>
                        <Text style={[styles.videTexte, { color: theme.textSecondary }]}>{erreur}</Text>
                        <Pressable
                            onPress={charger}
                            style={({ pressed }) => [
                                styles.videBouton,
                                { borderColor: theme.primary, opacity: pressed ? 0.7 : 1 },
                            ]}
                        >
                            <Text style={[styles.videBoutonTexte, { color: theme.primary }]}>Réessayer</Text>
                        </Pressable>
                    </View>
                ) : (
                    <>
                        <View style={[styles.principal, { backgroundColor: theme.primary }]}>
                            <Text style={styles.principalLabel}>Aujourd’hui</Text>
                            <Text style={styles.principalMontant}>{formatMontant(gains?.jour ?? 0)}</Text>
                            <Text style={styles.principalDetail}>
                                {gains?.coursesJour ?? 0} course{(gains?.coursesJour ?? 0) > 1 ? 's' : ''} livrée
                                {(gains?.coursesJour ?? 0) > 1 ? 's' : ''}
                            </Text>
                        </View>

                        <View style={styles.grille}>
                            {cartes.slice(1).map((carte) => (
                                <View
                                    key={carte.cle}
                                    style={[styles.carte, { backgroundColor: theme.card, borderColor: theme.border }]}
                                >
                                    <Ionicons name={carte.icone as any} size={20} color={theme.primary} />
                                    <Text style={[styles.carteLabel, { color: theme.textSecondary }]}>{carte.label}</Text>
                                    <Text style={[styles.carteMontant, { color: theme.text }]}>
                                        {formatMontant(carte.montant)}
                                    </Text>
                                    <Text style={[styles.carteDetail, { color: theme.textSecondary }]}>
                                        {carte.courses} course{carte.courses > 1 ? 's' : ''}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        <View style={[styles.note, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <Ionicons name="information-circle-outline" size={18} color={theme.textSecondary} />
                            <Text style={[styles.noteTexte, { color: theme.textSecondary }]}>
                                Ces montants correspondent aux frais de livraison enregistrés sur chaque
                                commande remise. Le versement est réglé par le restaurant pour lequel vous
                                livrez, selon vos accords : Kbouffe ne le déclenche pas.
                            </Text>
                        </View>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    contenu: { padding: 16, paddingBottom: 32, gap: 14 },
    titre: { fontSize: 24, fontWeight: '800' },
    sousTitre: { fontSize: 13, marginTop: 2, marginBottom: 4 },
    chargement: { marginTop: 32 },
    principal: { borderRadius: 18, padding: 22, gap: 4 },
    principalLabel: { color: '#fff', fontSize: 13, fontWeight: '600', opacity: 0.9 },
    principalMontant: { color: '#fff', fontSize: 34, fontWeight: '800' },
    principalDetail: { color: '#fff', fontSize: 13, opacity: 0.9 },
    grille: { flexDirection: 'row', gap: 12 },
    carte: { flex: 1, borderWidth: 1, borderRadius: 14, padding: 14, gap: 4 },
    carteLabel: { fontSize: 12, marginTop: 4 },
    carteMontant: { fontSize: 18, fontWeight: '800' },
    carteDetail: { fontSize: 11 },
    note: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderRadius: 12, padding: 14 },
    noteTexte: { flex: 1, fontSize: 12, lineHeight: 18 },
    vide: { borderWidth: 1, borderRadius: 14, padding: 24, alignItems: 'center', gap: 8 },
    videTitre: { fontSize: 16, fontWeight: '700' },
    videTexte: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
    videBouton: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10, marginTop: 6 },
    videBoutonTexte: { fontSize: 14, fontWeight: '700' },
});
