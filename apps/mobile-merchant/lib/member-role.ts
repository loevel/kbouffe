const MEMBER_ROLE_LABELS: Record<string, string> = {
    owner: 'Proprietaire',
    manager: 'Gerant',
    cashier: 'Caissier',
    cook: 'Cuisinier',
    driver: 'Livreur',
    viewer: 'Observateur',
};

export function getMemberRoleLabel(role: string | null | undefined) {
    if (!role) return 'Gerant';
    return MEMBER_ROLE_LABELS[role] ?? 'Gerant';
}
