"use client";

/**
 * ExportReport -- Monthly PDF report download button
 *
 * Generates a PDF with:
 *   - Header: Kbouffe branding + date range
 *   - Section 1: Summary stats
 *   - Section 2: Top 5 products
 *   - Section 3: Top 5 restaurants
 *   - Footer: Generation date + report number
 *
 * Uses jsPDF (no html2canvas dependency for tables -- draws directly).
 */

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Download, Loader2 } from "lucide-react";

interface Order {
    delivery_status: string;
    total_price: number;
    restaurant_id?: string;
    restaurant_name?: string;
    created_at: string;
    expected_delivery_date?: string | null;
    actual_delivery_date?: string | null;
    items?: { product_name?: string; product_id?: string; quantity?: number; unit_price?: number }[];
}

interface ExportReportProps {
    orders: Order[];
    supplierName: string;
    productCount: number;
}

const MONTHS_FR = [
    "Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre",
];

export function ExportReport({ orders, supplierName, productCount }: ExportReportProps) {
    const [exporting, setExporting] = useState(false);

    const handleExport = useCallback(async () => {
        setExporting(true);

        try {
            // Dynamic import for code splitting
            const { jsPDF } = await import("jspdf");

            const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 15;
            const contentWidth = pageWidth - margin * 2;
            let y = margin;

            // Previous month date range
            const now = new Date();
            const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
            const monthName = MONTHS_FR[prevMonth.getMonth()];
            const year = prevMonth.getFullYear();

            // Filter orders for previous month
            const monthOrders = orders.filter((o) => {
                const d = new Date(o.created_at);
                return d >= prevMonth && d <= prevMonthEnd;
            });

            const nonCancelled = monthOrders.filter((o) => o.delivery_status !== "cancelled");
            const cancelled = monthOrders.filter((o) => o.delivery_status === "cancelled");
            const delivered = monthOrders.filter((o) => o.delivery_status === "delivered");
            const totalRevenue = nonCancelled.reduce((acc, o) => acc + (o.total_price ?? 0), 0);

            // On-time delivery
            const withDates = delivered.filter(
                (o) => o.expected_delivery_date && o.actual_delivery_date
            );
            const onTime = withDates.filter(
                (o) => new Date(o.actual_delivery_date!) <= new Date(o.expected_delivery_date!)
            ).length;
            const onTimeRate =
                withDates.length > 0 ? ((onTime / withDates.length) * 100).toFixed(1) : delivered.length > 0 ? "100.0" : "N/A";

            // ── Header ────────────────────────────────────────────────
            doc.setFillColor(249, 115, 22); // brand-500
            doc.rect(0, 0, pageWidth, 28, "F");

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.text("Kbouffe", margin, 12);

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`Rapport mensuel - ${monthName} ${year}`, margin, 19);
            doc.text(supplierName, pageWidth - margin, 12, { align: "right" });
            doc.text(
                `${prevMonth.toLocaleDateString("fr-FR")} - ${prevMonthEnd.toLocaleDateString("fr-FR")}`,
                pageWidth - margin,
                19,
                { align: "right" }
            );

            y = 38;

            // ── Section 1: Resume Stats ───────────────────────────────
            doc.setTextColor(30, 30, 30);
            doc.setFontSize(13);
            doc.setFont("helvetica", "bold");
            doc.text("Resume", margin, y);
            y += 8;

            const statsData = [
                ["Produits actifs", String(productCount)],
                ["Commandes du mois", String(monthOrders.length)],
                ["Revenu total", new Intl.NumberFormat("fr-FR").format(totalRevenue) + " FCFA"],
                ["Commandes annulees", String(cancelled.length)],
                ["Taux livraison a temps", onTimeRate + "%"],
            ];

            doc.setFontSize(9);
            for (const [label, value] of statsData) {
                doc.setFont("helvetica", "normal");
                doc.setTextColor(100, 100, 100);
                doc.text(label, margin, y);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(30, 30, 30);
                doc.text(value, margin + 65, y);
                y += 6;
            }

            y += 6;

            // ── Section 2: Top 5 produits ─────────────────────────────
            doc.setFontSize(13);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(30, 30, 30);
            doc.text("Top 5 Produits", margin, y);
            y += 8;

            // Aggregate products
            const productMap = new Map<string, { name: string; qty: number; revenue: number }>();
            for (const order of nonCancelled) {
                if (!order.items) continue;
                for (const item of order.items) {
                    const key = item.product_id ?? item.product_name ?? "Inconnu";
                    const existing = productMap.get(key);
                    const itemRevenue = (item.unit_price ?? 0) * (item.quantity ?? 1);
                    if (existing) {
                        existing.qty += item.quantity ?? 1;
                        existing.revenue += itemRevenue;
                    } else {
                        productMap.set(key, {
                            name: item.product_name ?? "Produit",
                            qty: item.quantity ?? 1,
                            revenue: itemRevenue,
                        });
                    }
                }
            }

            const topProducts = Array.from(productMap.values())
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5);

            // Table header
            doc.setFillColor(245, 245, 245);
            doc.rect(margin, y - 4, contentWidth, 7, "F");
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(80, 80, 80);
            doc.text("Produit", margin + 2, y);
            doc.text("Qte", margin + 90, y);
            doc.text("Revenu", margin + 110, y);
            y += 7;

            doc.setFont("helvetica", "normal");
            doc.setTextColor(50, 50, 50);

            if (topProducts.length === 0) {
                doc.setTextColor(150, 150, 150);
                doc.text("Aucune donnee produit disponible", margin + 2, y);
                y += 6;
            } else {
                for (const p of topProducts) {
                    const name = p.name.length > 40 ? p.name.slice(0, 37) + "..." : p.name;
                    doc.text(name, margin + 2, y);
                    doc.text(String(p.qty), margin + 90, y);
                    doc.text(new Intl.NumberFormat("fr-FR").format(p.revenue) + " FCFA", margin + 110, y);
                    y += 6;
                }
            }

            y += 6;

            // ── Section 3: Top 5 restaurants ──────────────────────────
            doc.setFontSize(13);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(30, 30, 30);
            doc.text("Top 5 Restaurants", margin, y);
            y += 8;

            // Aggregate restaurants
            const restaurantMap = new Map<string, { name: string; orders: number; revenue: number }>();
            for (const order of nonCancelled) {
                const key = order.restaurant_id ?? order.restaurant_name ?? "Inconnu";
                const existing = restaurantMap.get(key);
                if (existing) {
                    existing.orders += 1;
                    existing.revenue += order.total_price ?? 0;
                } else {
                    restaurantMap.set(key, {
                        name: order.restaurant_name ?? `Restaurant ${key.slice(0, 8)}`,
                        orders: 1,
                        revenue: order.total_price ?? 0,
                    });
                }
            }

            const topRestaurants = Array.from(restaurantMap.values())
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5);

            // Table header
            doc.setFillColor(245, 245, 245);
            doc.rect(margin, y - 4, contentWidth, 7, "F");
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(80, 80, 80);
            doc.text("Restaurant", margin + 2, y);
            doc.text("Commandes", margin + 90, y);
            doc.text("Revenu", margin + 120, y);
            y += 7;

            doc.setFont("helvetica", "normal");
            doc.setTextColor(50, 50, 50);

            if (topRestaurants.length === 0) {
                doc.setTextColor(150, 150, 150);
                doc.text("Aucune donnee restaurant disponible", margin + 2, y);
                y += 6;
            } else {
                for (const r of topRestaurants) {
                    const name = r.name.length > 40 ? r.name.slice(0, 37) + "..." : r.name;
                    doc.text(name, margin + 2, y);
                    doc.text(String(r.orders), margin + 90, y);
                    doc.text(new Intl.NumberFormat("fr-FR").format(r.revenue) + " FCFA", margin + 120, y);
                    y += 6;
                }
            }

            // ── Footer ───────────────────────────────────────────────
            const pageHeight = doc.internal.pageSize.getHeight();
            const footerY = pageHeight - 12;

            doc.setDrawColor(220, 220, 220);
            doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

            doc.setFontSize(7);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(150, 150, 150);

            const reportId = `RPT-${year}${String(prevMonth.getMonth() + 1).padStart(2, "0")}-${Date.now().toString(36).toUpperCase().slice(-6)}`;
            doc.text(
                `Genere le ${new Date().toLocaleDateString("fr-FR")} a ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
                margin,
                footerY
            );
            doc.text(reportId, pageWidth - margin, footerY, { align: "right" });

            doc.text("Kbouffe - Plateforme marketplace alimentaire", pageWidth / 2, footerY + 4, {
                align: "center",
            });

            // Save
            const fileName = `Rapport-${monthName}-${year}.pdf`;
            doc.save(fileName);
        } catch (err) {
            console.error("PDF export error:", err);
        } finally {
            setExporting(false);
        }
    }, [orders, supplierName, productCount]);

    return (
        <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-900 hover:bg-surface-800 border border-white/8 hover:border-white/15 text-surface-300 hover:text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Telecharger le rapport mensuel en PDF"
        >
            {exporting ? (
                <Loader2 size={16} className="animate-spin" />
            ) : (
                <Download size={16} />
            )}
            <span className="hidden sm:inline">Rapport mensuel</span>
            <span className="sm:hidden">PDF</span>
        </motion.button>
    );
}
