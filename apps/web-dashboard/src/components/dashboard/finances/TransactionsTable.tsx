"use client";

import { Download } from "lucide-react";
import { Card, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, Button, toast } from "@kbouffe/module-core/ui";
import { useLocale } from "@kbouffe/module-core/ui";
import { formatCFA, formatDateTime, formatOrderId, getPaymentLabel, getPaymentStatusLabel } from "@kbouffe/module-core/ui";

interface TransactionRow {
    id: string;
    customer_name: string;
    total: number;
    payment_method: string;
    payment_status: string;
    status: string;
    created_at: string;
}

interface TransactionsTableProps {
    transactions: TransactionRow[];
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
    const { t } = useLocale();

    function exportCsv() {
        const headers = [
            t.finances.order,
            t.finances.customer,
            t.finances.amount,
            t.finances.mode,
            t.finances.status,
            t.finances.date,
        ];
        const rows = transactions.map((order) => [
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
                    {transactions.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-surface-400">
                                Aucune transaction trouvée pour cette période
                            </TableCell>
                        </TableRow>
                    ) : (
                        transactions.map((order) => (
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
                        ))
                    )}
                </TableBody>
            </Table>
        </Card>
    );
}
