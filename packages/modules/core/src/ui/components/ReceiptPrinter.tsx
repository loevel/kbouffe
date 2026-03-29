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
        const isTvaRegistered = !!restaurant?.tva_registered;
        // TVA 19,25% — CGI Art.149 (calcul inversé depuis TTC)
        const subtotalTtc  = order.subtotal || 0;
        const subtotalHt   = isTvaRegistered ? Math.floor(subtotalTtc / 1.1925) : subtotalTtc;
        const tvaAmount    = isTvaRegistered ? subtotalTtc - subtotalHt : 0;

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

        const fiscalHeaderHtml = `
            ${restaurant?.nif  ? `<div>NIF/NIU : ${restaurant.nif}</div>`  : ""}
            ${restaurant?.rccm ? `<div>RCCM : ${restaurant.rccm}</div>`    : ""}
        `;

        const invoiceNumberHtml = order.invoice_number
            ? `<div class="bold">N° Facture : ${order.invoice_number}</div>`
            : "";

        const tvaRowsHtml = isTvaRegistered ? `
            <tr>
                <td>Sous-total HT</td>
                <td style="text-align: right;">${formatCFA(subtotalHt)}</td>
            </tr>
            <tr>
                <td>TVA 19,25% (CGI Art.125)</td>
                <td style="text-align: right;">${formatCFA(tvaAmount)}</td>
            </tr>
            <tr>
                <td>Sous-total TTC</td>
                <td style="text-align: right;">${formatCFA(subtotalTtc)}</td>
            </tr>
        ` : `
            <tr>
                <td>Sous-total</td>
                <td style="text-align: right;">${formatCFA(subtotalTtc)}</td>
            </tr>
        `;

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
                        .fiscal { font-size: 10px; color: #555; }
                    </style>
                </head>
                <body>
                    <div class="text-center">
                        <div class="bold" style="font-size: 16px;">${restaurant?.name || "Kbouffe"}</div>
                        <div>${restaurant?.address || ""}</div>
                        <div>${restaurant?.phone || ""}</div>
                        <div class="fiscal">${fiscalHeaderHtml}</div>
                    </div>
                    
                    <div class="divider"></div>
                    
                    <div>
                        ${invoiceNumberHtml}
                        <div class="bold">COMMANDE: ${formatOrderId(order.id)}</div>
                        <div>Date: ${formatDateTime(order.created_at)}</div>
                        <div>Type: ${order.delivery_type === "delivery" ? "LIVRAISON" : "À EMPORTER"}</div>
                    </div>
                    
                    <div class="divider"></div>
                    
                    <table>
                        ${itemsHtml}
                    </table>
                    
                    <div class="divider"></div>
                    
                    <table>
                        ${tvaRowsHtml}
                        <tr>
                            <td>Livraison</td>
                            <td style="text-align: right;">${formatCFA(order.delivery_fee)}</td>
                        </tr>
                        <tr class="bold" style="font-size: 14px;">
                            <td>TOTAL ${isTvaRegistered ? "TTC" : ""}</td>
                            <td style="text-align: right;">${formatCFA(order.total)}</td>
                        </tr>
                    </table>
                    
                    <div class="divider"></div>
                    
                    <div class="text-center footer">
                        ${isTvaRegistered ? "<p class='fiscal'>Prix incluant TVA 19,25% (CGI Art.125)</p>" : ""}
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
