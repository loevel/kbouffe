import { useColorScheme as useOSScheme } from 'react-native';
import { useSettings } from '@/contexts/settings-context';

export function useResolvedScheme(): 'light' | 'dark' {
    const { settings } = useSettings();
    const osScheme = useOSScheme() ?? 'light';

    if (settings.theme === 'auto') {
        return osScheme;
    }

    return settings.theme;
}
