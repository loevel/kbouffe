import { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BandeauReseau } from '@/components/bandeau-reseau';
import { CarteCourse } from '@/components/carte-course';
import { useAuth } from '@/contexts/auth-context';
import { useCourses } from '@/hooks/use-courses';
import { usePositionCourse } from '@/hooks/use-position-course';
import { useTheme } from '@/hooks/use-theme';
import { definirDisponibilite } from '@/lib/driver';

/**
 * Écran principal : les courses en main du livreur.
 *
 * L'ordre n'est pas chronologique mais opérationnel — ce qui est déjà en route
 * passe devant ce qui reste à récupérer, parce qu'une commande chez le client
 * attend, et qu'un plat qui refroidit dans le sac coûte plus qu'un plat encore
 * au chaud en cuisine.
 */
export default function CoursesScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { profile, setDisponible } = useAuth();
    const { courses, loading, erreur, horsLigne, enAttente, rafraichir } = useCourses();
    const [bascule, setBascule] = useState(false);

    const triees = useMemo(() => {
        const rang = (statut: string) => (statut === 'ready' ? 1 : 0);
        return [...courses].sort((a, b) => {
            const parStatut = rang(a.status) - rang(b.status);
            if (parStatut !== 0) return parStatut;
            return a.createdAt.localeCompare(b.createdAt);
        });
    }, [courses]);

    const enCours = triees.find((c) => c.status !== 'ready') ?? null;

    // Une seule course émet sa position : celle qui est réellement en route.
    const { etat: etatPosition, derniere } = usePositionCourse(
        enCours?.id ?? null,
        Boolean(enCours)
    );

    // Chaque retour sur l'écran rejoue la file et resynchronise : c'est le
    // moment où le livreur retrouve souvent du réseau, en sortant d'un immeuble.
    useFocusEffect(
        useCallback(() => {
            rafraichir(true);
        }, [rafraichir])
    );

    const basculerDisponibilite = async (valeur: boolean) => {
        setBascule(true);
        setDisponible(valeur); // affichage immédiat, l'envoi suit
        try {
            await definirDisponibilite(valeur);
        } catch (error) {
            setDisponible(!valeur);
            console.error('Disponibilité non enregistrée', error);
        } finally {
            setBascule(false);
        }
    };

    const disponible = profile?.available ?? true;

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
            <ScrollView
                contentContainerStyle={styles.contenu}
                refreshControl={
                    <RefreshControl
                        refreshing={loading && courses.length > 0}
                        onRefresh={() => rafraichir()}
                        tintColor={theme.primary}
                    />
                }
            >
                <View style={styles.entete}>
                    <View style={styles.flex}>
                        <Text style={[styles.salutation, { color: theme.textSecondary }]}>Bonjour</Text>
                        <Text style={[styles.nom, { color: theme.text }]} numberOfLines={1}>
                            {profile?.fullName ?? 'Livreur'}
                        </Text>
                    </View>
                    <Pressable
                        onPress={() => router.push('/(tabs)/profil')}
                        style={[styles.avatar, { backgroundColor: theme.primaryLight }]}
                        accessibilityRole="button"
                        accessibilityLabel="Ouvrir le profil"
                    >
                        <Ionicons name="person" size={20} color={theme.primary} />
                    </Pressable>
                </View>

                <View style={[styles.dispo, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.flex}>
                        <Text style={[styles.dispoTitre, { color: theme.text }]}>
                            {disponible ? 'Disponible' : 'Indisponible'}
                        </Text>
                        <Text style={[styles.dispoTexte, { color: theme.textSecondary }]}>
                            {disponible
                                ? 'Votre restaurant peut vous assigner des courses.'
                                : 'Vos courses en cours restent à faire, mais vous n’en recevrez pas de nouvelle.'}
                        </Text>
                    </View>
                    <Switch
                        value={disponible}
                        onValueChange={basculerDisponibilite}
                        disabled={bascule}
                        trackColor={{ false: theme.border, true: theme.primary }}
                        accessibilityLabel="Basculer la disponibilité"
                    />
                </View>

                <BandeauReseau horsLigne={horsLigne} enAttente={enAttente} />

                {etatPosition === 'refuse' && (
                    <View style={[styles.alerte, { backgroundColor: `${theme.warning}1a`, borderColor: theme.warning }]}>
                        <Ionicons name="navigate-circle-outline" size={18} color={theme.warning} />
                        <Text style={[styles.alerteTexte, { color: theme.warning }]}>
                            Localisation refusée : le client ne voit pas votre position sur sa carte.
                            Vous pouvez tout de même faire vos courses normalement.
                        </Text>
                    </View>
                )}

                <Text style={[styles.section, { color: theme.text }]}>
                    {triees.length > 0
                        ? `${triees.length} course${triees.length > 1 ? 's' : ''} en cours`
                        : 'Courses'}
                </Text>

                {loading && courses.length === 0 ? (
                    <ActivityIndicator color={theme.primary} style={styles.chargement} />
                ) : triees.length === 0 ? (
                    <View style={[styles.vide, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Ionicons
                            name={erreur ? 'cloud-offline-outline' : 'checkmark-done-outline'}
                            size={36}
                            color={theme.textSecondary}
                        />
                        <Text style={[styles.videTitre, { color: theme.text }]}>
                            {erreur ? 'Liste indisponible' : 'Aucune course en attente'}
                        </Text>
                        <Text style={[styles.videTexte, { color: theme.textSecondary }]}>
                            {erreur ?? 'Vous êtes à jour. Les nouvelles courses apparaîtront ici.'}
                        </Text>
                        <Pressable
                            onPress={() => rafraichir()}
                            style={({ pressed }) => [
                                styles.videBouton,
                                { borderColor: theme.primary, opacity: pressed ? 0.7 : 1 },
                            ]}
                        >
                            <Text style={[styles.videBoutonTexte, { color: theme.primary }]}>
                                {erreur ? 'Réessayer' : 'Actualiser'}
                            </Text>
                        </Pressable>
                    </View>
                ) : (
                    <View style={styles.liste}>
                        {triees.map((course) => (
                            <CarteCourse
                                key={course.id}
                                course={course}
                                position={derniere}
                                onPress={() => router.push(`/course/${course.id}` as any)}
                            />
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    flex: { flex: 1 },
    contenu: { padding: 16, paddingBottom: 32, gap: 4 },
    entete: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    salutation: { fontSize: 13 },
    nom: { fontSize: 22, fontWeight: '800' },
    avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
    dispo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
    },
    dispoTitre: { fontSize: 15, fontWeight: '700' },
    dispoTexte: { fontSize: 12, lineHeight: 17, marginTop: 2 },
    alerte: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        marginBottom: 12,
    },
    alerteTexte: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: '500' },
    section: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
    chargement: { marginTop: 32 },
    liste: { gap: 12 },
    vide: { borderWidth: 1, borderRadius: 14, padding: 24, alignItems: 'center', gap: 8 },
    videTitre: { fontSize: 16, fontWeight: '700' },
    videTexte: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
    videBouton: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10, marginTop: 6 },
    videBoutonTexte: { fontSize: 14, fontWeight: '700' },
});
