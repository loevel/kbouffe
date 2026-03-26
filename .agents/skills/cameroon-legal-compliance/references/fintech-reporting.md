# Obligations Comptables et Fiscales — Cadre Juridique Camerounais (SYSCOHADA / DGI)

## Résumé

Toute entreprise exerçant au Cameroun — y compris les plateformes de commerce électronique comme KBouffe — est soumise au **Système Comptable OHADA (SYSCOHADA)** révisé, entré en vigueur le 1er janvier 2018 pour les comptes personnels. Le SYSCOHADA impose la tenue d'une comptabilité régulière selon le **Plan Comptable OHADA**, la production d'états financiers annuels, et le dépôt de la **DSF (Déclaration Statistique et Fiscale)** auprès de la **DGI (Direction Générale des Impôts)**. En complément, le Cameroun a rendu obligatoire la **facture normalisée** depuis 2018 pour toutes les transactions commerciales. Pour une plateforme qui collecte des paiements Mobile Money et reverse aux restaurateurs, des obligations spécifiques s'appliquent en matière de **traçabilité des flux financiers**, de **TVA** (19,25% au Cameroun), et de **déclarations mensuelles**. Le non-respect de ces obligations constitue une infraction fiscale pouvant entraîner des **pénalités de 30% à 100%** du montant éludé, voire des poursuites pénales pour fraude fiscale.

---

## Textes de Loi Applicables

### 1. Acte Uniforme OHADA relatif au Droit Comptable et à l'Information Financière (AUDCIF)

- **Article 1** : Toute entreprise soumise au droit d'un État-partie OHADA est tenue de mettre en place une comptabilité conforme à l'Acte Uniforme.
- **Article 2** : La comptabilité doit être tenue en langue française (ou anglaise au Cameroun), en francs CFA (XAF), et selon la méthode en partie double.
- **Article 8** : Tout enregistrement comptable doit être appuyé par une pièce justificative datée et conservée pendant **10 ans**.
- **Article 11** : Les états financiers annuels comprennent le bilan, le compte de résultat, le tableau des flux de trésorerie, les notes annexes.
- **Article 13** : Le Plan Comptable OHADA définit la nomenclature des comptes à utiliser.

### 2. Code Général des Impôts du Cameroun (CGI)

- **Article 18** : Obligation de déclaration annuelle des résultats (DSF) avant le 15 mars de l'exercice suivant.
- **Article 127 ter** : Institution de la TVA au taux de **19,25%** (dont 17,5% TVA + 1,75% de centimes additionnels communaux).
- **Article 128** : TVA sur les prestations de services électroniques — les plateformes numériques sont assujetties.
- **Article 137** : Obligations de facturation — toute vente ou prestation doit donner lieu à une facture.
- **Article R-8** : Déclaration mensuelle de TVA (au plus tard le 15 du mois suivant).
- **Article L-96** : Sanctions pour défaut de déclaration — majoration de 10% par mois de retard, plafonnée à 30%.
- **Article L-100** : Fraude fiscale — amende de 100% du montant éludé + poursuites pénales.

### 3. Loi de Finances 2018 — Factures normalisées

- **Article 8 bis, LF 2018** : Obligation pour tout contribuable d'émettre des **factures normalisées** conformes au modèle défini par l'administration fiscale.
- La facture normalisée doit contenir : NIF, RCCM, numéro séquentiel, date, désignation des produits/services, prix unitaire HT, montant TVA, total TTC, coordonnées du vendeur.
- Depuis 2018, les factures non normalisées ne sont pas déductibles fiscalement.

### 4. Réglementation BEAC / COBAC sur les services de paiement

- Les plateformes qui collectent et redistribuent des fonds via Mobile Money doivent se conformer aux règles de la **COBAC** (Commission Bancaire de l'Afrique Centrale).
- Obligation de **réconciliation quotidienne** des fonds collectés.
- Interdiction de conserver des fonds clients au-delà du délai de reversement convenu.

### 5. SYSCOHADA révisé — Plan Comptable applicable

Classes de comptes pertinentes pour KBouffe :

| Classe | Intitulé | Exemples KBouffe |
|---|---|---|
| 4 | Tiers | 401 Fournisseurs (restaurateurs), 411 Clients, 431 État-TVA |
| 5 | Trésorerie | 521 Mobile Money MTN, 522 Orange Money |
| 6 | Charges | 601 Achats, 616 Frais de paiement, 622 Commissions |
| 7 | Produits | 706 Prestations de services (commissions), 707 Frais de livraison |

---

## Obligations pour la Plateforme

| Obligation | Détail | Base légale |
|---|---|---|
| **Comptabilité SYSCOHADA** | Tenue d'une comptabilité en partie double selon le Plan Comptable OHADA | AUDCIF Art. 1-2 |
| **Conservation des pièces** | Toute pièce justificative conservée 10 ans minimum | AUDCIF Art. 8 |
| **DSF annuelle** | Déclaration Statistique et Fiscale à déposer avant le 15 mars | CGI Art. 18 |
| **Déclaration TVA mensuelle** | Déclaration et paiement de la TVA avant le 15 de chaque mois | CGI Art. R-8 |
| **Factures normalisées** | Émission obligatoire pour toute transaction commerciale | LF 2018 Art. 8 bis |
| **NIF et RCCM** | Numéro d'Identification Fiscale et inscription au RCCM obligatoires | CGI |
| **Réconciliation des paiements** | Rapprochement quotidien des encaissements MoMo avec les commandes | COBAC / bonne pratique |
| **TVA sur commissions** | Collecte de la TVA (19,25%) sur les frais de service de la plateforme | CGI Art. 128 |
| **Traçabilité des flux** | Chaque mouvement de fonds doit être tracé avec pièce justificative | AUDCIF Art. 8 |
| **États financiers annuels** | Bilan, compte de résultat, flux de trésorerie, notes annexes | AUDCIF Art. 11 |

---

## ❌ Exemple Non-Conforme

### API de rapports financiers actuelle (stub / données fictives)

```typescript
// ❌ L'API de reporting retourne des données stub
// ❌ Pas de ventilation par compte OHADA
// ❌ Pas de calcul de TVA
// ❌ Pas de génération de factures normalisées
// ❌ Pas de réconciliation paiements

reportsRoutes.get("/financial-summary", async (c) => {
  // ❌ Données en dur — aucune connexion aux écritures comptables réelles
  return c.json({
    success: true,
    summary: {
      total_revenue: 0,     // ❌ Stub
      total_expenses: 0,    // ❌ Stub
      net_profit: 0,        // ❌ Stub
      period: "2024-01",
    },
  });
});
```

### Paiement sans écriture comptable

```typescript
// ❌ L'enregistrement du payout ne génère pas d'écritures au grand livre
payoutsRoutes.post("/staff", async (c) => {
  const body = await c.req.json();
  const { memberId, amount, notes, paymentMethod } = body;

  // ❌ Enregistrement direct sans écriture comptable correspondante
  // ❌ Pas de facture normalisée générée
  // ❌ Pas de décomposition TVA
  const { data, error } = await c.var.supabase
    .from("staff_payouts")
    .insert({
      restaurant_id: c.var.restaurantId,
      member_id: memberId,
      amount,
      notes,
      payment_method: paymentMethod || "momo",
      status: "paid",
      paid_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ success: true, payout: data });
});
```

### Ledger sans conformité SYSCOHADA

```typescript
// ❌ Les écritures du ledger n'utilisent pas le Plan Comptable OHADA
// ❌ Pas de numéro de compte, pas de journal, pas de pièce justificative
// ❌ Pas de mention de TVA dans les écritures
const { data, error } = await admin.from("ledger_entries").insert({
  restaurant_id: restaurantId,
  order_id: orderId,
  payment_transaction_id: txId,
  entry_type: "cash_in",   // ❌ Pas un compte OHADA
  direction: "credit",
  amount: orderTotal,
  currency: "XAF",
  description: "Paiement reçu",
  // ❌ Manquant : account_code, journal, vat_amount, invoice_number
});
```

**Violations identifiées :**
1. Le rapport financier retourne des stubs (aucune donnée comptable réelle)
2. Les écritures du ledger n'utilisent pas le Plan Comptable OHADA
3. Aucune facture normalisée n'est générée
4. Pas de calcul ni déclaration de TVA
5. Pas de réconciliation entre paiements MoMo et commandes
6. Pas de conservation des pièces justificatives numériques
7. Pas de numéro séquentiel de facture

---

## ✅ Exemple Conforme

### 1. Migration SQL — Plan Comptable et Factures Normalisées

```sql
-- Migration: add_syscohada_accounting
-- Conforme à l'AUDCIF (OHADA) et au CGI du Cameroun

-- Plan comptable OHADA (comptes utilisés par KBouffe)
CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
    code            TEXT PRIMARY KEY,
    label           TEXT NOT NULL,
    class           INTEGER NOT NULL CHECK (class BETWEEN 1 AND 9),
    type            TEXT NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Comptes essentiels SYSCOHADA pour KBouffe
INSERT INTO public.chart_of_accounts (code, label, class, type) VALUES
    ('4011', 'Fournisseurs — Restaurateurs', 4, 'liability'),
    ('4012', 'Fournisseurs — Livreurs', 4, 'liability'),
    ('4110', 'Clients', 4, 'asset'),
    ('4312', 'TVA collectée', 4, 'liability'),
    ('4314', 'TVA déductible sur services', 4, 'asset'),
    ('5211', 'Mobile Money MTN — Collecte', 5, 'asset'),
    ('5212', 'Mobile Money MTN — Décaissement', 5, 'asset'),
    ('5220', 'Orange Money', 5, 'asset'),
    ('6160', 'Frais de paiement PSP (MTN/Orange)', 6, 'expense'),
    ('6220', 'Commissions reversées', 6, 'expense'),
    ('7060', 'Produits — Commissions plateforme', 7, 'revenue'),
    ('7061', 'Produits — Frais de service', 7, 'revenue'),
    ('7062', 'Produits — Frais de livraison', 7, 'revenue')
ON CONFLICT (code) DO NOTHING;

-- Enrichir le ledger pour conformité SYSCOHADA
ALTER TABLE public.ledger_entries
    ADD COLUMN IF NOT EXISTS account_code TEXT REFERENCES public.chart_of_accounts(code),
    ADD COLUMN IF NOT EXISTS journal TEXT NOT NULL DEFAULT 'OD'
        CHECK (journal IN ('VE', 'AC', 'TR', 'OD', 'AN')),
        -- VE=Ventes, AC=Achats, TR=Trésorerie, OD=Opérations Diverses, AN=À-nouveau
    ADD COLUMN IF NOT EXISTS piece_number TEXT,
    ADD COLUMN IF NOT EXISTS vat_amount INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS vat_rate NUMERIC(5,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS fiscal_year TEXT,
    ADD COLUMN IF NOT EXISTS period TEXT;

CREATE INDEX IF NOT EXISTS idx_ledger_account_code ON public.ledger_entries(account_code);
CREATE INDEX IF NOT EXISTS idx_ledger_journal ON public.ledger_entries(journal);
CREATE INDEX IF NOT EXISTS idx_ledger_fiscal_year ON public.ledger_entries(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_ledger_period ON public.ledger_entries(period);

-- Factures normalisées (LF 2018, Art. 8 bis)
CREATE TABLE IF NOT EXISTS public.invoices (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number      TEXT NOT NULL UNIQUE,
    restaurant_id       UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    order_id            UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    customer_id         UUID REFERENCES public.users(id) ON DELETE SET NULL,
    customer_name       TEXT NOT NULL,
    customer_phone      TEXT,

    -- Identification vendeur (obligatoire facture normalisée)
    seller_name         TEXT NOT NULL,
    seller_nif          TEXT NOT NULL,
    seller_rccm         TEXT,
    seller_address      TEXT,
    seller_phone        TEXT,

    -- Détail des lignes
    items               JSONB NOT NULL,

    -- Montants
    subtotal_ht         INTEGER NOT NULL,
    vat_rate            NUMERIC(5,2) NOT NULL DEFAULT 19.25,
    vat_amount          INTEGER NOT NULL,
    total_ttc           INTEGER NOT NULL,
    delivery_fee        INTEGER NOT NULL DEFAULT 0,
    service_fee         INTEGER NOT NULL DEFAULT 0,
    discount_amount     INTEGER NOT NULL DEFAULT 0,
    grand_total_ttc     INTEGER NOT NULL,

    currency            TEXT NOT NULL DEFAULT 'XAF',
    payment_method      TEXT,
    payment_reference   TEXT,

    status              TEXT NOT NULL DEFAULT 'issued' CHECK (status IN (
                            'draft', 'issued', 'paid', 'cancelled', 'credit_note'
                        )),

    issued_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    paid_at             TIMESTAMPTZ,
    cancelled_at        TIMESTAMPTZ,
    cancellation_reason TEXT,

    fiscal_year         TEXT NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoices_restaurant ON public.invoices(restaurant_id);
CREATE INDEX idx_invoices_order ON public.invoices(order_id);
CREATE INDEX idx_invoices_number ON public.invoices(invoice_number);
CREATE INDEX idx_invoices_fiscal_year ON public.invoices(fiscal_year);
CREATE INDEX idx_invoices_issued_at ON public.invoices(issued_at DESC);

-- Séquence pour numérotation automatique des factures
CREATE SEQUENCE IF NOT EXISTS invoice_seq START WITH 1 INCREMENT BY 1;

-- Déclarations TVA mensuelles
CREATE TABLE IF NOT EXISTS public.vat_declarations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period              TEXT NOT NULL,
    fiscal_year         TEXT NOT NULL,
    vat_collected       INTEGER NOT NULL DEFAULT 0,
    vat_deductible      INTEGER NOT NULL DEFAULT 0,
    vat_due             INTEGER NOT NULL DEFAULT 0,
    total_revenue_ht    INTEGER NOT NULL DEFAULT 0,
    status              TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
                            'draft', 'submitted', 'paid'
                        )),
    submitted_at        TIMESTAMPTZ,
    paid_at             TIMESTAMPTZ,
    reference           TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_vat_declaration_period UNIQUE (period, fiscal_year)
);

-- Réconciliation quotidienne des paiements
CREATE TABLE IF NOT EXISTS public.payment_reconciliations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reconciliation_date DATE NOT NULL,
    provider            TEXT NOT NULL DEFAULT 'mtn_momo',
    total_collected     INTEGER NOT NULL DEFAULT 0,
    total_orders        INTEGER NOT NULL DEFAULT 0,
    total_reversed      INTEGER NOT NULL DEFAULT 0,
    discrepancy         INTEGER NOT NULL DEFAULT 0,
    status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
                            'pending', 'matched', 'discrepancy', 'resolved'
                        )),
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_reconciliation_date_provider UNIQUE (reconciliation_date, provider)
);
```

### 2. Service de facturation normalisée (`packages/modules/orders/src/api/invoices.ts`)

```typescript
import { Hono } from "hono";

const invoiceRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

const VAT_RATE = 19.25; // TVA Cameroun: 17,5% + 1,75% CAC

interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price_ht: number;
  total_ht: number;
  vat_amount: number;
  total_ttc: number;
}

/** Génère un numéro de facture normalisé séquentiel (LF 2018) */
async function generateInvoiceNumber(
  supabase: SupabaseClient,
  fiscalYear: string,
): Promise<string> {
  const { data } = await supabase.rpc("nextval_invoice_seq");
  const seq = String(data).padStart(6, "0");
  // Format : KB-{ANNÉE}-{SÉQUENTIEL} (ex : KB-2025-000042)
  return `KB-${fiscalYear}-${seq}`;
}

/** Calcule la décomposition HT/TVA/TTC conforme */
function computeVatBreakdown(amountTtc: number): {
  amount_ht: number;
  vat_amount: number;
  amount_ttc: number;
} {
  // Prix TTC → HT : HT = TTC / (1 + taux TVA)
  const amount_ht = Math.round(amountTtc / (1 + VAT_RATE / 100));
  const vat_amount = amountTtc - amount_ht;
  return { amount_ht, vat_amount, amount_ttc: amountTtc };
}

// ✅ Génération de facture normalisée à la confirmation de paiement
invoiceRoutes.post("/generate", async (c) => {
  const supabase = c.var.supabase;
  const restaurantId = c.var.restaurantId;
  const { orderId } = await c.req.json<{ orderId: string }>();

  // Récupérer la commande et le restaurant
  const [orderResult, restaurantResult] = await Promise.all([
    supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("restaurant_id", restaurantId)
      .single(),
    supabase
      .from("restaurants")
      .select("name, nif, rccm, address, phone")
      .eq("id", restaurantId)
      .single(),
  ]);

  if (orderResult.error || !orderResult.data) {
    return c.json({ error: "Commande introuvable" }, 404);
  }
  if (restaurantResult.error || !restaurantResult.data) {
    return c.json({ error: "Restaurant introuvable" }, 404);
  }

  const order = orderResult.data;
  const restaurant = restaurantResult.data;

  // ✅ Vérifier que le restaurant a un NIF (obligatoire pour facturation)
  if (!restaurant.nif) {
    return c.json({
      error: "NIF du restaurant manquant. Impossible de générer une facture normalisée.",
    }, 400);
  }

  const now = new Date();
  const fiscalYear = String(now.getFullYear());
  const period = `${fiscalYear}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // ✅ Numéro de facture séquentiel (obligation LF 2018)
  const invoiceNumber = await generateInvoiceNumber(supabase, fiscalYear);

  // ✅ Décomposition HT / TVA / TTC pour chaque ligne
  const orderItems = (order.items as any[]) ?? [];
  const invoiceItems: InvoiceLineItem[] = orderItems.map((item) => {
    const lineTtc = item.line_total_ttc ?? item.unit_price_ttc * item.quantity;
    const { amount_ht, vat_amount } = computeVatBreakdown(lineTtc);
    return {
      description: item.name,
      quantity: item.quantity,
      unit_price_ht: Math.round(amount_ht / item.quantity),
      total_ht: amount_ht,
      vat_amount,
      total_ttc: lineTtc,
    };
  });

  const subtotalTtc = invoiceItems.reduce((sum, i) => sum + i.total_ttc, 0);
  const subtotalHt = invoiceItems.reduce((sum, i) => sum + i.total_ht, 0);
  const totalVat = invoiceItems.reduce((sum, i) => sum + i.vat_amount, 0);

  const deliveryFee = order.delivery_fee ?? 0;
  const serviceFee = order.service_fee ?? 0;
  const grandTotalTtc = subtotalTtc + deliveryFee + serviceFee;

  // ✅ Insertion de la facture normalisée
  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      invoice_number: invoiceNumber,
      restaurant_id: restaurantId,
      order_id: orderId,
      customer_id: order.customer_id,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,

      // ✅ Identification vendeur (facture normalisée)
      seller_name: restaurant.name,
      seller_nif: restaurant.nif,
      seller_rccm: restaurant.rccm,
      seller_address: restaurant.address,
      seller_phone: restaurant.phone,

      items: invoiceItems,
      subtotal_ht: subtotalHt,
      vat_rate: VAT_RATE,
      vat_amount: totalVat,
      total_ttc: subtotalTtc,
      delivery_fee: deliveryFee,
      service_fee: serviceFee,
      discount_amount: 0,
      grand_total_ttc: grandTotalTtc,

      currency: "XAF",
      payment_method: order.payment_method,
      status: order.payment_status === "paid" ? "paid" : "issued",
      paid_at: order.payment_status === "paid" ? new Date().toISOString() : null,
      fiscal_year: fiscalYear,
    })
    .select()
    .single();

  if (error) {
    console.error("Invoice generation error:", error);
    return c.json({ error: "Erreur lors de la génération de la facture" }, 500);
  }

  return c.json({ success: true, invoice });
});

export { invoiceRoutes };
```

### 3. Écritures comptables SYSCOHADA (`packages/modules/orders/src/api/accounting.ts`)

```typescript
import { Hono } from "hono";
import type { SupabaseClient } from "@supabase/supabase-js";

const VAT_RATE = 19.25;
const PLATFORM_FEE_PERCENT = 0; // Modèle abonnement, pas de commission

interface AccountingEntry {
  restaurant_id: string;
  order_id: string;
  payment_transaction_id?: string;
  account_code: string;
  entry_type: string;
  direction: "debit" | "credit";
  amount: number;
  vat_amount: number;
  vat_rate: number;
  journal: string;
  piece_number: string;
  fiscal_year: string;
  period: string;
  description: string;
  currency: string;
}

/**
 * Enregistre les écritures comptables SYSCOHADA pour un paiement reçu.
 * Respecte le principe de la partie double (total débit = total crédit).
 */
async function recordPaymentAccounting(
  supabase: SupabaseClient,
  params: {
    restaurantId: string;
    orderId: string;
    txId: string;
    totalTtc: number;
    pspFee: number;
    invoiceNumber: string;
  },
): Promise<void> {
  const now = new Date();
  const fiscalYear = String(now.getFullYear());
  const period = `${fiscalYear}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const { amount_ht: revenueHt, vat_amount: vatAmount } = computeVatBreakdown(params.totalTtc);

  const entries: Omit<AccountingEntry, "currency">[] = [
    // ✅ Débit : Trésorerie Mobile Money (le cash entre)
    {
      restaurant_id: params.restaurantId,
      order_id: params.orderId,
      payment_transaction_id: params.txId,
      account_code: "5211",     // Mobile Money MTN — Collecte
      entry_type: "cash_in",
      direction: "debit",
      amount: params.totalTtc,
      vat_amount: 0,
      vat_rate: 0,
      journal: "TR",            // Journal de Trésorerie
      piece_number: params.invoiceNumber,
      fiscal_year: fiscalYear,
      period,
      description: `Encaissement commande ${params.orderId.slice(0, 8)}`,
    },
    // ✅ Crédit : Chiffre d'affaires HT (revenu reconnu)
    {
      restaurant_id: params.restaurantId,
      order_id: params.orderId,
      payment_transaction_id: params.txId,
      account_code: "7060",     // Produits — Commissions plateforme
      entry_type: "platform_fee",
      direction: "credit",
      amount: revenueHt,
      vat_amount: 0,
      vat_rate: 0,
      journal: "VE",            // Journal des Ventes
      piece_number: params.invoiceNumber,
      fiscal_year: fiscalYear,
      period,
      description: `Revenu commande ${params.orderId.slice(0, 8)} (HT)`,
    },
    // ✅ Crédit : TVA collectée
    {
      restaurant_id: params.restaurantId,
      order_id: params.orderId,
      payment_transaction_id: params.txId,
      account_code: "4312",     // TVA collectée
      entry_type: "cash_in",
      direction: "credit",
      amount: vatAmount,
      vat_amount: vatAmount,
      vat_rate: VAT_RATE,
      journal: "VE",
      piece_number: params.invoiceNumber,
      fiscal_year: fiscalYear,
      period,
      description: `TVA collectée commande ${params.orderId.slice(0, 8)}`,
    },
    // ✅ Débit : Frais PSP (charge — commission MTN MoMo)
    {
      restaurant_id: params.restaurantId,
      order_id: params.orderId,
      payment_transaction_id: params.txId,
      account_code: "6160",     // Frais de paiement PSP
      entry_type: "psp_fee",
      direction: "debit",
      amount: params.pspFee,
      vat_amount: 0,
      vat_rate: 0,
      journal: "AC",            // Journal des Achats
      piece_number: params.invoiceNumber,
      fiscal_year: fiscalYear,
      period,
      description: `Commission MTN MoMo commande ${params.orderId.slice(0, 8)}`,
    },
    // ✅ Crédit : Trésorerie (la commission est prélevée)
    {
      restaurant_id: params.restaurantId,
      order_id: params.orderId,
      payment_transaction_id: params.txId,
      account_code: "5211",
      entry_type: "psp_fee",
      direction: "credit",
      amount: params.pspFee,
      vat_amount: 0,
      vat_rate: 0,
      journal: "TR",
      piece_number: params.invoiceNumber,
      fiscal_year: fiscalYear,
      period,
      description: `Prélèvement commission MTN MoMo`,
    },
  ];

  const { error } = await supabase.from("ledger_entries").insert(
    entries.map((e) => ({ ...e, currency: "XAF" })),
  );

  if (error) {
    console.error("[Accounting] Failed to record entries:", error);
    throw new Error("Erreur d'enregistrement comptable");
  }
}

function computeVatBreakdown(amountTtc: number) {
  const amount_ht = Math.round(amountTtc / (1 + VAT_RATE / 100));
  return { amount_ht, vat_amount: amountTtc - amount_ht };
}

// ── Routes de reporting financier conformes ──────────────────────

const accountingRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ✅ Rapport mensuel TVA (préparation déclaration DGI)
accountingRoutes.get("/vat-report/:period", async (c) => {
  const supabase = c.var.supabase;
  const restaurantId = c.var.restaurantId;
  const period = c.req.param("period"); // Format: 2025-01

  // ✅ Calculer la TVA collectée sur la période
  const { data: vatCollected } = await supabase
    .from("ledger_entries")
    .select("amount")
    .eq("restaurant_id", restaurantId)
    .eq("account_code", "4312")     // TVA collectée
    .eq("period", period);

  // ✅ Calculer la TVA déductible sur la période
  const { data: vatDeductible } = await supabase
    .from("ledger_entries")
    .select("amount")
    .eq("restaurant_id", restaurantId)
    .eq("account_code", "4314")     // TVA déductible
    .eq("period", period);

  const totalCollected = vatCollected?.reduce((sum, e) => sum + e.amount, 0) ?? 0;
  const totalDeductible = vatDeductible?.reduce((sum, e) => sum + e.amount, 0) ?? 0;
  const vatDue = totalCollected - totalDeductible;

  // ✅ Calculer le CA HT
  const { data: revenueEntries } = await supabase
    .from("ledger_entries")
    .select("amount")
    .eq("restaurant_id", restaurantId)
    .like("account_code", "706%")   // Classe 706x — Produits
    .eq("direction", "credit")
    .eq("period", period);

  const totalRevenueHt = revenueEntries?.reduce((sum, e) => sum + e.amount, 0) ?? 0;

  return c.json({
    success: true,
    vat_report: {
      period,
      vat_rate: VAT_RATE,
      vat_collected: totalCollected,
      vat_deductible: totalDeductible,
      vat_due: vatDue,
      total_revenue_ht: totalRevenueHt,
      currency: "XAF",
      declaration_deadline: `${period}-15`,
      note: "Déclaration mensuelle TVA à déposer avant le 15 du mois suivant (CGI Art. R-8)",
    },
  });
});

// ✅ Rapport de réconciliation des paiements
accountingRoutes.get("/reconciliation/:date", async (c) => {
  const supabase = c.var.supabase;
  const restaurantId = c.var.restaurantId;
  const date = c.req.param("date"); // Format: 2025-01-15

  // Total des paiements réussis du jour
  const { data: payments, count: paymentCount } = await supabase
    .from("payment_transactions")
    .select("amount", { count: "exact" })
    .eq("restaurant_id", restaurantId)
    .eq("status", "paid")
    .gte("completed_at", `${date}T00:00:00`)
    .lt("completed_at", `${date}T23:59:59`);

  // Total des commandes livrées du jour
  const { data: orders, count: orderCount } = await supabase
    .from("orders")
    .select("total", { count: "exact" })
    .eq("restaurant_id", restaurantId)
    .eq("payment_status", "paid")
    .gte("created_at", `${date}T00:00:00`)
    .lt("created_at", `${date}T23:59:59`);

  const totalCollected = payments?.reduce((sum, p) => sum + p.amount, 0) ?? 0;
  const totalOrders = orders?.reduce((sum, o) => sum + o.total, 0) ?? 0;
  const discrepancy = totalCollected - totalOrders;

  return c.json({
    success: true,
    reconciliation: {
      date,
      total_collected_momo: totalCollected,
      total_orders_amount: totalOrders,
      payment_count: paymentCount ?? 0,
      order_count: orderCount ?? 0,
      discrepancy,
      status: discrepancy === 0 ? "matched" : "discrepancy",
      currency: "XAF",
    },
  });
});

export { accountingRoutes, recordPaymentAccounting };
```

---

## Sanctions

### Sanctions fiscales (CGI Cameroun)

| Infraction | Sanction |
|---|---|
| Retard de déclaration TVA mensuelle | Majoration de **10% par mois** de retard (plafonnée à 30%) |
| Défaut de déclaration TVA | **50% du montant dû** + intérêts de retard |
| Défaut de DSF annuelle | Amende de **5% du chiffre d'affaires** |
| Factures non normalisées | Rejet des charges en déduction + amende de **100 000 FCFA** par facture |
| Fraude fiscale (Art. L-100) | Amende de **100% du montant éludé** + emprisonnement de 1 à 5 ans |
| Défaut de comptabilité régulière | Taxation d'office + amende de **500 000 à 5 000 000 FCFA** |

### Sanctions OHADA

| Infraction | Sanction |
|---|---|
| Non-tenue de comptabilité SYSCOHADA | Amende de 500 000 à 5 000 000 FCFA |
| Non-conservation des pièces justificatives (10 ans) | Présomption de fraude + taxation d'office |
| États financiers non conformes | Amende + responsabilité personnelle du dirigeant |

### Sanctions réglementaires (COBAC/BEAC)

| Infraction | Sanction |
|---|---|
| Rétention de fonds clients au-delà du délai autorisé | Suspension de l'agrément de service de paiement |
| Absence de réconciliation quotidienne | Avertissement puis retrait d'agrément |
| Défaut de traçabilité des flux | Amende administrative + audit forcé |

---

## Recommandations Techniques pour KBouffe

### Priorité 1 — Immédiat (bloquant légal)

1. **Ajouter les champs `nif` et `rccm`** à la table `restaurants`. Les rendre obligatoires pour l'activation du module paiement.
2. **Créer la table `invoices`** pour les factures normalisées avec numérotation séquentielle.
3. **Générer une facture normalisée** à chaque paiement confirmé (webhook MTN → facturation automatique).
4. **Enrichir les écritures `ledger_entries`** avec les comptes OHADA (`account_code`), journaux (`journal`), et décomposition TVA.
5. **Remplacer le stub du rapport financier** par une agrégation réelle des écritures comptables.

### Priorité 2 — Court terme (1-2 semaines)

6. **Créer la table `chart_of_accounts`** avec les comptes SYSCOHADA pertinents pour KBouffe.
7. **Implémenter le rapport TVA mensuel** pour préparer les déclarations DGI.
8. **Créer l'endpoint de réconciliation** quotidienne paiements MoMo vs commandes.
9. **Ajouter la séquence de numérotation** des factures (`invoice_seq`).
10. **Créer la table `vat_declarations`** pour le suivi des déclarations TVA.

### Priorité 3 — Moyen terme

11. **Export DSF** : générer la Déclaration Statistique et Fiscale annuelle au format attendu par la DGI.
12. **Grand livre numérique** : permettre l'export du grand livre par période/compte pour l'audit.
13. **Balance générale** : endpoint de balance des comptes OHADA.
14. **Archivage numérique** : conservation des pièces justificatives numériques pendant 10 ans (stockage R2 dédié).
15. **Intégration logiciel comptable** : API d'export vers les logiciels comptables courants au Cameroun (SAGE, etc.).
16. **Alertes de déclaration** : notification automatique avant les échéances de déclaration (15 du mois pour TVA, 15 mars pour DSF).

---

## Références

1. **Acte Uniforme OHADA relatif au Droit Comptable et à l'Information Financière (AUDCIF)** — adopté le 26 janvier 2017, en vigueur depuis le 1er janvier 2018.
2. **Plan Comptable OHADA révisé** — Nomenclature des comptes et cadre de présentation des états financiers.
3. **Code Général des Impôts du Cameroun** — Articles 18, 127 ter, 128, 137, R-8, L-96, L-100.
4. **Loi de Finances 2018** — Article 8 bis : obligation de factures normalisées.
5. **Règlement COBAC R-2005/01** — Conditions d'exercice et de contrôle de l'activité de microfinance / services de paiement.
6. **DGI Cameroun** — Direction Générale des Impôts : [https://www.impots.cm](https://www.impots.cm)
7. **OHADA** — Organisation pour l'Harmonisation en Afrique du Droit des Affaires : [https://www.ohada.org](https://www.ohada.org)
8. **INS Cameroun** — Institut National de la Statistique (DSF) : [https://ins-cameroun.cm](https://ins-cameroun.cm)
