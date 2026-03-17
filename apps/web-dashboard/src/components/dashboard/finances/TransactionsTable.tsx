"use client";

import { Download } from "lucide-react";
import { Card, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, Button, toast } from "@/components/ui";
import { useOrders } from "@/hooks/use-data";
import { useLocale } from "@/contexts/locale-context";
import { formatCFA, formatDateTime, formatOrderId, getPaymentLabel, getPaymentStatusLabel, formatDate } from "@/lib/format";

export function TransactionsTable() {
    const { t } = useLocale();
    const { orders } = useOrders({ limit: 200 });
    const paidOrders = orders.filter(o => o.payment_status === "paid" && o.status !== "cancelled");

    function exportCsv() {
        const headers = [
            t.finances.order,
            t.finances.customer,
            t.finances.amount,
            t.finances.mode,
            t.finances.status,
            t.finances.date,
        ];
        const rows = paidOrders.map((order) => [
            formatOrderId(order.id),
            order.customer_name,
            String(order.total),
            getPaymentLabel(order.payment_method),
            getPaymentStatusLabel(order.payment_status),
            formatDateTime(order.created_at),
        ]);

        const csvContent = [headers, ...rows]
            .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
            .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `transactions-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success(t.finances.exportSuccess);
    }

    return (
        <Card padding="none">
            <div className="px-6 py-4 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between">
                <h3 className="font-semibold text-surface-900 dark:text-white">{t.finances.recentTransactions}</h3>
                <Button variant="outline" size="sm" leftIcon={<Download size={14} />} onClick={exportCsv}>
                    {t.finances.export}
                </Button>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t.finances.order}</TableHead>
                        <TableHead>{t.finances.customer}</TableHead>
                        <TableHead>{t.finances.amount}</TableHead>
                        <TableHead>{t.finances.mode}</TableHead>
                        <TableHead>{t.finances.status}</TableHead>
                        <TableHead>{t.finances.date}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {paidOrders.map((order) => (
                        <TableRow key={order.id}>
                            <TableCell className="font-medium text-surface-900 dark:text-white">{formatOrderId(order.id)}</TableCell>
                            <TableCell>{order.customer_name}</TableCell>
                            <TableCell className="font-medium">{formatCFA(order.total)}</TableCell>
                            <TableCell>{getPaymentLabel(order.payment_method)}</TableCell>
                            <TableCell>
                                <Badge variant="success">{getPaymentStatusLabel(order.payment_status)}</Badge>
                            </TableCell>
                            <TableCell className="text-surface-500">{formatDateTime(order.created_at)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    );
}
