import { Colors } from '@/constants/colors';
import { useColorScheme } from './use-color-scheme';
export function useTheme() {
    const scheme = useColorScheme();
    return Colors[scheme];
}
