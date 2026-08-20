import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';

/**
 * Le compte est valide, mais n'est livreur d'aucun restaurant.
 *
 * C'est l'unique cas où l'app ne peut rien faire : le rattachement se fait
 * depuis le tableau de bord du restaurant. Dire quoi demander, à qui, vaut mieux
 * qu'une erreur 403 répétée sur chaque écran.
 */
export default function AccesRefuseScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { user, signOut, refreshProfile } = useAuth();
    const [verification, setVerification] = useState(false);

    const reverifier = async () => {
        setVerification(true);
        const profil = await refreshProfile();
        setVerification(false);
        if (profil) router.replace('/(tabs)');
    };

    const deconnecter = async () => {
        await signOut();
        router.replace('/(auth)/login');
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
            <View style={styles.contenu}>
                <View style={[styles.icone, { backgroundColor: `${theme.warning}1a` }]}>
                    <Ionicons name="id-card-outline" size={40} color={theme.warning} />
                </View>

                <Text style={[styles.titre, { color: theme.text }]}>Compte pas encore livreur</Text>

                <Text style={[styles.texte, { color: theme.textSecondary }]}>
                    Votre connexion a réussi{user?.email ? ` (${user.email})` : ''}, mais aucun
                    restaurant ne vous a encore ajouté comme livreur.
                </Text>

                <View style={[styles.encadre, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.encadreTitre, { color: theme.text }]}>Que faire</Text>
                    <Text style={[styles.encadreTexte, { color: theme.textSecondary }]}>
                        Demandez au restaurant pour lequel vous livrez de vous ajouter depuis son
                        tableau de bord, dans <Text style={{ fontWeight: '700' }}>Équipe → Livreurs</Text>,
                        avec l’adresse e-mail ci-dessus. Revenez ensuite ici et touchez « Vérifier
                        à nouveau ».
                    </Text>
                </View>

                <Pressable
                    onPress={reverifier}
                    disabled={verification}
                    style={({ pressed }) => [
                        styles.bouton,
                        { backgroundColor: theme.primary, opacity: verification || pressed ? 0.8 : 1 },
                    ]}
                >
                    {verification ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.boutonTexte}>Vérifier à nouveau</Text>
                    )}
                </Pressable>

                <Pressable onPress={deconnecter} style={styles.lien}>
                    <Text style={[styles.lienTexte, { color: theme.textSecondary }]}>
                        Se connecter avec un autre compte
                    </Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    contenu: { flex: 1, justifyContent: 'center', padding: 24, gap: 16 },
    icone: {
        width: 76,
        height: 76,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
    },
    titre: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
    texte: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
    encadre: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 8 },
    encadreTitre: { fontSize: 14, fontWeight: '700' },
    encadreTexte: { fontSize: 13, lineHeight: 20 },
    bouton: { borderRadius: 12, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
    boutonTexte: { color: '#fff', fontSize: 16, fontWeight: '700' },
    lien: { alignItems: 'center', paddingVertical: 8 },
    lienTexte: { fontSize: 13, fontWeight: '600' },
});
