import type { MobileOrderStatus } from '@/contexts/orders-context';

export const TERMINAL_ORDER_STATUSES: MobileOrderStatus[] = ['completed', 'delivered', 'cancelled'];

export function mapApiOrderStatus(apiStatus: string): MobileOrderStatus {
    const map: Record<string, MobileOrderStatus> = {
        pending: 'pending',
        confirmed: 'confirmed',
        accepted: 'accepted',
        preparing: 'preparing',
        ready: 'ready',
        out_for_delivery: 'delivering',
        delivering: 'delivering',
        delivered: 'delivered',
        completed: 'completed',
        cancelled: 'cancelled',
    };
    return map[apiStatus] ?? 'pending';
}

export function getOrderStatusLabel(status: MobileOrderStatus): string {
    const labels: Record<MobileOrderStatus, string> = {
        pending: 'En attente',
        confirmed: 'Confirmée',
        accepted: 'Acceptée',
        preparing: 'En préparation',
        ready: 'Prête',
        delivering: 'En livraison',
        delivered: 'Livrée',
        completed: 'Terminée',
        cancelled: 'Annulée',
    };
    return labels[status];
}
