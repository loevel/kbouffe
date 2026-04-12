import { useSettings } from '@/contexts/settings-context';

export function useFontScale(): number {
    const { settings } = useSettings();

    if (settings.fontSize === 'small') return 0.85;
    if (settings.fontSize === 'large') return 1.2;
    return 1;
}

export function scaled(base: number, scale: number): number {
    return Math.round(base * scale);
}
