import { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';

export default function LoginScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { signIn } = useAuth();

    const [email, setEmail] = useState('');
    const [motDePasse, setMotDePasse] = useState('');
    const [visible, setVisible] = useState(false);
    const [erreur, setErreur] = useState<string | null>(null);
    const [enCours, setEnCours] = useState(false);

    const valider = async () => {
        if (!email.trim() || !motDePasse) {
            setErreur('Renseignez votre e-mail et votre mot de passe.');
            return;
        }

        setEnCours(true);
        setErreur(null);

        const { error } = await signIn(email.trim().toLowerCase(), motDePasse);

        if (error) {
            setEnCours(false);
            setErreur(
                error.toLowerCase().includes('invalid')
                    ? 'E-mail ou mot de passe incorrect.'
                    : error
            );
            return;
        }

        // La redirection dépend du profil, que le contexte charge juste après :
        // l'écran d'accueil arbitre, on ne devine pas ici.
        router.replace('/');
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.contenu}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={[styles.logo, { backgroundColor: theme.primaryLight }]}>
                        <Ionicons name="bicycle" size={40} color={theme.primary} />
                    </View>

                    <Text style={[styles.titre, { color: theme.text }]}>Kbouffe Livreur</Text>
                    <Text style={[styles.sousTitre, { color: theme.textSecondary }]}>
                        Connectez-vous avec le compte que votre restaurant a ajouté à son équipe.
                    </Text>

                    <View style={styles.champs}>
                        <View>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>E-mail</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    { backgroundColor: theme.card, borderColor: theme.border, color: theme.text },
                                ]}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="vous@exemple.com"
                                placeholderTextColor={theme.tabIconDefault}
                                autoCapitalize="none"
                                autoCorrect={false}
                                keyboardType="email-address"
                                textContentType="emailAddress"
                                editable={!enCours}
                            />
                        </View>

                        <View>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>Mot de passe</Text>
                            <View style={styles.champMotDePasse}>
                                <TextInput
                                    style={[
                                        styles.input,
                                        styles.inputMotDePasse,
                                        { backgroundColor: theme.card, borderColor: theme.border, color: theme.text },
                                    ]}
                                    value={motDePasse}
                                    onChangeText={setMotDePasse}
                                    placeholder="••••••••"
                                    placeholderTextColor={theme.tabIconDefault}
                                    secureTextEntry={!visible}
                                    autoCapitalize="none"
                                    textContentType="password"
                                    editable={!enCours}
                                    onSubmitEditing={valider}
                                    returnKeyType="go"
                                />
                                <Pressable
                                    onPress={() => setVisible((v) => !v)}
                                    style={styles.oeil}
                                    hitSlop={8}
                                    accessibilityRole="button"
                                    accessibilityLabel={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                                >
                                    <Ionicons
                                        name={visible ? 'eye-off-outline' : 'eye-outline'}
                                        size={20}
                                        color={theme.textSecondary}
                                    />
                                </Pressable>
                            </View>
                        </View>
                    </View>

                    {erreur && (
                        <View style={[styles.erreur, { backgroundColor: `${theme.error}1a`, borderColor: theme.error }]}>
                            <Ionicons name="alert-circle-outline" size={18} color={theme.error} />
                            <Text style={[styles.erreurTexte, { color: theme.error }]}>{erreur}</Text>
                        </View>
                    )}

                    <Pressable
                        onPress={valider}
                        disabled={enCours}
                        style={({ pressed }) => [
                            styles.bouton,
                            { backgroundColor: theme.primary, opacity: enCours || pressed ? 0.8 : 1 },
                        ]}
                    >
                        {enCours ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.boutonTexte}>Se connecter</Text>
                        )}
                    </Pressable>

                    <Text style={[styles.aide, { color: theme.textSecondary }]}>
                        Pas encore de compte ? Cette application n’en crée pas : demandez au
                        restaurant pour lequel vous livrez de vous ajouter à son équipe.
                    </Text>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    flex: { flex: 1 },
    contenu: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 16 },
    logo: {
        width: 76,
        height: 76,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
    },
    titre: { fontSize: 26, fontWeight: '800', textAlign: 'center' },
    sousTitre: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
    champs: { gap: 16, marginTop: 8 },
    label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
        fontSize: 16,
    },
    champMotDePasse: { position: 'relative' },
    inputMotDePasse: { paddingRight: 48 },
    oeil: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
    erreur: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
    },
    erreurTexte: { flex: 1, fontSize: 13, fontWeight: '500' },
    bouton: {
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    boutonTexte: { color: '#fff', fontSize: 16, fontWeight: '700' },
    aide: { fontSize: 12, textAlign: 'center', lineHeight: 18, marginTop: 4 },
});
