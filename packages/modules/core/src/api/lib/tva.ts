/**
 * Utilitaires TVA — Cameroun
 *
 * TVA applicable au Cameroun (CGI) :
 *   - Taux standard : 19,25 %  (TVA 17,5 % + CAC 1,75 %)
 *   - Exonérés (CGI Art.131) : produits agricoles bruts, médicaments, eau, etc.
 *
 * KBouffe applique la TVA sur TOUS ses revenus de services SaaS :
 *   - Abonnements restaurant
 *   - Packs marketplace
 *   - Frais de plateforme fournisseur
 *   - Commission Capital (apporteur d'affaires)
 *
 * Les marchandises vendues DIRECTEMENT entre fournisseur et restaurant
 * transitent hors KBouffe (facture directe) — la TVA agricole ne concerne
 * donc pas KBouffe sur ce flux.
 */

// ── Constantes ────────────────────────────────────────────────────────────

/** Taux TVA standard Cameroun en points de base (10 000 = 100%). */
export const TVA_RATE_BPS = 1925; // 19.25%

/** Taux TVA standard Cameroun sous forme de fraction (0.1925). */
export const TVA_RATE = TVA_RATE_BPS / 10000;

/** Label affiché sur les factures. */
export const TVA_LABEL = "TVA 19,25% (CGI Art.125)";

/** Taux exonéré — utilisé pour les produits agricoles (CGI Art.131). */
export const TVA_RATE_EXEMPT = 0;

/** Devise KBouffe. */
export const CURRENCY = "XAF";

// ── Types ─────────────────────────────────────────────────────────────────

export interface TvaBreakdown {
  /** Montant hors taxes, en FCFA (entier). */
  amount_ht: number;
  /** Taux TVA utilisé (0.1925 ou 0). */
  tva_rate: number;
  /** Taux en points de base (1925 ou 0). */
  tva_rate_bps: number;
  /** Montant TVA, en FCFA (entier, arrondi au FCFA supérieur). */
  tva_amount: number;
  /** Montant TTC = HT + TVA, en FCFA (entier). */
  amount_ttc: number;
  /** true si exonéré de TVA. */
  is_exempt: boolean;
}

export interface InvoiceLineItem {
  label: string;
  quantity: number;
  unit_price_ht: number;
  tva_rate: number;
  total_ht: number;
  total_tva: number;
  total_ttc: number;
}

export type InvoiceType =
  | "subscription"
  | "pack_marketplace"
  | "listing_fee"
  | "capital_commission"
  | "placement_fee"
  | "other";

export interface PlatformInvoiceInput {
  restaurant_id: string;
  invoice_type: InvoiceType;
  reference_type?: string;
  reference_id?: string;
  period_start?: string;
  period_end?: string;
  description: string;
  amount_ht: number;
  /** Défaut : TVA_RATE_BPS (19,25%). Passer 0 si exonéré. */
  tva_rate_bps?: number;
  line_items?: InvoiceLineItem[];
  kbouffe_niu?: string;
  kbouffe_rccm?: string;
  restaurant_niu?: string;
  restaurant_rccm?: string;
  restaurant_name?: string;
  restaurant_address?: string;
}

// ── Calculs ───────────────────────────────────────────────────────────────

/**
 * Calcule la décomposition TVA à partir du montant HT.
 *
 * @param amount_ht   Montant hors taxes en FCFA (entier).
 * @param exempt      true pour exonérer (produits agricoles, etc.).
 */
export function computeTva(amount_ht: number, exempt = false): TvaBreakdown {
  if (amount_ht < 0) throw new RangeError("amount_ht doit être positif");

  const rate = exempt ? 0 : TVA_RATE;
  const rate_bps = exempt ? 0 : TVA_RATE_BPS;
  const tva_amount = Math.ceil(amount_ht * rate);  // arrondi au FCFA supérieur
  const amount_ttc = amount_ht + tva_amount;

  return { amount_ht, tva_rate: rate, tva_rate_bps: rate_bps, tva_amount, amount_ttc, is_exempt: exempt };
}

/**
 * Décompose un montant TTC en HT + TVA (méthode division).
 * Utile quand le prix affiché inclut déjà la TVA.
 */
export function parseTvaFromTtc(amount_ttc: number, exempt = false): TvaBreakdown {
  if (amount_ttc < 0) throw new RangeError("amount_ttc doit être positif");

  if (exempt) {
    return { amount_ht: amount_ttc, tva_rate: 0, tva_rate_bps: 0, tva_amount: 0, amount_ttc, is_exempt: true };
  }

  const amount_ht = Math.floor(amount_ttc / (1 + TVA_RATE));
  const tva_amount = amount_ttc - amount_ht;

  return { amount_ht, tva_rate: TVA_RATE, tva_rate_bps: TVA_RATE_BPS, tva_amount, amount_ttc, is_exempt: false };
}

/**
 * Formate un montant FCFA pour affichage (ex: "11 806 FCFA").
 */
export function formatFcfa(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(amount) + " FCFA";
}

/**
 * Formate un taux TVA pour affichage (ex: "19,25 %").
 */
export function formatTvaRate(rate: number): string {
  return (rate * 100).toFixed(2).replace(".", ",") + " %";
}

/**
 * Génère les lignes de résumé fiscal pour une facture (affichage ou PDF).
 */
export function buildInvoiceSummary(breakdown: TvaBreakdown): Array<{ label: string; amount: string }> {
  const lines = [
    { label: "Sous-total HT", amount: formatFcfa(breakdown.amount_ht) },
  ];

  if (breakdown.is_exempt) {
    lines.push({ label: "TVA (exonéré — CGI Art.131)", amount: formatFcfa(0) });
  } else {
    lines.push({ label: TVA_LABEL, amount: formatFcfa(breakdown.tva_amount) });
  }

  lines.push({ label: "TOTAL TTC", amount: formatFcfa(breakdown.amount_ttc) });
  return lines;
}

/**
 * Calcule les totaux agrégés pour la déclaration TVA trimestrielle DGI.
 *
 * @param invoices  Liste des factures de la période (status = 'issued' | 'paid').
 */
export function computeTvaDeclaration(
  invoices: Array<{ amount_ht: number; tva_amount: number; amount_ttc: number }>
) {
  return invoices.reduce(
    (acc, inv) => ({
      total_ht:  acc.total_ht  + inv.amount_ht,
      total_tva: acc.total_tva + inv.tva_amount,
      total_ttc: acc.total_ttc + inv.amount_ttc,
      invoice_count: acc.invoice_count + 1,
    }),
    { total_ht: 0, total_tva: 0, total_ttc: 0, invoice_count: 0 }
  );
}

// ── Catalogue des taux par type de prestation ─────────────────────────────

/** Retourne si une prestation KBouffe est soumise à TVA. */
export function isTaxableService(type: InvoiceType): boolean {
  // Tous les services KBouffe sont taxables à 19,25%.
  // Les produits agricoles ne transitent PAS par ces factures.
  return true;
}

/**
 * Taux TVA par type de prestation.
 * Centralise la logique — permet une extension future (taux réduits, etc.)
 */
export const TVA_RATES_BY_SERVICE: Record<InvoiceType, number> = {
  subscription:        TVA_RATE_BPS,  // Abonnement SaaS → 19,25%
  pack_marketplace:    TVA_RATE_BPS,  // Pack pub/visibilité → 19,25%
  listing_fee:         TVA_RATE_BPS,  // Référencement fournisseur → 19,25%
  capital_commission:  TVA_RATE_BPS,  // Commission technologique → 19,25%
  placement_fee:       TVA_RATE_BPS,  // Mise en avant → 19,25%
  other:               TVA_RATE_BPS,
};
