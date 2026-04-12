import { useRouter } from 'expo-router';
import { useOnboarding } from '@/contexts/onboarding-context';
import { OnboardingScreen } from '@/components/onboarding-screen';
import { MessagesIllustration } from '@/components/onboarding-illustrations';

export default function MessagesScreen() {
    const router = useRouter();
    const { completeOnboarding } = useOnboarding();

    const handleNext = async () => {
        await completeOnboarding();
        router.replace('/(auth)/login');
    };

    return (
        <OnboardingScreen
            step={4}
            illustration={<MessagesIllustration />}
            title="Communication"
            description="Communiquez directement avec vos clients via la messagerie intégrée. Répondez rapidement aux questions et créez une relation de confiance."
            onNext={handleNext}
            onSkip={handleNext}
        />
    );
}
