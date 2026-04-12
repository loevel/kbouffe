import { Colors } from '@/constants/colors';
import { useResolvedScheme } from './use-resolved-scheme';

export function useTheme() {
    const scheme = useResolvedScheme();
    return Colors[scheme];
}
