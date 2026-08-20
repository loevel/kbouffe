import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { useFormatAmount } from '@/hooks/use-format-amount';
import { useCourses } from '@/hooks/use-courses';
import { usePositionCourse } from '@/hooks/use-position-course';
import { prendreEnCharge, remettreAuClient } from '@/lib/driver';
import type { PointNavigable } from '@/lib/geo';
import { appeler, distanceKm, estNavigable, formatDistance, ouvrirItineraire } from '@/lib/geo';
import type { Course } from '@/lib/types';

/**
 * Le déroulé d'une course : récupérer, rouler, remettre.
 *
 * Deux gestes seulement, et chacun est irréversible côté client : la prise en
 * charge, puis la remise contre le code que le client dicte. L'écran ne propose
 * jamais les deux à la fois — un bouton « livrer » visible avant d'avoir
 * récupéré la commande n'apporte rien et invite à l'erreur.
 */
export default function CourseScreen() {
    const theme = useTheme();
    const router = useRouter();
    const formatMontant = useFormatAmount();
    const { id } = useLocalSearchParams<{ id: string }>();

    const { courses, loading, rafraichir, retirer } = useCourses();
    const course: Course | undefined = useMemo(
        () => courses.find((c) => c.id === id),
        [courses, id]
    );

    const enRoute = course?.status === 'out_for_delivery' || course?.status === 'delivering';
    const { etat: etatPosition, derniere } = usePositionCourse(course?.id ?? null, Boolean(enRoute));

    const [code, setCode] = useState('');
    const [action, setAction] = useState<'pickup' | 'deliver' | null>(null);
    const [erreur, setErreur] = useState<string | null>(null);

    useEffect(() => {
        setErreur(null);
    }, [course?.status]);

    if (loading && !course) {
        return (
            <SafeAreaView style={[styles.safe, styles.centre, { backgroundColor: theme.background }]}>
                <ActivityIndicator color={theme.primary} size="large" />
            </SafeAreaView>
        );
    }

    if (!course) {
        return (
            <SafeAreaView style={[styles.safe, styles.centre, { backgroundColor: theme.background }]}>
                <Ionicons name="help-circle-outline" size={44} color={theme.textSecondary} />
                <Text style={[styles.absentTitre, { color: theme.text }]}>Course introuvable</Text>
                <Text style={[styles.absentTexte, { color: theme.textSecondary }]}>
                    Elle a peut-être été livrée, réassignée ou annulée.
                </Text>
                <Pressable
                    onPress={() => router.replace('/(tabs)')}
                    style={({ pressed }) => [
                        styles.boutonSecondaire,
                        { borderColor: theme.primary, opacity: pressed ? 0.7 : 1 },
                    ]}
                >
                    <Text style={[styles.boutonSecondaireTexte, { color: theme.primary }]}>
                        Revenir aux courses
                    </Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    const restaurant = {
        lat: course.restaurant.lat,
        lng: course.restaurant.lng,
        label: course.restaurant.name,
        adresse: course.restaurant.address,
    };
    const client = {
        lat: course.customerLat,
        lng: course.customerLng,
        label: course.customerName,
        adresse: course.deliveryAddress,
    };
    const destination = enRoute ? client : restaurant;

    const distance =
        derniere && estNavigable(destination)
            ? distanceKm(derniere, { lat: destination.lat as number, lng: destination.lng as number })
            : null;

    const naviguer = async (point: PointNavigable) => {
        const ouvert = await ouvrirItineraire(point);
        if (!ouvert) {
            Alert.alert(
                'Navigation impossible',
                'Aucune application de cartes n’a pu être ouverte, et cette adresse n’a pas de coordonnées enregistrées.'
            );
        }
    };

    const telephoner = async (numero: string | null, qui: string) => {
        if (!(await appeler(numero))) {
            Alert.alert('Appel impossible', `Aucun numéro n’est enregistré pour ${qui}.`);
        }
    };

    const recuperer = async () => {
        setAction('pickup');
        setErreur(null);
        try {
            const { misEnFile } = await prendreEnCharge(course.id);
            if (misEnFile) {
                Alert.alert(
                    'Enregistré hors ligne',
                    'La prise en charge partira dès le retour du réseau. Vous pouvez continuer votre course.'
                );
            }
            await rafraichir(true);
        } catch (error) {
            setErreur(error instanceof Error ? error.message : 'La prise en charge a échoué.');
        } finally {
            setAction(null);
        }
    };

    const remettre = async () => {
        const saisi = code.trim();

        if (course.requiresCode && saisi.length === 0) {
            setErreur('Demandez au client le code affiché sur sa commande.');
            return;
        }

        setAction('deliver');
        setErreur(null);

        try {
            const { misEnFile } = await remettreAuClient(course.id, saisi);

            if (misEnFile) {
                // Le code n'a pas été vérifié : le serveur ne l'a pas encore vu.
                // Annoncer « livré » ici serait un mensonge que seule une
                // synchronisation ultérieure démentirait.
                Alert.alert(
                    'Enregistré hors ligne',
                    'La remise partira dès le retour du réseau. Le code sera vérifié à ce moment-là : si vous l’avez mal saisi, la course réapparaîtra dans votre liste.'
                );
                retirer(course.id);
                router.replace('/(tabs)');
                return;
            }

            retirer(course.id);
            router.replace('/(tabs)');
        } catch (error) {
            setErreur(error instanceof Error ? error.message : 'La remise a échoué.');
        } finally {
            setAction(null);
        }
    };

    const nbArticles = course.items.reduce((total, ligne) => total + (ligne.quantity ?? 1), 0);

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
            <View style={[styles.barre, { borderBottomColor: theme.border }]}>
                <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Retour">
                    <Ionicons name="chevron-back" size={26} color={theme.text} />
                </Pressable>
                <Text style={[styles.barreTitre, { color: theme.text }]}>
                    {enRoute ? 'Livraison en cours' : 'À récupérer'}
                </Text>
                <View style={styles.barreEspace} />
            </View>

            <ScrollView contentContainerStyle={styles.contenu}>
                {distance !== null && (
                    <View style={[styles.distance, { backgroundColor: theme.primaryLight }]}>
                        <Ionicons name="navigate-outline" size={18} color={theme.primary} />
                        <Text style={[styles.distanceTexte, { color: theme.primary }]}>
                            {formatDistance(distance)} à vol d’oiseau — {enRoute ? 'du client' : 'du restaurant'}
                        </Text>
                    </View>
                )}

                {enRoute && etatPosition === 'refuse' && (
                    <View style={[styles.alerte, { backgroundColor: `${theme.warning}1a`, borderColor: theme.warning }]}>
                        <Ionicons name="location-outline" size={18} color={theme.warning} />
                        <Text style={[styles.alerteTexte, { color: theme.warning }]}>
                            Localisation refusée : le client ne suit pas votre progression.
                        </Text>
                    </View>
                )}

                {/* ── Étape 1 : le restaurant ─────────────────────────────── */}
                <View style={[styles.bloc, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.blocEntete}>
                        <Ionicons name="restaurant-outline" size={18} color={theme.textSecondary} />
                        <Text style={[styles.blocTitre, { color: theme.textSecondary }]}>Récupération</Text>
                    </View>
                    <Text style={[styles.nomLieu, { color: theme.text }]}>{course.restaurant.name}</Text>
                    <Text style={[styles.adresse, { color: theme.textSecondary }]}>
                        {course.restaurant.address ?? 'Adresse non renseignée'}
                    </Text>
                    <View style={styles.actions}>
                        <Pressable
                            onPress={() => naviguer(restaurant)}
                            style={({ pressed }) => [
                                styles.actionSecondaire,
                                { borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
                            ]}
                        >
                            <Ionicons name="navigate-outline" size={16} color={theme.text} />
                            <Text style={[styles.actionTexte, { color: theme.text }]}>Itinéraire</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => telephoner(course.restaurant.phone, 'le restaurant')}
                            style={({ pressed }) => [
                                styles.actionSecondaire,
                                { borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
                            ]}
                        >
                            <Ionicons name="call-outline" size={16} color={theme.text} />
                            <Text style={[styles.actionTexte, { color: theme.text }]}>Appeler</Text>
                        </Pressable>
                    </View>
                </View>

                {/* ── Étape 2 : le client ─────────────────────────────────── */}
                <View style={[styles.bloc, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.blocEntete}>
                        <Ionicons name="location-outline" size={18} color={theme.textSecondary} />
                        <Text style={[styles.blocTitre, { color: theme.textSecondary }]}>Livraison</Text>
                    </View>
                    <Text style={[styles.nomLieu, { color: theme.text }]}>
                        {course.customerName ?? 'Client'}
                    </Text>
                    <Text style={[styles.adresse, { color: theme.textSecondary }]}>
                        {course.deliveryAddress ?? 'Adresse non renseignée'}
                    </Text>
                    {!estNavigable(client) && course.deliveryAddress && (
                        <Text style={[styles.avertissement, { color: theme.warning }]}>
                            Pas de coordonnées GPS pour cette adresse : l’itinéraire fera une
                            recherche sur le texte, vérifiez la rue avec le client.
                        </Text>
                    )}
                    {course.notes && (
                        <View style={[styles.consigne, { backgroundColor: theme.primaryLight }]}>
                            <Ionicons name="chatbubble-ellipses-outline" size={15} color={theme.primary} />
                            <Text style={[styles.consigneTexte, { color: theme.text }]}>{course.notes}</Text>
                        </View>
                    )}
                    <View style={styles.actions}>
                        <Pressable
                            onPress={() => naviguer(client)}
                            style={({ pressed }) => [
                                styles.actionSecondaire,
                                { borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
                            ]}
                        >
                            <Ionicons name="navigate-outline" size={16} color={theme.text} />
                            <Text style={[styles.actionTexte, { color: theme.text }]}>Itinéraire</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => telephoner(course.customerPhone, 'le client')}
                            style={({ pressed }) => [
                                styles.actionSecondaire,
                                { borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
                            ]}
                        >
                            <Ionicons name="call-outline" size={16} color={theme.text} />
                            <Text style={[styles.actionTexte, { color: theme.text }]}>Appeler</Text>
                        </Pressable>
                    </View>
                </View>

                {/* ── Contenu de la commande ──────────────────────────────── */}
                <View style={[styles.bloc, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.blocEntete}>
                        <Ionicons name="bag-handle-outline" size={18} color={theme.textSecondary} />
                        <Text style={[styles.blocTitre, { color: theme.textSecondary }]}>
                            Commande — {nbArticles} article{nbArticles > 1 ? 's' : ''}
                        </Text>
                    </View>
                    {course.items.length === 0 ? (
                        <Text style={[styles.adresse, { color: theme.textSecondary }]}>
                            Le détail des articles n’a pas été transmis.
                        </Text>
                    ) : (
                        course.items.map((ligne, index) => (
                            <View key={`${ligne.name ?? 'article'}-${index}`} style={styles.article}>
                                <Text style={[styles.articleQte, { color: theme.primary }]}>
                                    {ligne.quantity ?? 1}×
                                </Text>
                                <Text style={[styles.articleNom, { color: theme.text }]}>
                                    {ligne.name ?? 'Article'}
                                </Text>
                            </View>
                        ))
                    )}
                    <View style={[styles.totaux, { borderTopColor: theme.border }]}>
                        <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>
                            Total commande
                        </Text>
                        <Text style={[styles.totalValeur, { color: theme.text }]}>
                            {formatMontant(course.total)}
                        </Text>
                    </View>
                    <View style={styles.totaux}>
                        <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>
                            Votre course
                        </Text>
                        <Text style={[styles.totalValeur, { color: theme.primary }]}>
                            {formatMontant(course.deliveryFee)}
                        </Text>
                    </View>
                </View>

                {/* ── Remise : code de confirmation ───────────────────────── */}
                {enRoute && course.requiresCode && (
                    <View style={[styles.bloc, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <View style={styles.blocEntete}>
                            <Ionicons name="keypad-outline" size={18} color={theme.textSecondary} />
                            <Text style={[styles.blocTitre, { color: theme.textSecondary }]}>
                                Code de confirmation
                            </Text>
                        </View>
                        <Text style={[styles.adresse, { color: theme.textSecondary }]}>
                            Le client le lit sur sa commande. Saisissez-le tel qu’il vous le dicte.
                        </Text>
                        <TextInput
                            value={code}
                            onChangeText={(valeur) => setCode(valeur.toUpperCase())}
                            placeholder="Ex. 4B7K"
                            placeholderTextColor={theme.tabIconDefault}
                            autoCapitalize="characters"
                            autoCorrect={false}
                            maxLength={12}
                            editable={action === null}
                            style={[
                                styles.champCode,
                                { backgroundColor: theme.background, borderColor: theme.border, color: theme.text },
                            ]}
                            accessibilityLabel="Code de confirmation dicté par le client"
                        />
                    </View>
                )}

                {erreur && (
                    <View style={[styles.alerte, { backgroundColor: `${theme.error}1a`, borderColor: theme.error }]}>
                        <Ionicons name="alert-circle-outline" size={18} color={theme.error} />
                        <Text style={[styles.alerteTexte, { color: theme.error }]}>{erreur}</Text>
                    </View>
                )}
            </ScrollView>

            <View style={[styles.pied, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
                {enRoute ? (
                    <Pressable
                        onPress={remettre}
                        disabled={action !== null}
                        style={({ pressed }) => [
                            styles.boutonPrincipal,
                            { backgroundColor: theme.success, opacity: action || pressed ? 0.8 : 1 },
                        ]}
                    >
                        {action === 'deliver' ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                                <Text style={styles.boutonPrincipalTexte}>Confirmer la remise</Text>
                            </>
                        )}
                    </Pressable>
                ) : (
                    <Pressable
                        onPress={recuperer}
                        disabled={action !== null}
                        style={({ pressed }) => [
                            styles.boutonPrincipal,
                            { backgroundColor: theme.primary, opacity: action || pressed ? 0.8 : 1 },
                        ]}
                    >
                        {action === 'pickup' ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="bag-check-outline" size={20} color="#fff" />
                                <Text style={styles.boutonPrincipalTexte}>J’ai récupéré la commande</Text>
                            </>
                        )}
                    </Pressable>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    centre: { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
    absentTitre: { fontSize: 18, fontWeight: '800' },
    absentTexte: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
    barre: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    barreTitre: { flex: 1, fontSize: 17, fontWeight: '700' },
    barreEspace: { width: 26 },
    contenu: { padding: 16, paddingBottom: 24, gap: 12 },
    distance: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, padding: 12 },
    distanceTexte: { flex: 1, fontSize: 13, fontWeight: '600' },
    alerte: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
    },
    alerteTexte: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: '500' },
    bloc: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 6 },
    blocEntete: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
    blocTitre: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    nomLieu: { fontSize: 17, fontWeight: '700' },
    adresse: { fontSize: 13, lineHeight: 19 },
    avertissement: { fontSize: 12, lineHeight: 17, fontWeight: '600', marginTop: 2 },
    consigne: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 10, padding: 10, marginTop: 4 },
    consigneTexte: { flex: 1, fontSize: 13, lineHeight: 18 },
    actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
    actionSecondaire: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderWidth: 1,
        borderRadius: 10,
        paddingVertical: 11,
    },
    actionTexte: { fontSize: 14, fontWeight: '600' },
    article: { flexDirection: 'row', gap: 10, paddingVertical: 4 },
    articleQte: { fontSize: 14, fontWeight: '800', minWidth: 28 },
    articleNom: { flex: 1, fontSize: 14, lineHeight: 19 },
    totaux: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, marginTop: 2 },
    totalLabel: { fontSize: 13 },
    totalValeur: { fontSize: 15, fontWeight: '800' },
    champCode: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: 6,
        textAlign: 'center',
        marginTop: 8,
    },
    pied: { borderTopWidth: 1, padding: 16, paddingBottom: 24 },
    boutonPrincipal: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: 14,
        paddingVertical: 17,
    },
    boutonPrincipalTexte: { color: '#fff', fontSize: 16, fontWeight: '700' },
    boutonSecondaire: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 11, marginTop: 6 },
    boutonSecondaireTexte: { fontSize: 14, fontWeight: '700' },
});
