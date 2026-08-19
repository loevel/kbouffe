import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Theme = 'light' | 'dark' | 'auto';
export type Language = 'fr' | 'en';
export type Currency = 'XAF' | 'EUR' | 'USD';

interface Settings {
    theme: Theme;
    language: Language;
    currency: Currency;
    notifications: boolean;
    emailNotifications: boolean;
    darkMode: boolean;
    fontSize: 'small' | 'normal' | 'large';
    compactMode: boolean;
}

interface SettingsContextValue {
    settings: Settings;
    updateSettings: (settings: Partial<Settings>) => Promise<void>;
    resetSettings: () => Promise<void>;
    loading: boolean;
}

const defaultSettings: Settings = {
    theme: 'auto',
    language: 'fr',
    currency: 'XAF',
    notifications: true,
    emailNotifications: true,
    darkMode: false,
    fontSize: 'normal',
    compactMode: false,
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const saved = await AsyncStorage.getItem('app_settings');
                if (saved) {
                    setSettings(JSON.parse(saved));
                }
            } catch (error) {
                console.error('Failed to load settings', error);
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, []);

    const updateSettings = async (newSettings: Partial<Settings>) => {
        try {
            const updated = { ...settings, ...newSettings };
            setSettings(updated);
            await AsyncStorage.setItem('app_settings', JSON.stringify(updated));
        } catch (error) {
            console.error('Failed to update settings', error);
        }
    };

    const resetSettings = async () => {
        try {
            setSettings(defaultSettings);
            await AsyncStorage.removeItem('app_settings');
        } catch (error) {
            console.error('Failed to reset settings', error);
        }
    };

    return (
        <SettingsContext.Provider
            value={{
                settings,
                updateSettings,
                resetSettings,
                loading,
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);

    if (!context) {
        throw new Error('useSettings must be used within SettingsProvider');
    }

    return context;
}
