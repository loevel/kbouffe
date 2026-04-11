export function formatFCFA(amount: number | null | undefined) {
    return `${new Intl.NumberFormat('fr-FR').format(amount ?? 0)} FCFA`;
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
