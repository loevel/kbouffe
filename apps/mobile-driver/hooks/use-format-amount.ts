import { useSettings } from '@/contexts/settings-context';
import { formatAmount } from '@/lib/format';

export function useFormatAmount() {
    const { settings } = useSettings();

    return (amount: number | null | undefined) => formatAmount(amount, settings.currency);
}
