import { useRouter } from 'expo-router';
import { OnboardingScreen } from '@/components/onboarding-screen';
import { FeaturesIllustration } from '@/components/onboarding-illustrations';

export default function FeaturesScreen() {
    const router = useRouter();

    return (
        <OnboardingScreen
            step={1}
            illustration={<FeaturesIllustration />}
            title="Fonctionnalités principales"
            description="Découvrez comment gérer votre catalogue, les commandes, les messages clients et les statistiques de vente en un seul endroit."
            onNext={() => router.push('/(onboarding)/catalog')}
            onSkip={() => router.push('/(onboarding)/messages')}
        />
    );
}
