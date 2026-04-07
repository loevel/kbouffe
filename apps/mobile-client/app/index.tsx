import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/auth-context';

const ONBOARDING_KEY = 'kbouffe_onboarding_done';

export default function Index() {
    const { user, isAuthenticated } = useAuth();
    const [localOnboardingDone, setLocalOnboardingDone] = useState<boolean | null>(null);

    useEffect(() => {
        AsyncStorage.getItem(ONBOARDING_KEY)
            .then((value) => setLocalOnboardingDone(value === 'true'))
            .catch(() => setLocalOnboardingDone(false));
    }, []);

    if (localOnboardingDone === null && !user?.profile) {
        return null;
    }

    if (!isAuthenticated) {
        return <Redirect href={localOnboardingDone ? '/(auth)/login' : '/onboarding'} />;
    }

    const onboardingDone = user?.profile?.onboardingCompleted ?? localOnboardingDone ?? false;

    return <Redirect href={onboardingDone ? '/(tabs)' : '/onboarding'} />;
}
