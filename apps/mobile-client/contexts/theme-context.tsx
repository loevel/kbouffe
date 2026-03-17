import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme as useSystemColorScheme, type ColorSchemeName } from 'react-native';
import { updateProfile } from '@/lib/api';
import { useAuth } from './auth-context';

type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeContextType {
    preference: ThemePreference;
    resolvedScheme: NonNullable<ColorSchemeName>;
    setPreference: (value: ThemePreference) => Promise<void>;
    isLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated, user, refreshUser } = useAuth();
    const systemScheme = useSystemColorScheme() ?? 'light';
    const [preference, setPreferenceState] = useState<ThemePreference>('system');
    const [isLoaded, setIsLoaded] = useState(false);

    // Sync state when user profile is loaded
    useEffect(() => {
        if (user?.profile?.themePreference) {
            setPreferenceState(user.profile.themePreference as ThemePreference);
            setIsLoaded(true);
        } else {
            // Default to system if no preference is set in profile
            setIsLoaded(true);
        }
    }, [user]);

    const resolvedScheme: NonNullable<ColorSchemeName> = preference === 'system' ? systemScheme : preference;

    const setPreference = async (value: ThemePreference) => {
        setPreferenceState(value);
        if (isAuthenticated) {
            try {
                await updateProfile({ themePreference: value });
                await refreshUser();
            } catch (error) {
                console.error('Error syncing theme preference:', error);
            }
        }
    };

    const value = useMemo(
        () => ({ preference, resolvedScheme, setPreference, isLoaded }),
        [preference, resolvedScheme, isLoaded],
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useAppTheme must be used within AppThemeProvider');
    return context;
}
