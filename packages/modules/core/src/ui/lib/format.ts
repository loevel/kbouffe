export function formatCFA(amount: number | null | undefined): string {
    const value = typeof amount === "number" && Number.isFinite(amount) ? amount : 0;
    return new Intl.NumberFormat("fr-FR").format(value) + " FCFA";
}

export function formatDate(date: string | Date | null | undefined): string {
    if (date === null || date === undefined || date === "") return "—";
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(d);
}

export function formatDateTime(date: string | Date | null | undefined): string {
    if (date === null || date === undefined || date === "") return "—";
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "—";
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

export function getPaymentLabel(method: string): string {
    const labels: Record<string, string> = {
        orange_money: "Orange Money",
        mobile_money_orange: "Orange Money",
        mtn_mobile_money: "MTN MoMo",
        mobile_money_mtn: "MTN MoMo",
        cash: "Espèces",
        card: "Carte bancaire",
        mixed: "Paiement partagé",
    };
    return labels[method] || method;
}

export function getPaymentStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        pending: "En attente",
        paid: "Payé",
        failed: "Échoué",
        refunded: "Remboursé",
    };
    return labels[status] || status;
}
