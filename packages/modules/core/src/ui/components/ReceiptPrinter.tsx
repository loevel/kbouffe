"use client";

import React from "react";
import { Printer } from "lucide-react";
import { Button, formatCFA, formatDateTime, formatOrderId } from "@kbouffe/module-core/ui";

interface ReceiptPrinterProps {
    order: any;
    restaurant: any;
}

export function ReceiptPrinter({ order, restaurant }: ReceiptPrinterProps) {
    const handlePrint = () => {
        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        const items = order.items || [];
        const itemsHtml = items.map((item: any) => `
            <tr>
                <td style="padding: 5px 0;">${item.quantity}x ${item.name || "Produit"}</td>
                <td style="text-align: right; padding: 5px 0;">${formatCFA((item.price || 0) * item.quantity)}</td>
            </tr>
            ${item.selectedOptions ? `
                <tr>
                    <td colspan="2" style="font-size: 10px; color: #666; padding-bottom: 5px;">
                        ${Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(", ")}
                    </td>
                </tr>
            ` : ""}
        `).join("");

        printWindow.document.write(`
            <html>
                <head>
                    <title>Ticket ${formatOrderId(order.id)}</title>
                    <style>
                        @page { size: 80mm auto; margin: 0; }
                        body { 
                            font-family: 'Courier New', Courier, monospace; 
                            width: 72mm; 
                            margin: 0 auto; 
                            padding: 10mm 2mm;
                            font-size: 12px;
                            line-height: 1.2;
                        }
                        .text-center { text-align: center; }
                        .bold { font-weight: bold; }
                        .divider { border-bottom: 1px dashed #000; margin: 10px 0; }
                        table { width: 100%; border-collapse: collapse; }
                        .footer { margin-top: 20px; font-size: 10px; }
                    </style>
                </head>
                <body>
                    <div class="text-center">
                        <div class="bold" style="font-size: 16px;">${restaurant?.name || "Kbouffe"}</div>
                        <div>${restaurant?.address || ""}</div>
                        <div>${restaurant?.phone || ""}</div>
                    </div>
                    
                    <div class="divider"></div>
                    
                    <div>
                        <div class="bold">COMMANDE: ${formatOrderId(order.id)}</div>
                        <div>Date: ${formatDateTime(order.created_at)}</div>
                        <div>Client: ${order.customer_name}</div>
                        <div>Tél: ${order.customer_phone}</div>
                        <div>Type: ${order.delivery_type === "delivery" ? "LIVRAISON" : order.delivery_type === "dine_in" ? "SUR PLACE" : "À EMPORTER"}</div>
                        ${order.delivery_type === "dine_in" && order.table_number ? `<div class="bold">Table: ${order.table_number}</div>` : ""}
                        ${order.covers ? `<div>Couverts: ${order.covers}</div>` : ""}
                        ${order.delivery_type === "delivery" && order.delivery_address ? `<div>Adresse: ${order.delivery_address}</div>` : ""}
                    </div>
                    
                    <div class="divider"></div>
                    
                    <table>
                        ${itemsHtml}
                    </table>
                    
                    <div class="divider"></div>
                    
                    <table>
                        <tr>
                            <td>Sous-total</td>
                            <td style="text-align: right;">${formatCFA(order.subtotal)}</td>
                        </tr>
                        <tr>
                            <td>Livraison</td>
                            <td style="text-align: right;">${formatCFA(order.delivery_fee)}</td>
                        </tr>
                        ${(order.service_fee > 0) ? `<tr><td>Service</td><td style="text-align: right;">${formatCFA(order.service_fee)}</td></tr>` : ""}
                        ${(order.tip_amount > 0) ? `<tr><td>Pourboire</td><td style="text-align: right;">${formatCFA(order.tip_amount)}</td></tr>` : ""}
                        <tr class="bold" style="font-size: 14px;">
                            <td>TOTAL</td>
                            <td style="text-align: right;">${formatCFA(order.total)}</td>
                        </tr>
                    </table>
                    
                    <div class="divider"></div>
                    
                    <div class="text-center footer">
                        <p>Merci de votre confiance !</p>
                        <p>Commandez sur kbouffe.com</p>
                    </div>

                    <script>
                        window.onload = function() {
                            window.print();
                            setTimeout(() => { window.close(); }, 500);
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <Button variant="outline" leftIcon={<Printer size={18} />} onClick={handlePrint}>
            Imprimer Ticket
        </Button>
    );
}
