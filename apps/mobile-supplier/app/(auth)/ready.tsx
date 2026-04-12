import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { ReadyIllustration } from '@/components/onboarding-illustrations';

export default function ReadyScreen() {
    const router = useRouter();
    const theme = useTheme();

    const handleGetStarted = async () => {
        router.replace('/(auth)/awaiting-approval');
    };

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
                <ReadyIllustration />

                <Text
                    style={{
                        fontSize: 28,
                        fontWeight: '700',
                        color: theme.text,
                        marginBottom: 12,
                        textAlign: 'center',
                    }}
                >
                    Bienvenue! 🎉
                </Text>

                <Text
                    style={{
                        fontSize: 16,
                        color: theme.text + '80',
                        textAlign: 'center',
                        lineHeight: 24,
                    }}
                >
                    Votre compte fournisseur a été créé avec succès. Accédez à votre tableau de bord et commencez à gérer vos produits.
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
                            width: i === 4 ? 24 : 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: theme.primary,
                        }}
                    />
                ))}
            </View>

            {/* Button */}
            <TouchableOpacity
                onPress={handleGetStarted}
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
                    Accéder au tableau de bord
                </Text>
            </TouchableOpacity>
        </View>
    );
}
