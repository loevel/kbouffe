# Fiscalité — TVA et Imposition des Plateformes Numériques au Cameroun

## Résumé

La Taxe sur la Valeur Ajoutée (TVA) est le principal impôt indirect au Cameroun, régie par le **Code Général des Impôts (CGI)**, Livre II. Toute plateforme numérique de commande alimentaire comme KBouffe, dès lors qu'elle réalise un chiffre d'affaires annuel supérieur à **50 millions FCFA**, est assujettie à la TVA au taux effectif de **19,25%** (TVA de base 17,5% + Centimes Additionnels Communaux de 1,75%). Les prestations de services numériques (frais de livraison, commissions, frais de service) sont imposables au même titre que les ventes de produits alimentaires préparés.

KBouffe agit comme **intermédiaire transparent** entre le client, le restaurant et le livreur. À ce titre, la plateforme doit :

1. Collecter la TVA sur ses propres prestations (commissions, frais de service, frais de livraison).
2. S'assurer que les restaurants partenaires collectent la TVA sur les produits alimentaires vendus.
3. Émettre des factures conformes mentionnant la TVA.
4. Reverser mensuellement la TVA collectée à la Direction Générale des Impôts (DGI).

**Actuellement, KBouffe ne calcule aucune TVA** — les champs `subtotal`, `delivery_fee`, `service_fee` et `total` ne comportent aucune ventilation fiscale. Cette situation expose la plateforme à des redressements fiscaux majeurs.

---

## Textes de Loi Applicables

### 1. Code Général des Impôts (CGI) — Livre II : TVA

| Article | Disposition |
|---------|-------------|
| **Art. 125** | Champ d'application : toutes les livraisons de biens et prestations de services effectuées à titre onéreux par un assujetti |
| **Art. 126** | Définition de l'assujetti : toute personne physique ou morale exerçant de manière indépendante une activité économique |
| **Art. 127** | Opérations imposables : ventes, prestations de services, commissions d'intermédiaires |
| **Art. 128** | Taux de TVA : 17,5% (taux normal) |
| **Art. 128 bis** | Centimes Additionnels Communaux (CAC) : 10% du principal de la TVA, soit 1,75% additionnel |
| **Art. 130** | Base d'imposition : prix total hors TVA convenu entre les parties |
| **Art. 131** | Exonérations : produits alimentaires de première nécessité non transformés (ne s'applique PAS aux plats préparés ni à la restauration) |
| **Art. 132** | Fait générateur : livraison du bien ou achèvement de la prestation |
| **Art. 133** | Exigibilité : encaissement du prix pour les prestations de services |
| **Art. 134** | Droit à déduction de la TVA payée en amont |
| **Art. 135** | Obligations de facturation : mention obligatoire du montant HT, du taux et du montant de TVA |
| **Art. 149** | Déclaration mensuelle (DSF) avant le 15 du mois suivant |

### 2. Loi de Finances — Dispositions sur le Numérique

| Texte | Disposition |
|-------|-------------|
| **Loi de Finances 2023, Art. 8** | Imposition des services numériques : les plateformes d'intermédiation sont assujetties à la TVA sur leurs commissions et frais de service |
| **Loi de Finances 2024, Art. 12** | Renforcement des obligations déclaratives pour les plateformes numériques : transmission mensuelle des volumes de transactions à la DGI |

### 3. Impôt sur les Sociétés (IS)

| Article CGI | Disposition |
|-------------|-------------|
| **Art. 17** | Taux IS : 30% du bénéfice imposable |
| **Art. 17 bis** | CAC sur IS : 10% du principal, soit taux effectif de 33% |
| **Art. 21** | Détermination du bénéfice imposable : produits moins charges déductibles |
| **Art. 22** | Charges déductibles : charges engagées dans l'intérêt de l'exploitation |

### 4. Patente et Taxes Locales

| Texte | Disposition |
|-------|-------------|
| **Art. 159 CGI** | Patente : toute personne exerçant une activité commerciale est soumise à la patente |
| **Art. 160 CGI** | Assiette : calculée sur la base du chiffre d'affaires et de la valeur locative |
| **Art. C.39 CGI** | Taxe communale sur les activités commerciales : due par toute entreprise exerçant dans la commune |

### 5. Régimes d'Imposition

| Régime | CA Annuel | Obligations |
|--------|-----------|-------------|
| **Régime de l'Impôt Libératoire** | < 10M FCFA | Forfait annuel, pas de TVA |
| **Régime Simplifié d'Imposition (RSI)** | 10M – 50M FCFA | Comptabilité simplifiée, DSF annuelle |
| **Régime Réel** | > 50M FCFA | Comptabilité complète, TVA mensuelle, DSF mensuelle, audit possible |

> ⚠️ **KBouffe**, en tant que plateforme technologique avec un CA projeté > 50M FCFA, relève du **Régime Réel** et doit collecter et reverser la TVA mensuellement.

---

## Obligations pour la Plateforme

### A. Collecte et Reversement de TVA

1. **Inscription au fichier des contribuables** auprès du Centre des Impôts compétent (obtention du NIU — Numéro d'Identifiant Unique).
2. **Collecte de la TVA à 19,25%** sur :
   - Les **frais de service** facturés aux clients (`service_fee`).
   - Les **frais de livraison** facturés aux clients (`delivery_fee`).
   - Les **commissions** prélevées sur les restaurants (`platform_fee`).
3. **Émission de factures normalisées** conformes à l'Art. 135 CGI :
   - Numéro séquentiel unique.
   - Date de la transaction.
   - Identité du vendeur (NIU, raison sociale).
   - Détail des prestations.
   - Montant HT, taux de TVA, montant TVA, montant TTC.
4. **Déclaration Statistique et Fiscale (DSF)** mensuelle avant le 15 du mois suivant.
5. **Tenue d'un registre de TVA** : TVA collectée vs TVA déductible.

### B. Application de la TVA par Composante de Commande

| Composante | Qui collecte la TVA ? | Taux | Base imposable |
|------------|----------------------|------|----------------|
| **Sous-total produits** (`subtotal`) | Le restaurant (ou KBouffe si mandataire) | 19,25% | Prix HT des produits |
| **Frais de livraison** (`delivery_fee`) | KBouffe | 19,25% | Montant HT du service de livraison |
| **Frais de service** (`service_fee`) | KBouffe | 19,25% | Montant HT de la commission client |
| **Droit de bouchon** (`corkage_fee`) | Le restaurant | 19,25% | Montant HT du droit de bouchon |
| **Pourboire** (`tip_amount`) | Non imposable | 0% | Libéralité, hors champ TVA |
| **Commission plateforme** (`platform_fee`) | KBouffe (facturée au restaurant) | 19,25% | Montant HT de la commission |

> 📌 **Important** : Les produits alimentaires préparés (plats cuisinés, restauration) sont soumis au taux normal de 19,25% au Cameroun. Seuls les produits alimentaires de première nécessité **non transformés** (riz, farine, huile de base) bénéficient d'une exonération (Art. 131 CGI). Les plats vendus via KBouffe ne bénéficient d'aucune exonération.

### C. Obligations Déclaratives

| Obligation | Fréquence | Échéance | Formulaire |
|------------|-----------|----------|------------|
| Déclaration de TVA | Mensuelle | 15 du mois M+1 | DSF mensuelle |
| Paiement de TVA | Mensuel | 15 du mois M+1 | Quittance DGI |
| Déclaration IS | Annuelle | 15 mars N+1 | DSF annuelle |
| Acomptes IS | Mensuel | 15 de chaque mois | 2,2% du CA mensuel |
| Patente | Annuelle | Janvier | Déclaration communale |
| Taxe communale | Annuelle | Selon commune | Formulaire communal |

### D. Impôt sur les Sociétés (IS)

- **Taux effectif** : 33% (30% + 10% CAC).
- **Base** : bénéfice net = (revenus de commissions + frais de service) - charges d'exploitation.
- **Acomptes mensuels** : 2,2% du chiffre d'affaires mensuel (minimum de perception).
- Le **minimum de perception** est de 2,2% du CA annuel si le résultat fiscal est déficitaire.

---

## ❌ Exemple Non-Conforme

Le code actuel de KBouffe ne calcule aucune TVA. Les montants sont stockés et transmis sans ventilation fiscale :

```typescript
// ❌ packages/modules/orders/src/api/orders.ts — Création de commande SANS TVA
ordersRoutes.post("/", async (c) => {
    const supabase = c.var.supabase;
    const restaurantId = c.var.restaurantId;
    const body = await c.req.json();

    // ❌ Aucun calcul de TVA — les montants sont TTC implicitement
    // mais aucune ventilation HT/TVA n'est conservée
    const orderData = {
        restaurant_id: restaurantId,
        customer_id: body.customer_id ?? null,
        customer_name: body.customer_name,
        customer_phone: body.customer_phone,
        items: body.items,
        subtotal: body.subtotal,           // ❌ TTC ou HT ? Ambigu
        delivery_fee: body.delivery_fee ?? 0, // ❌ Pas de TVA sur la livraison
        service_fee: body.service_fee ?? 0,   // ❌ Pas de TVA sur le service
        corkage_fee: body.corkage_fee ?? 0,
        tip_amount: body.tip_amount ?? 0,
        total: body.total,                 // ❌ Pas de ventilation fiscale
        status: "pending" as const,
        delivery_type: body.delivery_type ?? "delivery",
        payment_method: body.payment_method,
        payment_status: body.payment_status ?? "pending",
        notes: body.notes ?? null,
    };

    // ❌ Aucune entrée dans un registre de TVA
    // ❌ Aucune facture normalisée générée
    // ❌ Impossible de produire une DSF mensuelle

    const { data, error } = await supabase
        .from("orders")
        .insert(orderData as any)
        .select()
        .single();

    if (error) {
        return c.json({ error: "Erreur lors de la création de la commande" }, 500);
    }

    return c.json({ success: true, order: data }, 201);
});
```

### Problèmes identifiés :

1. **Aucun champ TVA** dans la table `orders` — impossible de restituer les montants HT et TVA.
2. **Montants ambigus** — `subtotal` et `total` ne précisent pas s'ils sont HT ou TTC.
3. **Aucune facture normalisée** — violation de l'Art. 135 CGI.
4. **Aucun registre de TVA** — impossible de produire la DSF mensuelle.
5. **Aucun calcul de TVA** sur les frais de service et de livraison qui sont des prestations imposables.

---

## ✅ Exemple Conforme

### Étape 1 : Migration — Ajouter les colonnes TVA

```sql
-- supabase/migrations/XXX_add_tax_fields.sql

-- Colonnes de ventilation TVA sur la table orders
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS subtotal_ht        INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS subtotal_tva        INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS delivery_fee_ht     INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS delivery_fee_tva    INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS service_fee_ht      INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS service_fee_tva     INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS corkage_fee_ht      INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS corkage_fee_tva     INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_tva           INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_ht            INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS tva_rate            NUMERIC(5,4) NOT NULL DEFAULT 0.1925,
    ADD COLUMN IF NOT EXISTS invoice_number      TEXT UNIQUE;

-- Table de registre TVA pour les déclarations DSF
CREATE TABLE IF NOT EXISTS public.tax_register (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id       UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    order_id            UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    period              TEXT NOT NULL,           -- format: '2025-01'
    tax_type            TEXT NOT NULL CHECK (tax_type IN ('tva_collectee', 'tva_deductible', 'tva_commission')),
    base_ht             INTEGER NOT NULL,
    tva_amount          INTEGER NOT NULL,
    tva_rate            NUMERIC(5,4) NOT NULL DEFAULT 0.1925,
    description         TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tax_register_restaurant_period
    ON public.tax_register(restaurant_id, period);

CREATE INDEX idx_tax_register_period
    ON public.tax_register(period);

-- Séquence pour les numéros de facture
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START WITH 1;

COMMENT ON COLUMN public.orders.subtotal_ht IS 'Sous-total produits Hors Taxes en FCFA';
COMMENT ON COLUMN public.orders.subtotal_tva IS 'TVA sur le sous-total produits en FCFA';
COMMENT ON COLUMN public.orders.tva_rate IS 'Taux TVA appliqué (0.1925 = 19.25%)';
COMMENT ON COLUMN public.orders.invoice_number IS 'Numéro de facture normalisée séquentiel';
```

### Étape 2 : Utilitaire de Calcul TVA

```typescript
// packages/modules/orders/src/api/lib/tax-utils.ts

/** Taux de TVA au Cameroun (Art. 128 + 128bis CGI) */
export const TVA_RATE = 0.1925; // 17.5% base + 1.75% CAC = 19.25%
export const TVA_BASE_RATE = 0.175;
export const TVA_CAC_RATE = 0.0175;

interface TaxBreakdown {
    ht: number;      // Montant Hors Taxes (arrondi à l'entier inférieur)
    tva: number;     // Montant TVA
    ttc: number;     // Montant Toutes Taxes Comprises
}

/**
 * Calcule la ventilation TVA à partir d'un montant TTC.
 * Au Cameroun, les prix affichés aux consommateurs sont généralement TTC.
 * Formule : HT = TTC / (1 + taux TVA)
 */
export function calculateTaxFromTTC(amountTTC: number, rate = TVA_RATE): TaxBreakdown {
    if (amountTTC <= 0) return { ht: 0, tva: 0, ttc: 0 };

    const ht = Math.floor(amountTTC / (1 + rate));
    const tva = amountTTC - ht;

    return { ht, tva, ttc: amountTTC };
}

/**
 * Calcule la TVA à partir d'un montant HT.
 * Utilisé quand les prix sont définis HT (cas B2B / commissions).
 */
export function calculateTaxFromHT(amountHT: number, rate = TVA_RATE): TaxBreakdown {
    if (amountHT <= 0) return { ht: 0, tva: 0, ttc: 0 };

    const tva = Math.round(amountHT * rate);
    const ttc = amountHT + tva;

    return { ht: amountHT, tva, ttc };
}

interface OrderTaxBreakdown {
    subtotal: TaxBreakdown;
    deliveryFee: TaxBreakdown;
    serviceFee: TaxBreakdown;
    corkageFee: TaxBreakdown;
    tipAmount: number;          // Non imposable
    totalHT: number;
    totalTVA: number;
    totalTTC: number;
}

/**
 * Calcule la ventilation fiscale complète d'une commande.
 * Les prix client sont TTC. Le pourboire est hors champ TVA.
 */
export function calculateOrderTax(params: {
    subtotalTTC: number;
    deliveryFeeTTC: number;
    serviceFeeTTC: number;
    corkageFeeTTC: number;
    tipAmount: number;
}): OrderTaxBreakdown {
    const subtotal = calculateTaxFromTTC(params.subtotalTTC);
    const deliveryFee = calculateTaxFromTTC(params.deliveryFeeTTC);
    const serviceFee = calculateTaxFromTTC(params.serviceFeeTTC);
    const corkageFee = calculateTaxFromTTC(params.corkageFeeTTC);

    const totalHT = subtotal.ht + deliveryFee.ht + serviceFee.ht + corkageFee.ht;
    const totalTVA = subtotal.tva + deliveryFee.tva + serviceFee.tva + corkageFee.tva;
    const totalTTC = totalHT + totalTVA + params.tipAmount;

    return {
        subtotal,
        deliveryFee,
        serviceFee,
        corkageFee,
        tipAmount: params.tipAmount,
        totalHT,
        totalTVA,
        totalTTC,
    };
}

/**
 * Génère un numéro de facture normalisé.
 * Format : KB-{ANNEE}-{SEQUENCE} (ex: KB-2025-000042)
 */
export function generateInvoiceNumber(sequenceValue: number): string {
    const year = new Date().getFullYear();
    return `KB-${year}-${String(sequenceValue).padStart(6, "0")}`;
}

/**
 * Retourne la période fiscale au format 'YYYY-MM'.
 */
export function getCurrentTaxPeriod(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${now.getFullYear()}-${month}`;
}
```

### Étape 3 : Route de Création de Commande Conforme

```typescript
// packages/modules/orders/src/api/orders.ts — Version conforme avec TVA

import {
    calculateOrderTax,
    generateInvoiceNumber,
    getCurrentTaxPeriod,
    TVA_RATE,
} from "./lib/tax-utils";

ordersRoutes.post("/", async (c) => {
    const supabase = c.var.supabase;
    const restaurantId = c.var.restaurantId;
    const body = await c.req.json();

    // ✅ Calcul de la ventilation TVA sur tous les composants
    const tax = calculateOrderTax({
        subtotalTTC: body.subtotal,
        deliveryFeeTTC: body.delivery_fee ?? 0,
        serviceFeeTTC: body.service_fee ?? 0,
        corkageFeeTTC: body.corkage_fee ?? 0,
        tipAmount: body.tip_amount ?? 0,
    });

    // ✅ Génération du numéro de facture normalisé (Art. 135 CGI)
    const { data: seqData } = await supabase
        .rpc("nextval_invoice");  // Appelle nextval('invoice_number_seq')

    const invoiceNumber = generateInvoiceNumber(seqData ?? Date.now());

    const orderData = {
        restaurant_id: restaurantId,
        customer_id: body.customer_id ?? null,
        customer_name: body.customer_name,
        customer_phone: body.customer_phone,
        items: body.items,

        // ✅ Montants TTC (prix affichés au client)
        subtotal: body.subtotal,
        delivery_fee: body.delivery_fee ?? 0,
        service_fee: body.service_fee ?? 0,
        corkage_fee: body.corkage_fee ?? 0,
        tip_amount: body.tip_amount ?? 0,
        total: tax.totalTTC,

        // ✅ Ventilation HT / TVA
        subtotal_ht: tax.subtotal.ht,
        subtotal_tva: tax.subtotal.tva,
        delivery_fee_ht: tax.deliveryFee.ht,
        delivery_fee_tva: tax.deliveryFee.tva,
        service_fee_ht: tax.serviceFee.ht,
        service_fee_tva: tax.serviceFee.tva,
        corkage_fee_ht: tax.corkageFee.ht,
        corkage_fee_tva: tax.corkageFee.tva,
        total_ht: tax.totalHT,
        total_tva: tax.totalTVA,
        tva_rate: TVA_RATE,

        // ✅ Numéro de facture normalisé
        invoice_number: invoiceNumber,

        status: "pending" as const,
        delivery_type: body.delivery_type ?? "delivery",
        delivery_address: body.delivery_address ?? null,
        payment_method: body.payment_method,
        payment_status: body.payment_status ?? "pending",
        notes: body.notes ?? null,
        table_number: body.table_number ?? null,
        table_id: body.table_id ?? null,
        covers: body.covers ?? null,
        external_drinks_count: body.external_drinks_count ?? 0,
        scheduled_for: body.scheduled_for ?? null,
    };

    const { data, error } = await supabase
        .from("orders")
        .insert(orderData as any)
        .select()
        .single();

    if (error) {
        console.error("Create order error:", error);
        return c.json({ error: "Erreur lors de la création de la commande" }, 500);
    }

    // ✅ Enregistrement dans le registre TVA pour la DSF mensuelle
    const period = getCurrentTaxPeriod();
    const taxEntries = [
        {
            restaurant_id: restaurantId,
            order_id: data.id,
            period,
            tax_type: "tva_collectee",
            base_ht: tax.subtotal.ht,
            tva_amount: tax.subtotal.tva,
            tva_rate: TVA_RATE,
            description: `TVA collectée sur produits — Commande ${invoiceNumber}`,
        },
    ];

    // TVA sur les frais de service (prestation KBouffe)
    if (tax.serviceFee.tva > 0) {
        taxEntries.push({
            restaurant_id: restaurantId,
            order_id: data.id,
            period,
            tax_type: "tva_collectee",
            base_ht: tax.serviceFee.ht,
            tva_amount: tax.serviceFee.tva,
            tva_rate: TVA_RATE,
            description: `TVA collectée sur frais de service — Commande ${invoiceNumber}`,
        });
    }

    // TVA sur les frais de livraison (prestation KBouffe)
    if (tax.deliveryFee.tva > 0) {
        taxEntries.push({
            restaurant_id: restaurantId,
            order_id: data.id,
            period,
            tax_type: "tva_collectee",
            base_ht: tax.deliveryFee.ht,
            tva_amount: tax.deliveryFee.tva,
            tva_rate: TVA_RATE,
            description: `TVA collectée sur livraison — Commande ${invoiceNumber}`,
        });
    }

    await supabase.from("tax_register").insert(taxEntries);

    return c.json({ success: true, order: data }, 201);
});
```

### Étape 4 : API de Reporting TVA pour la DSF Mensuelle

```typescript
// packages/modules/orders/src/api/tax-reporting.ts

import { Hono } from "hono";

const taxRoutes = new Hono();

/** GET /tax/summary?period=2025-01 — Résumé TVA mensuel pour DSF */
taxRoutes.get("/summary", async (c) => {
    const supabase = c.var.supabase;
    const restaurantId = c.var.restaurantId;
    const period = c.req.query("period") ?? getCurrentTaxPeriod();

    // ✅ Agrégation TVA collectée par type pour la période
    const { data: entries, error } = await supabase
        .from("tax_register")
        .select("tax_type, base_ht, tva_amount")
        .eq("restaurant_id", restaurantId)
        .eq("period", period);

    if (error) {
        return c.json({ error: "Erreur lors de la récupération du registre TVA" }, 500);
    }

    const summary = {
        period,
        tva_collectee: { base_ht: 0, tva: 0 },
        tva_deductible: { base_ht: 0, tva: 0 },
        tva_commission: { base_ht: 0, tva: 0 },
        tva_nette_a_reverser: 0,
    };

    for (const entry of entries ?? []) {
        const category = summary[entry.tax_type as keyof typeof summary];
        if (category && typeof category === "object") {
            (category as any).base_ht += entry.base_ht;
            (category as any).tva += entry.tva_amount;
        }
    }

    // TVA nette = TVA collectée - TVA déductible
    summary.tva_nette_a_reverser =
        summary.tva_collectee.tva - summary.tva_deductible.tva;

    return c.json({
        success: true,
        tax_summary: summary,
        // Informations pour la DSF
        dsf: {
            echeance: `15/${String(parseInt(period.split("-")[1]) + 1).padStart(2, "0")}/${period.split("-")[0]}`,
            regime: "reel",
            taux_tva: "19,25%",
            montant_a_reverser_fcfa: summary.tva_nette_a_reverser,
        },
    });
});

export { taxRoutes };
```

---

## Sanctions

### TVA

| Infraction | Sanction | Base légale |
|------------|----------|-------------|
| **Défaut de déclaration de TVA** | Amende de 50 000 FCFA par mois de retard + intérêts de retard de 1,5% par mois | Art. L96 du Livre des Procédures Fiscales (LPF) |
| **Retard de paiement de TVA** | Pénalité de **30%** du montant dû + intérêts de 1,5%/mois | Art. L97 LPF |
| **Insuffisance de déclaration** | Pénalité de **30%** sur le complément de droits | Art. L98 LPF |
| **Fraude fiscale (TVA)** | Pénalité de **100%** des droits éludés + poursuites pénales | Art. L100 LPF |
| **Défaut de facturation normalisée** | Amende de **50 000 à 500 000 FCFA** par infraction | Art. L101 LPF |
| **Opposition au contrôle fiscal** | Taxation d'office + pénalité de **100%** | Art. L95 LPF |

### IS et Patente

| Infraction | Sanction |
|------------|----------|
| **Défaut de déclaration IS** | Pénalité de 30% + intérêts 1,5%/mois |
| **Défaut de paiement des acomptes IS** | Pénalité de 10% par mois de retard |
| **Non-paiement de patente** | Pénalité de 25% + fermeture administrative possible |

### Exemple Chiffré

Pour un mois où KBouffe collecte **5 000 000 FCFA de TVA** et ne la reverse pas :

| Élément | Montant |
|---------|---------|
| TVA due | 5 000 000 FCFA |
| Pénalité de retard (30%) | 1 500 000 FCFA |
| Intérêts (1,5%/mois × 6 mois) | 450 000 FCFA |
| **Total à payer** | **6 950 000 FCFA** |

En cas de fraude caractérisée : pénalité de 100% = **10 000 000 FCFA** + poursuites pénales.

---

## Recommandations Techniques pour KBouffe

### Priorité 1 — Immédiat (< 1 mois)

1. **Ajouter les colonnes TVA** à la table `orders` via migration Supabase (voir Étape 1).
2. **Créer la table `tax_register`** pour le suivi TVA mensuel.
3. **Implémenter `tax-utils.ts`** — utilitaire centralisé de calcul TVA.
4. **Modifier la route de création de commande** pour calculer et stocker la ventilation HT/TVA.
5. **Générer des numéros de facture** séquentiels et uniques.

### Priorité 2 — Court terme (1-3 mois)

6. **Afficher la ventilation TVA** sur les reçus client (mobile + web).
7. **Implémenter l'API de reporting TVA** (`/tax/summary`) pour la DSF mensuelle.
8. **Ajouter la TVA sur les commissions** facturées aux restaurants (entrée dans `ledger_entries` avec ventilation TVA).
9. **Exporter les données DSF** au format requis par la DGI.

### Priorité 3 — Moyen terme (3-6 mois)

10. **Factures PDF normalisées** conformes à l'Art. 135 CGI.
11. **Gestion multi-taux** — préparer l'architecture pour d'éventuels taux réduits futurs.
12. **Système de TVA déductible** — suivre la TVA payée en amont (hébergement, services cloud, etc.).
13. **Archivage légal** — conservation des factures pendant 10 ans (obligation légale).

### Considérations Architecturales

- **Tous les montants en FCFA (entiers)** — pas de décimales, arrondi à l'entier inférieur pour le HT.
- **Le pourboire (`tip_amount`) est hors champ TVA** — c'est une libéralité du client.
- **Les prix affichés aux clients doivent être TTC** (obligation de prix TTC en B2C au Cameroun).
- **La TVA sur les commissions est une TVA B2B** — facturée par KBouffe aux restaurants.
- **Utiliser `ledger_entries`** existant pour tracer les mouvements TVA dans la comptabilité.

---

## Références

1. **Code Général des Impôts du Cameroun** — Édition 2024, Livre II (TVA), Articles 125-149.
2. **Livre des Procédures Fiscales (LPF)** — Articles L95-L101 (Sanctions).
3. **Loi de Finances 2023** — Dispositions relatives aux services numériques.
4. **Loi de Finances 2024** — Renforcement des obligations déclaratives des plateformes.
5. **Direction Générale des Impôts (DGI)** — Guide du contribuable, régimes d'imposition. [https://www.impots.cm](https://www.impots.cm)
6. **CEMAC — Directive TVA harmonisée** — Directive n°1/99/CEMAC-028-CM-03 relative à la TVA.
7. **OHADA — Acte Uniforme sur la Comptabilité** — Obligations comptables des entreprises.
8. **Circulaire DGI n°006/MINFI/DGI** — Application de la TVA aux prestations de services numériques.
