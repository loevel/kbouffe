import { useRef, useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Pressable,
    FlatList,
    Dimensions,
    Image,
    ViewToken,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radii, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/auth-context';
import { updateProfile } from '@/lib/api';

const ONBOARDING_KEY = 'kbouffe_onboarding_done';

const { width, height } = Dimensions.get('window');

interface OnboardingPage {
    id: string;
    image: string;
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
    accent: string;
}

const pages: OnboardingPage[] = [
    {
        id: '1',
        image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
        icon: 'restaurant-outline',
        title: 'Decouvrez les\nmeilleurs restaurants',
        subtitle: 'Ndole, poulet DG, poisson braise, burgers et bien plus. Explorez les saveurs du Cameroun pres de chez vous.',
        accent: '#f97316',
    },
    {
        id: '2',
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
        icon: 'phone-portrait-outline',
        title: 'Commandez en\nquelques taps',
        subtitle: 'Parcourez les menus, personnalisez vos plats et passez commande en moins d\'une minute.',
        accent: '#10b981',
    },
    {
        id: '3',
        image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
        icon: 'wallet-outline',
        title: 'Payez avec\nMobile Money',
        subtitle: 'MTN MoMo, Orange Money ou en especes a la livraison. Simple et securise.',
        accent: '#3b82f6',
    },
    {
        id: '4',
        image: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=800&q=80',
        icon: 'bicycle-outline',
        title: 'Livraison rapide\na votre porte',
        subtitle: 'Suivez votre commande en temps reel et recevez vos plats chauds directement chez vous.',
        accent: '#8b5cf6',
    },
];

export default function OnboardingScreen() {
    const router = useRouter();
    const { isAuthenticated, refreshUser } = useAuth();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const flatListRef = useRef<FlatList<OnboardingPage>>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const isLastPage = currentIndex === pages.length - 1;

    const onViewableItemsChanged = useRef(
        ({ viewableItems }: { viewableItems: ViewToken[] }) => {
            if (viewableItems.length > 0 && viewableItems[0].index != null) {
                setCurrentIndex(viewableItems[0].index);
            }
        },
    ).current;

    const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const completeOnboarding = async () => {
        await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
        if (isAuthenticated) {
            try {
                await updateProfile({ onboardingCompleted: true });
                await refreshUser();
            } catch (error) {
                console.error('Error syncing onboarding status:', error);
            }
        }
        router.replace('/(tabs)');
    };

    const handleNext = () => {
        if (isLastPage) {
            completeOnboarding();
        } else {
            flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true,
            });
        }
    };

    const handleSkip = () => {
        completeOnboarding();
    };

    const renderPage = ({ item }: { item: OnboardingPage }) => (
        <View style={[styles.page, { width }]}>
            {/* Image */}
            <View style={styles.imageContainer}>
                <Image
                    source={{ uri: item.image }}
                    style={styles.image}
                    resizeMode="cover"
                />
                {/* Gradient overlay */}
                <View style={[styles.imageOverlay, { backgroundColor: colorScheme === 'dark' ? '#0f172a' : '#f8fafc' }]} />
            </View>

            {/* Content */}
            <View style={styles.content}>
                <View style={[styles.iconCircle, { backgroundColor: item.accent + '15' }]}>
                    <Ionicons name={item.icon} size={28} color={item.accent} />
                </View>

                <Text style={[styles.title, { color: theme.text }]}>
                    {item.title}
                </Text>

                <Text style={[styles.subtitle, { color: theme.icon }]}>
                    {item.subtitle}
                </Text>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Skip button */}
            <Pressable
                style={[styles.skipButton, { top: insets.top + Spacing.sm }]}
                onPress={handleSkip}
            >
                <Text style={[styles.skipText, { color: theme.icon }]}>Passer</Text>
            </Pressable>

            {/* Pages */}
            <FlatList
                ref={flatListRef}
                data={pages}
                renderItem={renderPage}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                bounces={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
            />

            {/* Bottom controls */}
            <View style={[styles.bottomContainer, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
                {/* Dots */}
                <View style={styles.dotsContainer}>
                    {pages.map((page, index) => (
                        <View
                            key={page.id}
                            style={[
                                styles.dot,
                                {
                                    backgroundColor: index === currentIndex ? page.accent : theme.border,
                                    width: index === currentIndex ? 24 : 8,
                                },
                            ]}
                        />
                    ))}
                </View>

                {/* Next / Get Started button */}
                <Pressable
                    style={[
                        styles.nextButton,
                        {
                            backgroundColor: pages[currentIndex].accent,
                            width: isLastPage ? '100%' : 56,
                            borderRadius: isLastPage ? Radii.xl : 28,
                        },
                    ]}
                    onPress={handleNext}
                >
                    {isLastPage ? (
                        <Text style={styles.startButtonText}>Commencer</Text>
                    ) : (
                        <Ionicons name="arrow-forward" size={22} color="#fff" />
                    )}
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    skipButton: {
        position: 'absolute',
        right: Spacing.md,
        zIndex: 10,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    skipText: {
        ...Typography.body,
        fontWeight: '500',
    },
    page: {
        flex: 1,
    },
    imageContainer: {
        height: height * 0.5,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 120,
        opacity: 0.95,
        // Simulated gradient via layered opacity
    },
    content: {
        flex: 1,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        alignItems: 'center',
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: 30,
        fontWeight: '800',
        textAlign: 'center',
        lineHeight: 38,
        marginBottom: Spacing.md,
    },
    subtitle: {
        ...Typography.body,
        textAlign: 'center',
        lineHeight: 24,
        maxWidth: 300,
    },
    bottomContainer: {
        paddingHorizontal: Spacing.lg,
        gap: Spacing.lg,
        alignItems: 'center',
    },
    dotsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dot: {
        height: 8,
        borderRadius: 4,
    },
    nextButton: {
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    startButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
});
