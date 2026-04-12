import { useRouter } from 'expo-router';
import { OnboardingScreen } from '@/components/onboarding-screen';
import { OrdersIllustration } from '@/components/onboarding-illustrations';

export default function OrdersScreen() {
    const router = useRouter();

    return (
        <OnboardingScreen
            step={3}
            illustration={<OrdersIllustration />}
            title="Gestion des commandes"
            description="Recevez les commandes de vos clients, confirmez-les, et suivez leur statut en temps réel. Notifiez vos clients des mises à jour."
            onNext={() => router.push('/(onboarding)/messages')}
            onSkip={() => router.push('/(onboarding)/messages')}
        />
    );
}
