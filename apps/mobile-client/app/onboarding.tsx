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
import { Colors, Spacing, Radii, Typography, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/auth-context';
import { updateProfile } from '@/lib/api';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';

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
        title: 'Découvrez les meilleurs restaurants',
        subtitle: 'Ndolé, poulet DG, poisson braisé, burgers... Explorez les saveurs autour de vous.',
        accent: '#FF6B00',
    },
    {
        id: '2',
        image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
        icon: 'calendar-outline',
        title: 'Réservez votre table en avance',
        subtitle: 'Choisissez votre horaire et votre nombre de couverts pour arriver sereinement.',
        accent: '#ec4899',
    },
    {
        id: '3',
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
        icon: 'phone-portrait-outline',
        title: 'Commandez en quelques clics',
        subtitle: 'Parcourez les menus, personnalisez vos plats et passez commande très simplement.',
        accent: '#10b981',
    },
    {
        id: '4',
        image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
        icon: 'wallet-outline',
        title: 'Payez avec Mobile Money',
        subtitle: 'MTN MoMo, Orange Money ou en espèces à la livraison. Simple et sécurisé.',
        accent: '#3b82f6',
    },
];

function PaginationDot({ index, currentIndex, accent, theme }: { index: number, currentIndex: number, accent: string, theme: any }) {
    const isActive = index === currentIndex;
    
    const animatedStyle = useAnimatedStyle(() => {
        return {
            width: withSpring(isActive ? 28 : 8, { damping: 15 }),
            backgroundColor: withTiming(isActive ? accent : theme.border, { duration: 300 }),
        };
    });

    return <Animated.View style={[styles.dot, animatedStyle]} />;
}

export default function OnboardingScreen() {
    const router = useRouter();
    const { isAuthenticated, refreshUser } = useAuth();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const insets = useSafeAreaInsets();
    const flatListRef = useRef<FlatList<OnboardingPage>>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [completing, setCompleting] = useState(false);

    const isLastPage = currentIndex === pages.length - 1;
    const currentAccent = pages[currentIndex].accent;

    const onViewableItemsChanged = useRef(
        ({ viewableItems }: { viewableItems: ViewToken[] }) => {
            if (viewableItems.length > 0 && viewableItems[0].index != null) {
                setCurrentIndex(viewableItems[0].index);
            }
        },
    ).current;

    const completeOnboarding = async () => {
        if (completing) return;
        setCompleting(true);
        await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
        if (isAuthenticated) {
            updateProfile({ onboardingCompleted: true })
                .then(() => refreshUser())
                .catch(console.error);
        }
        router.replace('/');
    };

    const handleNext = () => {
        if (isLastPage) completeOnboarding();
        else flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    };

    const renderPage = ({ item }: { item: OnboardingPage }) => (
        <View style={[styles.page, { width }]}>
            <View style={styles.imageContainer}>
                <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
            </View>
            <View style={[styles.card, { backgroundColor: theme.surface }]}>
                <View style={[styles.iconCircle, { backgroundColor: item.accent + '1A' }]}>
                    <Ionicons name={item.icon} size={32} color={item.accent} />
                </View>
                <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
                <Text style={[styles.subtitle, { color: theme.textMuted }]}>{item.subtitle}</Text>
            </View>
        </View>
    );

    const buttonStyle = useAnimatedStyle(() => {
        return {
            backgroundColor: withTiming(currentAccent, { duration: 300 }),
        };
    });

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Pressable
                style={[
                    styles.skipButton,
                    {
                        top: insets.top + Spacing.md,
                        backgroundColor: theme.surfaceElevated,
                        borderColor: theme.border,
                    },
                ]}
                onPress={completeOnboarding}
                disabled={completing}
            >
                <Text style={[styles.skipText, { color: theme.text }]}>Passer</Text>
            </Pressable>

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
                viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
            />

            <View style={[styles.bottomContainer, { paddingBottom: Math.max(insets.bottom + Spacing.sm, Spacing.xl) }]}>
                <View style={styles.bottomRow}>
                    <View style={styles.dotsContainer}>
                        {pages.map((_, index) => (
                            <PaginationDot key={index} index={index} currentIndex={currentIndex} accent={currentAccent} theme={theme} />
                        ))}
                    </View>

                    {!isLastPage && (
                        <Animated.View style={[styles.nextButtonWrapper, buttonStyle]}>
                            <Pressable style={styles.nextButton} onPress={handleNext} disabled={completing}>
                                <Ionicons name="arrow-forward" size={28} color="#fff" />
                            </Pressable>
                        </Animated.View>
                    )}
                </View>

                {isLastPage && (
                    <Animated.View style={[styles.startButtonWrapper, { backgroundColor: currentAccent }]}>
                        <Pressable style={styles.nextButton} onPress={handleNext} disabled={completing}>
                            <Text style={styles.startButtonText}>{completing ? 'Ouverture...' : 'Commencer'}</Text>
                        </Pressable>
                    </Animated.View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    skipButton: {
        position: 'absolute',
        right: Spacing.lg,
        zIndex: 10,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: Radii.full,
        borderWidth: 1,
        ...Shadows.sm,
    },
    skipText: { ...Typography.bodySemibold },
    page: { flex: 1 },
    imageContainer: {
        height: height * 0.58,
        width: '100%',
    },
    image: { width: '100%', height: '100%' },
    card: {
        flex: 1,
        marginTop: -52,
        borderTopLeftRadius: 44,
        borderTopRightRadius: 44,
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xxl,
        alignItems: 'flex-start',
        ...Shadows.lg,
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
    },
    title: {
        ...Typography.title1,
        marginBottom: Spacing.md,
    },
    subtitle: {
        ...Typography.body,
        lineHeight: 24,
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.md,
        gap: Spacing.md,
    },
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dotsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dot: { height: 8, borderRadius: 4 },
    nextButtonWrapper: {
        height: 56,
        width: 56,
        borderRadius: 28,
        overflow: 'hidden',
        ...Shadows.lg,
    },
    startButtonWrapper: {
        height: 56,
        borderRadius: 28,
        overflow: 'hidden',
        ...Shadows.lg,
    },
    nextButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    startButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
});
