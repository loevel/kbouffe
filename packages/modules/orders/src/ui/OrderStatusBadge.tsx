"use client";

import { Badge, useLocale, type OrderStatus } from "@kbouffe/module-core/ui";


const statusConfig: Record<OrderStatus, { variant: "warning" | "info" | "brand" | "success" | "danger"; dot?: boolean }> = {
    pending: { variant: "warning", dot: true },
    accepted: { variant: "info" },
    preparing: { variant: "brand" },
    ready: { variant: "success" },
    delivering: { variant: "info", dot: true },
    delivered: { variant: "success" },
    completed: { variant: "success" },
    cancelled: { variant: "danger" },
    refunded: { variant: "danger", dot: true },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
    const { t } = useLocale();
    const config = statusConfig[status];
    return (
        <Badge variant={config.variant} dot={config.dot}>
            {t.orders[status]}
        </Badge>
    );
}
