import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';

export default function Index() {
    const { user, isAuthenticated } = useAuth();
    
    // AuthProvider handles its own loading state and returns null, 
    // but we can check if we have a user to determine onboarding.
    
    const onboardingDone = user?.profile?.onboardingCompleted ?? false;

    return <Redirect href={onboardingDone ? '/(tabs)' : '/onboarding'} />;
}
