import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingContextValue {
    hasCompletedOnboarding: boolean;
    completeOnboarding: () => Promise<void>;
    resetOnboarding: () => Promise<void>;
    loading: boolean;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkOnboardingStatus = async () => {
            try {
                const completed = await AsyncStorage.getItem('onboarding_completed');
                setHasCompletedOnboarding(completed === 'true');
            } catch (error) {
                console.error('Failed to check onboarding status', error);
            } finally {
                setLoading(false);
            }
        };

        checkOnboardingStatus();
    }, []);

    const completeOnboarding = async () => {
        try {
            await AsyncStorage.setItem('onboarding_completed', 'true');
            setHasCompletedOnboarding(true);
        } catch (error) {
            console.error('Failed to complete onboarding', error);
        }
    };

    const resetOnboarding = async () => {
        try {
            await AsyncStorage.removeItem('onboarding_completed');
            setHasCompletedOnboarding(false);
        } catch (error) {
            console.error('Failed to reset onboarding', error);
        }
    };

    return (
        <OnboardingContext.Provider
            value={{
                hasCompletedOnboarding,
                completeOnboarding,
                resetOnboarding,
                loading,
            }}
        >
            {children}
        </OnboardingContext.Provider>
    );
}

export function useOnboarding() {
    const context = useContext(OnboardingContext);

    if (!context) {
        throw new Error('useOnboarding must be used within OnboardingProvider');
    }

    return context;
}
