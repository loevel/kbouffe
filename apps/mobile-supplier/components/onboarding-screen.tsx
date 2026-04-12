import { View, Text, TouchableOpacity } from 'react-native';
import type { ReactNode } from 'react';
import { useTheme } from '@/hooks/use-theme';

interface OnboardingScreenProps {
    step: number;
    illustration?: ReactNode;
    title: string;
    description: string;
    nextRoute?: string;
    onNext: () => void;
    onSkip?: () => void;
}

export function OnboardingScreen({
    step,
    illustration,
    title,
    description,
    onNext,
    onSkip,
}: OnboardingScreenProps) {
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
                {illustration}

                <Text
                    style={{
                        fontSize: 28,
                        fontWeight: '700',
                        color: theme.text,
                        marginBottom: 12,
                        textAlign: 'center',
                    }}
                >
                    {title}
                </Text>

                <Text
                    style={{
                        fontSize: 16,
                        color: theme.text + '80',
                        textAlign: 'center',
                        lineHeight: 24,
                    }}
                >
                    {description}
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
                            width: i === step ? 24 : 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: i <= step ? theme.primary : theme.text + '40',
                        }}
                    />
                ))}
            </View>

            {/* Buttons */}
            <View style={{ gap: 12 }}>
                <TouchableOpacity
                    onPress={onNext}
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
                        Continuer
                    </Text>
                </TouchableOpacity>

                {onSkip && (
                    <TouchableOpacity
                        onPress={onSkip}
                        style={{
                            paddingVertical: 12,
                            alignItems: 'center',
                        }}
                    >
                        <Text
                            style={{
                                color: theme.text + '80',
                                fontSize: 16,
                                fontWeight: '500',
                            }}
                        >
                            Passer
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}
