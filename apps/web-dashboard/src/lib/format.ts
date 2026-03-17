import type { OrderStatus, PaymentMethod, PaymentStatus, PayoutStatus } from "@/lib/supabase/types";

export function formatCFA(amount: number): string {
    return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

export function formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
    const d = new Date(date);
    const dateStr = new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "short",
    }).format(d);
    const hours = d.getHours().toString().padStart(2, "0");
    const mins = d.getMinutes().toString().padStart(2, "0");
    return `${dateStr} a ${hours}h${mins}`;
}

export function formatOrderId(id: string): string {
    return `#KB-${id.slice(0, 4).toUpperCase()}`;
}

export function formatPhone(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 9) {
        return `+237 ${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`;
    }
    return phone;
}

const statusLabels: Record<OrderStatus, string> = {
    pending: "En attente",
    accepted: "Acceptee",
    preparing: "En preparation",
    ready: "Prete",
    delivering: "En livraison",
    delivered: "Livree",
    completed: "Terminee",
    cancelled: "Annulee",
    refunded: "Rembourse",
};

export function getStatusLabel(status: OrderStatus): string {
    return statusLabels[status];
}

const paymentLabels: Record<PaymentMethod, string> = {
    mobile_money_mtn: "MTN MoMo",
    mobile_money_orange: "Orange Money",
    cash: "Especes",
};

export function getPaymentLabel(method: PaymentMethod): string {
    return paymentLabels[method];
}

const paymentStatusLabels: Record<PaymentStatus, string> = {
    pending: "En attente",
    paid: "Paye",
    failed: "Echoue",
    refunded: "Rembourse",
};

export function getPaymentStatusLabel(status: PaymentStatus): string {
    return paymentStatusLabels[status];
}

const payoutStatusLabels: Record<PayoutStatus, string> = {
    pending: "En attente",
    paid: "Paye",
    failed: "Echoue",
};

export function getPayoutStatusLabel(status: PayoutStatus): string {
    return payoutStatusLabels[status];
}
