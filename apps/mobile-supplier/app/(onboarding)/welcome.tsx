import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { WelcomeIllustration } from '@/components/onboarding-illustrations';

export default function WelcomeScreen() {
    const router = useRouter();
    const theme = useTheme();

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: theme.background,
                paddingHorizontal: 24,
                justifyContent: 'space-between',
                paddingTop: 60,
                paddingBottom: 40,
            }}
        >
            {/* Content */}
            <View style={{ alignItems: 'center' }}>
                {/* Illustration */}
                <WelcomeIllustration />

                <Text
                    style={{
                        fontSize: 28,
                        fontWeight: '700',
                        color: theme.text,
                        marginBottom: 12,
                        textAlign: 'center',
                    }}
                >
                    Bienvenue sur Kbouffe Fournisseur!
                </Text>

                <Text
                    style={{
                        fontSize: 16,
                        color: theme.text + '80',
                        textAlign: 'center',
                        lineHeight: 24,
                        marginBottom: 24,
                    }}
                >
                    Gérez vos produits, traitez les commandes et connectez-vous avec vos clients en quelques clics.
                </Text>
            </View>

            {/* Progress Dots */}
            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 6,
                    marginBottom: 32,
                }}
            >
                {[0, 1, 2, 3, 4].map((i) => (
                    <View
                        key={i}
                        style={{
                            width: i === 0 ? 24 : 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: i === 0 ? theme.primary : theme.text + '40',
                        }}
                    />
                ))}
            </View>

            {/* Button */}
            <TouchableOpacity
                onPress={() => router.push('/(onboarding)/features')}
                style={{
                    backgroundColor: theme.primary,
                    paddingVertical: 16,
                    borderRadius: 12,
                    alignItems: 'center',
                }}
            >
                <Text
                    style={{
                        color: '#fff',
                        fontSize: 16,
                        fontWeight: '600',
                    }}
                >
                    Commencer
                </Text>
            </TouchableOpacity>
        </View>
    );
}
