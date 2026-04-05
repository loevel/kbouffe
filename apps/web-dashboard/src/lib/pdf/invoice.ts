/**
 * PDF invoice generator — browser print-based, no external lib needed.
 * Opens a print-ready window with the order invoice HTML.
 */

interface OrderItem {
    name: string;
    quantity: number;
    unit_price: number;
    total_price?: number;
}

interface InvoiceData {
    orderId: string;
    orderDate: string;
    customerName: string;
    customerPhone?: string;
    restaurantName: string;
    restaurantAddress?: string;
    restaurantPhone?: string;
    items: OrderItem[];
    subtotal: number;
    deliveryFee?: number;
    discount?: number;
    total: number;
    paymentMethod?: string;
    paymentStatus?: string;
}

function formatFCFA(amount: number): string {
    return amount.toLocaleString("fr-FR") + " FCFA";
}

export function printOrderInvoice(data: InvoiceData) {
    const shortId = data.orderId.slice(-8).toUpperCase();
    const date = new Date(data.orderDate).toLocaleDateString("fr-FR", {
        day: "numeric", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });

    const itemsHtml = data.items.map((item) => `
        <tr>
            <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;">${item.name}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;text-align:center;">${item.quantity}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;text-align:right;">${formatFCFA(item.unit_price)}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600;">${formatFCFA(item.total_price ?? item.unit_price * item.quantity)}</td>
        </tr>
    `).join("");

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<title>Facture #${shortId}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; color: #1a1a1a; background: #fff; padding: 32px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #f97316; }
  .logo { font-size: 24px; font-weight: 800; color: #f97316; letter-spacing: -0.5px; }
  .logo span { color: #1a1a1a; }
  .invoice-meta { text-align: right; }
  .invoice-meta h2 { font-size: 20px; font-weight: 700; color: #1a1a1a; }
  .invoice-meta p { color: #666; font-size: 12px; margin-top: 2px; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
  .party h3 { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #999; margin-bottom: 6px; }
  .party p { font-size: 13px; line-height: 1.6; }
  .party .name { font-weight: 700; font-size: 15px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  thead th { background: #f97316; color: white; padding: 8px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
  thead th:first-child { text-align: left; border-radius: 6px 0 0 0; }
  thead th:last-child { border-radius: 0 6px 0 0; }
  .totals { margin-left: auto; width: 280px; }
  .totals tr td { padding: 4px 8px; }
  .totals tr td:first-child { color: #666; }
  .totals tr td:last-child { text-align: right; font-weight: 500; }
  .totals .total-row td { font-size: 16px; font-weight: 800; color: #f97316; border-top: 2px solid #f97316; padding-top: 8px; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 11px; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
  .badge-paid { background: #d1fae5; color: #059669; }
  .badge-pending { background: #fef3c7; color: #d97706; }
  @media print { body { padding: 16px; } button { display: none; } }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="logo">k<span>bouffe</span></div>
    <p style="color:#666;margin-top:4px;font-size:12px;">${data.restaurantName}</p>
    ${data.restaurantAddress ? `<p style="color:#999;font-size:11px;">${data.restaurantAddress}</p>` : ""}
    ${data.restaurantPhone ? `<p style="color:#999;font-size:11px;">${data.restaurantPhone}</p>` : ""}
  </div>
  <div class="invoice-meta">
    <h2>FACTURE #${shortId}</h2>
    <p>${date}</p>
    <p style="margin-top:6px;"><span class="badge ${data.paymentStatus === 'paid' ? 'badge-paid' : 'badge-pending'}">${data.paymentStatus === 'paid' ? '✓ Payé' : 'En attente'}</span></p>
  </div>
</div>

<div class="parties">
  <div class="party">
    <h3>Facturer à</h3>
    <p class="name">${data.customerName}</p>
    ${data.customerPhone ? `<p>${data.customerPhone}</p>` : ""}
  </div>
  <div class="party">
    <h3>Méthode de paiement</h3>
    <p>${data.paymentMethod ?? "Mobile Money"}</p>
  </div>
</div>

<table>
  <thead>
    <tr>
      <th style="text-align:left">Article</th>
      <th style="text-align:center">Qté</th>
      <th style="text-align:right">Prix unitaire</th>
      <th style="text-align:right">Total</th>
    </tr>
  </thead>
  <tbody>${itemsHtml}</tbody>
</table>

<table class="totals">
  <tbody>
    <tr><td>Sous-total</td><td>${formatFCFA(data.subtotal)}</td></tr>
    ${data.deliveryFee ? `<tr><td>Frais de livraison</td><td>${formatFCFA(data.deliveryFee)}</td></tr>` : ""}
    ${data.discount ? `<tr><td>Réduction</td><td>-${formatFCFA(data.discount)}</td></tr>` : ""}
    <tr class="total-row"><td>Total TTC</td><td>${formatFCFA(data.total)}</td></tr>
  </tbody>
</table>

<div class="footer">
  <p>Merci de votre confiance ! — kbouffe.com</p>
  <p style="margin-top:4px;">Ce document tient lieu de reçu. Conservez-le pour vos archives.</p>
</div>

<script>window.onload = () => window.print();</script>
</body>
</html>`;

    const win = window.open("", "_blank", "width=800,height=900");
    if (win) {
        win.document.write(html);
        win.document.close();
    }
}

/** Button component to trigger invoice print */
export function PrintInvoiceButton({ order, restaurant }: { order: any; restaurant: any }) {
    function handlePrint() {
        printOrderInvoice({
            orderId: order.id,
            orderDate: order.created_at,
            customerName: order.customer_name ?? "Client",
            customerPhone: order.customer_phone,
            restaurantName: restaurant?.name ?? "Restaurant",
            restaurantAddress: restaurant?.city,
            restaurantPhone: restaurant?.phone,
            items: (order.order_items ?? []).map((item: any) => ({
                name: item.product_name ?? item.name ?? "Article",
                quantity: item.quantity,
                unit_price: item.unit_price ?? item.price,
                total_price: item.total_price,
            })),
            subtotal: order.subtotal ?? order.total,
            deliveryFee: order.delivery_fee,
            discount: order.discount_amount,
            total: order.total,
            paymentMethod: order.payment_method,
            paymentStatus: order.payment_status,
        });
    }

    return handlePrint;
}
