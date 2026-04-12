export function formatAmount(amount: number | null | undefined, currency: 'XAF' | 'EUR' | 'USD' = 'XAF'): string {
    const num = amount ?? 0;
    if (currency === 'EUR') return `${new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num)} €`;
    if (currency === 'USD') return `$${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num)}`;
    return `${new Intl.NumberFormat('fr-FR').format(num)} FCFA`;
}

export function formatFCFA(amount: number | null | undefined) {
    return formatAmount(amount, 'XAF');
}

export function formatDate(value: string | null | undefined) {
    if (!value) return 'Non défini';

    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(value));
}

export function formatDateTime(value: string | null | undefined) {
    if (!value) return 'Non défini';

    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

export function relativeTime(value: string | null | undefined) {
    if (!value) return 'À l’instant';

    const date = new Date(value);
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);

    if (diff < 60) return 'À l’instant';
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
    if (diff < 172800) return 'Hier';
    return formatDate(value);
}
