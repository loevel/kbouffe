import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/auth-context';
import { useSettings } from '@/contexts/settings-context';
import { useTheme } from '@/hooks/use-theme';
import { definirDisponibilite } from '@/lib/driver';
import { tailleDeLaFile, viderLaFile } from '@/lib/outbox';

export default function ProfilScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { profile, user, signOut, setDisponible, refreshProfile } = useAuth();
    const { settings, updateSettings } = useSettings();
    const [enAttente, setEnAttente] = useState(0);

    const compterFile = useCallback(async () => {
        setEnAttente(await tailleDeLaFile());
    }, []);

    useEffect(() => {
        compterFile();
    }, [compterFile]);

    const synchroniser = async () => {
        const { envoyees, abandonnees } = await viderLaFile();
        await compterFile();
        await refreshProfile();

        if (abandonnees.length > 0) {
            // Ne pas taire un abandon : le livreur pense l'action faite.
            Alert.alert(
                'Certaines actions ont été refusées',
                abandonnees.map((a) => `• ${a.raison}`).join('\n')
            );
            return;
        }

        Alert.alert(
            'Synchronisation terminée',
            envoyees > 0
                ? `${envoyees} action${envoyees > 1 ? 's' : ''} envoyée${envoyees > 1 ? 's' : ''}.`
                : 'Tout était déjà à jour.'
        );
    };

    const deconnecter = () => {
        Alert.alert('Se déconnecter', 'Voulez-vous vraiment vous déconnecter ?', [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Se déconnecter',
                style: 'destructive',
                onPress: async () => {
                    // La file survit à la déconnexion mais ne pourra plus partir :
                    // mieux vaut prévenir que de la laisser expirer en silence.
                    if (await tailleDeLaFile()) {
                        Alert.alert(
                            'Actions non envoyées',
                            'Des actions attendent encore d’être transmises. Reconnectez-vous une fois le réseau revenu pour qu’elles partent.'
                        );
                    }
                    await signOut();
                    router.replace('/(auth)/login');
                },
            },
        ]);
    };

    const disponible = profile?.available ?? true;

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
            <ScrollView contentContainerStyle={styles.contenu}>
                <View style={[styles.entete, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={[styles.avatar, { backgroundColor: theme.primaryLight }]}>
                        <Ionicons name="person" size={28} color={theme.primary} />
                    </View>
                    <Text style={[styles.nom, { color: theme.text }]}>
                        {profile?.fullName ?? 'Livreur'}
                    </Text>
                    <Text style={[styles.email, { color: theme.textSecondary }]}>
                        {profile?.email ?? user?.email ?? ''}
                    </Text>
                    {profile?.phone && (
                        <Text style={[styles.email, { color: theme.textSecondary }]}>{profile.phone}</Text>
                    )}
                </View>

                <Text style={[styles.section, { color: theme.textSecondary }]}>Service</Text>
                <View style={[styles.groupe, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.rangee}>
                        <Ionicons name="radio-outline" size={20} color={theme.icon} />
                        <Text style={[styles.rangeeTexte, { color: theme.text }]}>Disponible</Text>
                        <Switch
                            value={disponible}
                            onValueChange={async (valeur) => {
                                setDisponible(valeur);
                                try {
                                    await definirDisponibilite(valeur);
                                } catch (error) {
                                    setDisponible(!valeur);
                                    console.error('Disponibilité non enregistrée', error);
                                }
                            }}
                            trackColor={{ false: theme.border, true: theme.primary }}
                        />
                    </View>
                </View>

                <Text style={[styles.section, { color: theme.textSecondary }]}>Affichage</Text>
                <View style={[styles.groupe, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.rangee}>
                        <Ionicons name="moon-outline" size={20} color={theme.icon} />
                        <Text style={[styles.rangeeTexte, { color: theme.text }]}>Thème sombre</Text>
                        <Switch
                            value={settings.theme === 'dark'}
                            onValueChange={(valeur) => updateSettings({ theme: valeur ? 'dark' : 'light' })}
                            trackColor={{ false: theme.border, true: theme.primary }}
                        />
                    </View>
                    <View style={[styles.separateur, { backgroundColor: theme.border }]} />
                    <Pressable
                        onPress={() => updateSettings({ theme: 'auto' })}
                        style={({ pressed }) => [styles.rangee, { opacity: pressed ? 0.7 : 1 }]}
                    >
                        <Ionicons name="phone-portrait-outline" size={20} color={theme.icon} />
                        <Text style={[styles.rangeeTexte, { color: theme.text }]}>Suivre le système</Text>
                        {settings.theme === 'auto' && (
                            <Ionicons name="checkmark" size={20} color={theme.primary} />
                        )}
                    </Pressable>
                </View>

                <Text style={[styles.section, { color: theme.textSecondary }]}>Données</Text>
                <View style={[styles.groupe, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Pressable
                        onPress={synchroniser}
                        style={({ pressed }) => [styles.rangee, { opacity: pressed ? 0.7 : 1 }]}
                    >
                        <Ionicons name="sync-outline" size={20} color={theme.icon} />
                        <Text style={[styles.rangeeTexte, { color: theme.text }]}>Synchroniser maintenant</Text>
                        {enAttente > 0 ? (
                            <View style={[styles.compteur, { backgroundColor: theme.warning }]}>
                                <Text style={styles.compteurTexte}>{enAttente}</Text>
                            </View>
                        ) : (
                            <Ionicons name="chevron-forward" size={18} color={theme.tabIconDefault} />
                        )}
                    </Pressable>
                </View>

                <Pressable
                    onPress={deconnecter}
                    style={({ pressed }) => [
                        styles.deconnexion,
                        { borderColor: theme.error, opacity: pressed ? 0.7 : 1 },
                    ]}
                >
                    <Ionicons name="log-out-outline" size={20} color={theme.error} />
                    <Text style={[styles.deconnexionTexte, { color: theme.error }]}>Se déconnecter</Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    contenu: { padding: 16, paddingBottom: 32, gap: 8 },
    entete: { borderWidth: 1, borderRadius: 16, padding: 20, alignItems: 'center', gap: 4, marginBottom: 8 },
    avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
    nom: { fontSize: 18, fontWeight: '800' },
    email: { fontSize: 13 },
    section: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 10, marginBottom: 4 },
    groupe: { borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
    rangee: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
    rangeeTexte: { flex: 1, fontSize: 15, fontWeight: '500' },
    separateur: { height: 1, marginLeft: 46 },
    compteur: { minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
    compteurTexte: { color: '#fff', fontSize: 12, fontWeight: '700' },
    deconnexion: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1,
        borderRadius: 12,
        paddingVertical: 15,
        marginTop: 18,
    },
    deconnexionTexte: { fontSize: 15, fontWeight: '700' },
});
