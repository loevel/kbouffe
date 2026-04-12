import { useRouter } from 'expo-router';
import { OnboardingScreen } from '@/components/onboarding-screen';
import { CatalogIllustration } from '@/components/onboarding-illustrations';

export default function CatalogScreen() {
    const router = useRouter();

    return (
        <OnboardingScreen
            step={2}
            illustration={<CatalogIllustration />}
            title="Gestion du catalogue"
            description="Ajoutez et gérez vos produits facilement. Définissez les prix, images, descriptions et catégories pour attirer plus de clients."
            onNext={() => router.push('/(onboarding)/orders')}
            onSkip={() => router.push('/(onboarding)/messages')}
        />
    );
}
