# Fiscalité — Retenues à la Source et Précomptes pour les Plateformes au Cameroun

## Résumé

En tant que plateforme d'intermédiation, KBouffe est soumise à un ensemble d'obligations de **retenues à la source** lorsqu'elle effectue des paiements à ses partenaires (restaurants, livreurs, prestataires). Le système fiscal camerounais impose aux entreprises du régime réel de retenir et reverser certains impôts **avant** de payer leurs fournisseurs et prestataires. Ces retenues constituent des **acomptes d'impôt** pour le bénéficiaire.

Les principales retenues applicables à KBouffe sont :

| Retenue | Taux effectif | Applicable sur |
|---------|---------------|----------------|
| **Précompte sur achats** | 5,5% (5% + CAC 10%) | Paiements aux restaurants non assujettis TVA |
| **Retenue TVA à la source** | 19,25% | TVA due par les fournisseurs non déclarants |
| **Retenue sur prestataires de services** | 5,5% | Rémunérations des livreurs indépendants |
| **IRCM** | 16,5% (15% + CAC 10%) | Dividendes, si applicable |
| **Retenue sur commissions** | 5,5% | Commissions versées à des intermédiaires |

**Actuellement, KBouffe ne pratique aucune retenue à la source** — les versements aux restaurants (`payouts`) et livreurs sont effectués pour le montant brut, sans aucun prélèvement fiscal. Cette situation expose la plateforme à une solidarité fiscale : KBouffe devient **co-redevable** des impôts non retenus.

---

## Textes de Loi Applicables

### 1. Précompte sur Achats (CGI, Art. 21 bis)

| Article | Disposition |
|---------|-------------|
| **Art. 21 bis CGI** | Tout acheteur relevant du régime réel est tenu de retenir 5% du montant HT de ses achats auprès de fournisseurs soumis au régime de l'impôt libératoire ou au régime simplifié |
| **Art. 21 bis (2)** | Le taux effectif est de 5,5% incluant les CAC (10% du principal) |
| **Art. 21 bis (3)** | Dispense de retenue si le fournisseur présente une attestation de non-précompte délivrée par la DGI |
| **Art. 21 bis (4)** | Le précompte constitue un acompte d'IS pour le fournisseur, imputable sur son IS annuel |

### 2. TVA Retenue à la Source (CGI, Art. 149 bis)

| Article | Disposition |
|---------|-------------|
| **Art. 149 bis CGI** | Les entreprises du régime réel sont tenues de retenir la TVA pour le compte de leurs fournisseurs qui ne sont pas assujettis à la TVA ou qui sont défaillants dans leurs obligations déclaratives |
| **Art. 149 bis (2)** | Le taux de retenue est le taux normal de TVA : 19,25% (17,5% + CAC 1,75%) |
| **Art. 149 bis (3)** | La TVA retenue est reversée à la DGI par le client (KBouffe) et constitue un crédit de TVA pour le fournisseur |

### 3. Retenue sur Prestataires de Services (CGI, Art. 93)

| Article | Disposition |
|---------|-------------|
| **Art. 93 CGI** | Toute rémunération versée à un prestataire de services indépendant est soumise à une retenue à la source de 5% (5,5% avec CAC) |
| **Art. 93 (2)** | Sont visés : les travailleurs indépendants, les auto-entrepreneurs, les prestataires occasionnels |
| **Art. 93 (3)** | La retenue est un acompte de l'impôt sur le revenu du prestataire |
| **Art. 93 (4)** | Dispense si le prestataire est salarié (soumis à l'IRPP sur salaires) |

### 4. IRCM — Impôt sur les Revenus des Capitaux Mobiliers (CGI, Art. 68-73)

| Article | Disposition |
|---------|-------------|
| **Art. 68 CGI** | L'IRCM frappe les revenus de capitaux mobiliers : dividendes, intérêts, jetons de présence |
| **Art. 69 CGI** | Taux : 15% + CAC 10% = **16,5%** effectif |
| **Art. 70 CGI** | Retenue à la source par la société distributrice |
| **Art. 71 CGI** | Déclaration et reversement dans les 15 jours suivant la mise en paiement |

### 5. Obligations de l'Intermédiaire (CGI, Art. 154-156)

| Article | Disposition |
|---------|-------------|
| **Art. 154 CGI** | Les plateformes d'intermédiation sont solidairement responsables du paiement de la TVA due par les vendeurs qu'elles mettent en relation avec les acheteurs |
| **Art. 155 CGI** | Obligation de transmission à la DGI de la liste des fournisseurs et des montants versés |
| **Art. 156 CGI** | Conservation des justificatifs de retenue pendant 10 ans |

### 6. Loi de Finances 2024 — Plateformes Numériques

| Texte | Disposition |
|-------|-------------|
| **LF 2024, Art. 14** | Les plateformes numériques d'intermédiation doivent communiquer trimestriellement à la DGI : l'identité de chaque vendeur/prestataire, le CA réalisé, les retenues effectuées |
| **LF 2024, Art. 15** | Extension de la solidarité fiscale aux plateformes pour la TVA des vendeurs non assujettis |

---

## Obligations pour la Plateforme

### A. Identification des Partenaires

Avant tout paiement, KBouffe doit collecter et vérifier pour chaque restaurant et livreur :

| Information | Objet | Obligatoire |
|-------------|-------|-------------|
| **NIU** (Numéro d'Identifiant Unique) | Identification fiscale | ✅ Oui |
| **Régime fiscal** | Déterminer les retenues applicables | ✅ Oui |
| **Attestation de non-précompte** | Dispense éventuelle de précompte | Non (optionnel) |
| **Attestation d'assujettissement TVA** | Déterminer si retenue TVA nécessaire | ✅ Oui |
| **RIB / numéro Mobile Money** | Paiement | ✅ Oui |

### B. Matrice des Retenues par Type de Partenaire

#### Restaurants

| Régime fiscal du restaurant | Précompte (5,5%) | TVA retenue (19,25%) | Retenue prestataire (5,5%) |
|-----------------------------|------------------|---------------------|---------------------------|
| **Régime Réel + TVA** | ❌ Non | ❌ Non (le restaurant reverse lui-même) | ❌ Non |
| **Régime Simplifié** | ✅ Oui | ✅ Oui (si > seuil TVA) | ❌ Non |
| **Impôt Libératoire** | ✅ Oui | ✅ Oui | ❌ Non |
| **Non immatriculé** | ✅ Oui (taux majoré possible) | ✅ Oui | ❌ Non |

#### Livreurs

| Statut du livreur | Précompte (5,5%) | TVA retenue (19,25%) | Retenue prestataire (5,5%) |
|--------------------|------------------|---------------------|---------------------------|
| **Indépendant / Auto-entrepreneur** | ❌ Non | ❌ Non (sous seuil TVA) | ✅ Oui |
| **Salarié KBouffe** | ❌ Non | ❌ Non | ❌ Non (IRPP sur salaires) |
| **Non immatriculé** | ✅ Oui | ❌ Non | ✅ Oui |

### C. Calcul du Payout avec Retenues

Le flux de paiement à un restaurant doit suivre cette logique :

```
Montant brut des commandes (total TTC collecté pour le restaurant)
  - Commission plateforme KBouffe (ex: 15% du sous-total HT)
  - Frais PSP (ex: 2% du montant collecté)
  = Montant brut à verser au restaurant
  - Précompte sur achats (5,5% si applicable)
  - TVA retenue à la source (19,25% sur la base HT si applicable)
  = Montant net versé au restaurant
```

### D. Obligations Déclaratives

| Obligation | Fréquence | Échéance | Contenu |
|------------|-----------|----------|---------|
| **Déclaration des retenues** | Mensuelle | 15 du mois M+1 | Montant total retenu par type de retenue |
| **Reversement des retenues** | Mensuel | 15 du mois M+1 | Paiement des retenues à la DGI |
| **Liste des bénéficiaires** | Trimestrielle | Fin du trimestre | NIU, nom, montants versés, retenues par fournisseur |
| **Attestations de retenue** | À chaque paiement | Immédiat | Remise d'une attestation au fournisseur/prestataire |
| **État récapitulatif annuel** | Annuelle | 15 mars N+1 | Totalité des retenues de l'année par bénéficiaire |

---

## ❌ Exemple Non-Conforme

Le code actuel de KBouffe verse les restaurants et livreurs sans aucune retenue fiscale :

```typescript
// ❌ packages/modules/orders/src/api/payments.ts — Transfert SANS retenue
paymentRoutes.post("/transfer", async (c) => {
    const body = await c.req.json<{
        payoutId: string;
        payeeMsisdn: string;
        amount: number;
        payeeNote?: string;
    }>();

    if (!body.payoutId || !body.payeeMsisdn?.trim() || !body.amount) {
        return c.json({ error: "payoutId, payeeMsisdn et amount sont requis" }, 400);
    }

    const admin = getAdminClient(c.env);
    const { data: payout } = await admin
        .from("payouts")
        .select("id, restaurant_id, amount, status")
        .eq("id", body.payoutId)
        .eq("restaurant_id", c.var.restaurantId)
        .single();

    if (!payout) return c.json({ error: "Versement introuvable" }, 404);

    // ❌ Le montant est transféré intégralement — aucune retenue
    // ❌ Pas de vérification du régime fiscal du restaurant
    // ❌ Pas de précompte sur achats
    // ❌ Pas de retenue TVA à la source
    // ❌ Pas de génération d'attestation de retenue

    const referenceId = crypto.randomUUID();

    await provider.transfer(c.env, {
        referenceId,
        amount: body.amount,  // ❌ Montant brut sans retenue
        currency: "XAF",
        externalId: `payout-${payout.id}`,
        payeeMsisdn: body.payeeMsisdn.trim(),
        payerMessage: "Versement Kbouffe",
        payeeNote: body.payeeNote ?? `Versement restaurant - ${payout.id}`,
    });

    return c.json({ success: true, transfer: { referenceId } });
});
```

```typescript
// ❌ packages/modules/hr/src/api/payouts.ts — Paiement livreur SANS retenue
payoutsRoutes.post("/staff", async (c) => {
    const body = await c.req.json();
    const { memberId, amount, notes, paymentMethod } = body;

    // ❌ Aucune retenue prestataire (5,5%) pour les livreurs indépendants
    // ❌ Pas de vérification du statut (salarié vs indépendant)
    // ❌ Pas de génération d'attestation de retenue

    const { data, error } = await c.var.supabase
        .from("staff_payouts")
        .insert({
            restaurant_id: c.var.restaurantId,
            member_id: memberId,
            amount,  // ❌ Montant brut
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

### Problèmes identifiés :

1. **Aucune retenue à la source** — KBouffe est solidairement responsable des impôts non retenus.
2. **Aucune vérification du régime fiscal** des partenaires — impossible de savoir quelles retenues appliquer.
3. **Aucune attestation de retenue** émise — le partenaire ne peut pas imputer les retenues sur son propre impôt.
4. **Aucune déclaration** des retenues à la DGI — infraction passible de pénalités.
5. **Aucune traçabilité** — pas de table pour enregistrer les retenues effectuées.

---

## ✅ Exemple Conforme

### Étape 1 : Migration — Tables pour les Retenues à la Source

```sql
-- supabase/migrations/XXX_add_withholding_tax.sql

-- Profil fiscal des partenaires (restaurants, livreurs, prestataires)
CREATE TABLE IF NOT EXISTS public.partner_tax_profiles (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Lien polymorphe : soit restaurant, soit user (livreur/prestataire)
    restaurant_id       UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    user_id             UUID REFERENCES public.users(id) ON DELETE CASCADE,
    niu                 TEXT,                    -- Numéro d'Identifiant Unique
    tax_regime          TEXT NOT NULL CHECK (tax_regime IN (
                            'reel',              -- Régime réel (> 50M FCFA)
                            'simplifie',         -- Régime simplifié (10-50M FCFA)
                            'liberatoire',       -- Impôt libératoire (< 10M FCFA)
                            'non_immatricule',   -- Non immatriculé
                            'salarie'            -- Salarié (IRPP sur salaires)
                        )),
    is_tva_registered   BOOLEAN NOT NULL DEFAULT false,
    has_non_precompte   BOOLEAN NOT NULL DEFAULT false,  -- Attestation de non-précompte
    non_precompte_expiry DATE,
    partner_type        TEXT NOT NULL CHECK (partner_type IN ('restaurant', 'driver', 'provider')),
    verified_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT partner_has_reference CHECK (restaurant_id IS NOT NULL OR user_id IS NOT NULL)
);

CREATE INDEX idx_partner_tax_restaurant ON public.partner_tax_profiles(restaurant_id);
CREATE INDEX idx_partner_tax_user ON public.partner_tax_profiles(user_id);

-- Registre des retenues à la source
CREATE TABLE IF NOT EXISTS public.withholding_tax_entries (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payout_id           UUID REFERENCES public.payouts(id) ON DELETE SET NULL,
    staff_payout_id     UUID,   -- Référence aux staff_payouts si applicable
    restaurant_id       UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    beneficiary_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    period              TEXT NOT NULL,           -- format: '2025-01'
    withholding_type    TEXT NOT NULL CHECK (withholding_type IN (
                            'precompte_achats',      -- 5,5% sur achats
                            'tva_retenue_source',    -- 19,25% TVA retenue
                            'retenue_prestataire',   -- 5,5% sur prestataires
                            'ircm'                   -- 16,5% sur dividendes
                        )),
    gross_amount        INTEGER NOT NULL,        -- Montant brut (base de calcul)
    withholding_rate    NUMERIC(5,4) NOT NULL,   -- Taux appliqué
    withholding_amount  INTEGER NOT NULL,        -- Montant retenu
    net_amount          INTEGER NOT NULL,        -- Montant versé après retenue
    attestation_number  TEXT UNIQUE,             -- Numéro d'attestation de retenue
    description         TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_withholding_restaurant_period
    ON public.withholding_tax_entries(restaurant_id, period);

CREATE INDEX idx_withholding_period_type
    ON public.withholding_tax_entries(period, withholding_type);

-- Ajouter des colonnes de retenue sur les payouts existants
ALTER TABLE public.payouts
    ADD COLUMN IF NOT EXISTS gross_amount            INTEGER,
    ADD COLUMN IF NOT EXISTS precompte_amount         INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS tva_retenue_amount       INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS net_amount               INTEGER,
    ADD COLUMN IF NOT EXISTS attestation_number       TEXT;

-- Ajouter des colonnes de retenue sur les staff_payouts
ALTER TABLE public.staff_payouts
    ADD COLUMN IF NOT EXISTS gross_amount             INTEGER,
    ADD COLUMN IF NOT EXISTS retenue_prestataire      INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS net_amount               INTEGER;

-- Séquence pour numéros d'attestation de retenue
CREATE SEQUENCE IF NOT EXISTS attestation_number_seq START WITH 1;

COMMENT ON TABLE public.partner_tax_profiles IS 'Profils fiscaux des partenaires pour le calcul des retenues à la source';
COMMENT ON TABLE public.withholding_tax_entries IS 'Registre des retenues à la source pour déclaration DGI';
COMMENT ON COLUMN public.payouts.precompte_amount IS 'Précompte sur achats retenu (5,5%)';
COMMENT ON COLUMN public.payouts.tva_retenue_amount IS 'TVA retenue à la source (19,25%)';
```

### Étape 2 : Utilitaire de Calcul des Retenues

```typescript
// packages/modules/orders/src/api/lib/withholding-utils.ts

/** Taux de retenues à la source au Cameroun */
export const WITHHOLDING_RATES = {
    /** Précompte sur achats : 5% + 10% CAC = 5,5% */
    PRECOMPTE_ACHATS: 0.055,
    /** Retenue sur prestataires de services : 5% + 10% CAC = 5,5% */
    RETENUE_PRESTATAIRE: 0.055,
    /** TVA retenue à la source : 17,5% + 1,75% CAC = 19,25% */
    TVA_RETENUE_SOURCE: 0.1925,
    /** IRCM : 15% + 10% CAC = 16,5% */
    IRCM: 0.165,
} as const;

type TaxRegime = "reel" | "simplifie" | "liberatoire" | "non_immatricule" | "salarie";

interface PartnerTaxProfile {
    tax_regime: TaxRegime;
    is_tva_registered: boolean;
    has_non_precompte: boolean;
    non_precompte_expiry: string | null;
    partner_type: "restaurant" | "driver" | "provider";
}

interface WithholdingResult {
    grossAmount: number;
    precompteAchats: number;
    tvaRetenueSource: number;
    retenuePrestataire: number;
    totalWithholdings: number;
    netAmount: number;
    appliedRates: {
        precompte: number;
        tvaRetenue: number;
        retenuePrestataire: number;
    };
}

/**
 * Détermine les retenues à la source applicables selon le profil fiscal du partenaire.
 * Applique les règles des Art. 21bis, 93 et 149bis du CGI.
 */
export function calculateWithholdings(
    grossAmount: number,
    profile: PartnerTaxProfile
): WithholdingResult {
    let precompteAchats = 0;
    let tvaRetenueSource = 0;
    let retenuePrestataire = 0;

    const appliedRates = {
        precompte: 0,
        tvaRetenue: 0,
        retenuePrestataire: 0,
    };

    // Vérifier la validité de l'attestation de non-précompte
    const hasValidNonPrecompte =
        profile.has_non_precompte &&
        profile.non_precompte_expiry &&
        new Date(profile.non_precompte_expiry) > new Date();

    // --- Précompte sur achats (Art. 21bis CGI) ---
    // Applicable aux fournisseurs sous régime simplifié, libératoire ou non immatriculés
    // Sauf si attestation de non-précompte valide
    if (
        profile.partner_type === "restaurant" &&
        !hasValidNonPrecompte &&
        ["simplifie", "liberatoire", "non_immatricule"].includes(profile.tax_regime)
    ) {
        precompteAchats = Math.round(grossAmount * WITHHOLDING_RATES.PRECOMPTE_ACHATS);
        appliedRates.precompte = WITHHOLDING_RATES.PRECOMPTE_ACHATS;
    }

    // --- TVA retenue à la source (Art. 149bis CGI) ---
    // Si le fournisseur n'est pas assujetti à la TVA et ne la collecte pas lui-même
    if (
        profile.partner_type === "restaurant" &&
        !profile.is_tva_registered &&
        ["simplifie", "liberatoire", "non_immatricule"].includes(profile.tax_regime)
    ) {
        // La base de la TVA retenue est le montant HT
        const baseHT = Math.floor(grossAmount / (1 + WITHHOLDING_RATES.TVA_RETENUE_SOURCE));
        tvaRetenueSource = grossAmount - baseHT;
        appliedRates.tvaRetenue = WITHHOLDING_RATES.TVA_RETENUE_SOURCE;
    }

    // --- Retenue sur prestataires (Art. 93 CGI) ---
    // Applicable aux livreurs indépendants et prestataires non salariés
    if (
        ["driver", "provider"].includes(profile.partner_type) &&
        profile.tax_regime !== "salarie"
    ) {
        retenuePrestataire = Math.round(grossAmount * WITHHOLDING_RATES.RETENUE_PRESTATAIRE);
        appliedRates.retenuePrestataire = WITHHOLDING_RATES.RETENUE_PRESTATAIRE;
    }

    const totalWithholdings = precompteAchats + tvaRetenueSource + retenuePrestataire;
    const netAmount = grossAmount - totalWithholdings;

    return {
        grossAmount,
        precompteAchats,
        tvaRetenueSource,
        retenuePrestataire,
        totalWithholdings,
        netAmount,
        appliedRates,
    };
}

/**
 * Génère un numéro d'attestation de retenue séquentiel.
 * Format : RAS-{ANNEE}-{SEQUENCE} (ex: RAS-2025-000042)
 */
export function generateAttestationNumber(sequenceValue: number): string {
    const year = new Date().getFullYear();
    return `RAS-${year}-${String(sequenceValue).padStart(6, "0")}`;
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

### Étape 3 : Route de Versement Conforme aux Restaurants

```typescript
// packages/modules/orders/src/api/payments.ts — Transfert AVEC retenues

import {
    calculateWithholdings,
    generateAttestationNumber,
    getCurrentTaxPeriod,
} from "./lib/withholding-utils";

paymentRoutes.post("/transfer", async (c) => {
    const body = await c.req.json<{
        payoutId: string;
        payeeMsisdn: string;
        amount: number;
        payeeNote?: string;
        provider?: MobileMoneyProviderCode;
    }>();

    if (!body.payoutId || !body.payeeMsisdn?.trim() || !body.amount) {
        return c.json({ error: "payoutId, payeeMsisdn et amount sont requis" }, 400);
    }
    if (body.amount <= 0) {
        return c.json({ error: "Le montant doit être positif" }, 400);
    }

    const admin = getAdminClient(c.env);

    // ✅ Récupérer le versement
    const { data: payout, error: payoutError } = await admin
        .from("payouts")
        .select("id, restaurant_id, amount, status")
        .eq("id", body.payoutId)
        .eq("restaurant_id", c.var.restaurantId)
        .single();

    if (payoutError || !payout) {
        return c.json({ error: "Versement introuvable" }, 404);
    }
    if ((payout as any).status === "paid") {
        return c.json({ error: "Ce versement a déjà été effectué" }, 400);
    }

    // ✅ Récupérer le profil fiscal du restaurant (Art. 21bis CGI)
    const { data: taxProfile } = await admin
        .from("partner_tax_profiles")
        .select("*")
        .eq("restaurant_id", c.var.restaurantId)
        .eq("partner_type", "restaurant")
        .single();

    if (!taxProfile) {
        return c.json({
            error: "Profil fiscal du restaurant manquant. Veuillez compléter les informations fiscales (NIU, régime) avant tout versement.",
        }, 400);
    }

    // ✅ Calculer les retenues applicables
    const withholdings = calculateWithholdings(body.amount, taxProfile);

    // ✅ Générer le numéro d'attestation de retenue
    const { data: seqData } = await admin.rpc("nextval_attestation");
    const attestationNumber = generateAttestationNumber(seqData ?? Date.now());
    const period = getCurrentTaxPeriod();
    const referenceId = crypto.randomUUID();

    // ✅ Mettre à jour le payout avec les montants de retenue
    await admin
        .from("payouts")
        .update({
            status: "processing",
            gross_amount: withholdings.grossAmount,
            precompte_amount: withholdings.precompteAchats,
            tva_retenue_amount: withholdings.tvaRetenueSource,
            net_amount: withholdings.netAmount,
            attestation_number: attestationNumber,
            reference_id: referenceId,
            updated_at: new Date().toISOString(),
        } as never)
        .eq("id", (payout as any).id);

    // ✅ Enregistrer les retenues dans le registre (pour déclaration DGI)
    const withholdingEntries = [];

    if (withholdings.precompteAchats > 0) {
        withholdingEntries.push({
            payout_id: (payout as any).id,
            restaurant_id: c.var.restaurantId,
            period,
            withholding_type: "precompte_achats",
            gross_amount: withholdings.grossAmount,
            withholding_rate: withholdings.appliedRates.precompte,
            withholding_amount: withholdings.precompteAchats,
            net_amount: withholdings.netAmount,
            attestation_number: attestationNumber,
            description: `Précompte 5,5% — Versement ${(payout as any).id}`,
        });
    }

    if (withholdings.tvaRetenueSource > 0) {
        withholdingEntries.push({
            payout_id: (payout as any).id,
            restaurant_id: c.var.restaurantId,
            period,
            withholding_type: "tva_retenue_source",
            gross_amount: withholdings.grossAmount,
            withholding_rate: withholdings.appliedRates.tvaRetenue,
            withholding_amount: withholdings.tvaRetenueSource,
            net_amount: withholdings.netAmount,
            attestation_number: attestationNumber,
            description: `TVA retenue à la source 19,25% — Versement ${(payout as any).id}`,
        });
    }

    if (withholdingEntries.length > 0) {
        await admin.from("withholding_tax_entries").insert(withholdingEntries);
    }

    // ✅ Transférer le montant NET (après retenues) via Mobile Money
    const providerCode = body.provider ?? DEFAULT_PROVIDER;
    const mobileProvider = getMobileMoneyProvider(providerCode);

    try {
        await mobileProvider!.transfer(c.env, {
            referenceId,
            amount: withholdings.netAmount,  // ✅ Montant NET après retenues
            currency: "XAF",
            externalId: `payout-${(payout as any).id}`,
            payeeMsisdn: body.payeeMsisdn.trim(),
            payerMessage: "Versement Kbouffe",
            payeeNote: body.payeeNote ?? `Versement restaurant - ${(payout as any).id}`,
        });

        return c.json({
            success: true,
            transfer: {
                referenceId,
                payoutId: (payout as any).id,
                grossAmount: withholdings.grossAmount,
                withholdings: {
                    precompte_achats: withholdings.precompteAchats,
                    tva_retenue: withholdings.tvaRetenueSource,
                    total: withholdings.totalWithholdings,
                },
                netAmount: withholdings.netAmount,
                attestationNumber,
                provider: providerCode,
            },
        });
    } catch (providerError) {
        const message =
            providerError instanceof Error
                ? providerError.message
                : "Erreur fournisseur MTN Disbursement";

        await admin
            .from("payouts")
            .update({ status: "failed", updated_at: new Date().toISOString() } as never)
            .eq("id", (payout as any).id);

        return c.json({ error: message }, 502);
    }
});
```

### Étape 4 : Route de Paiement des Livreurs avec Retenue

```typescript
// packages/modules/hr/src/api/payouts.ts — Paiement livreur AVEC retenue

import {
    calculateWithholdings,
    generateAttestationNumber,
    getCurrentTaxPeriod,
} from "@kbouffe/module-orders/api/lib/withholding-utils";

payoutsRoutes.post("/staff", async (c) => {
    const body = await c.req.json();
    const { memberId, amount, notes, paymentMethod } = body;

    const supabase = c.var.supabase;

    // ✅ Récupérer le rôle du membre pour déterminer le type de retenue
    const { data: member } = await supabase
        .from("restaurant_members")
        .select("user_id, role")
        .eq("id", memberId)
        .eq("restaurant_id", c.var.restaurantId)
        .single();

    if (!member) {
        return c.json({ error: "Membre introuvable" }, 404);
    }

    // ✅ Récupérer le profil fiscal du membre
    const { data: taxProfile } = await supabase
        .from("partner_tax_profiles")
        .select("*")
        .eq("user_id", member.user_id)
        .single();

    let grossAmount = amount;
    let retenuePrestataire = 0;
    let netAmount = amount;
    let attestationNumber: string | null = null;

    // ✅ Appliquer la retenue si le membre est un prestataire indépendant
    if (taxProfile && ["driver", "provider"].includes(taxProfile.partner_type)) {
        const withholdings = calculateWithholdings(amount, taxProfile);
        grossAmount = withholdings.grossAmount;
        retenuePrestataire = withholdings.retenuePrestataire;
        netAmount = withholdings.netAmount;

        if (retenuePrestataire > 0) {
            const { data: seqData } = await supabase.rpc("nextval_attestation");
            attestationNumber = generateAttestationNumber(seqData ?? Date.now());
            const period = getCurrentTaxPeriod();

            // ✅ Enregistrer dans le registre des retenues
            await supabase.from("withholding_tax_entries").insert({
                restaurant_id: c.var.restaurantId,
                beneficiary_user_id: member.user_id,
                period,
                withholding_type: "retenue_prestataire",
                gross_amount: grossAmount,
                withholding_rate: 0.055,
                withholding_amount: retenuePrestataire,
                net_amount: netAmount,
                attestation_number: attestationNumber,
                description: `Retenue prestataire 5,5% — Livreur ${member.user_id}`,
            });
        }
    }

    // ✅ Enregistrer le paiement avec les détails de retenue
    const { data, error } = await supabase
        .from("staff_payouts")
        .insert({
            restaurant_id: c.var.restaurantId,
            member_id: memberId,
            amount: netAmount,          // ✅ Montant net versé
            gross_amount: grossAmount,
            retenue_prestataire: retenuePrestataire,
            net_amount: netAmount,
            notes: retenuePrestataire > 0
                ? `${notes ?? ""} | Retenue prestataire: ${retenuePrestataire} FCFA (5,5%)`
                : notes,
            payment_method: paymentMethod || "momo",
            status: "paid",
            paid_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (error) return c.json({ error: error.message }, 500);

    return c.json({
        success: true,
        payout: data,
        withholdings: {
            grossAmount,
            retenuePrestataire,
            netAmount,
            attestationNumber,
        },
    });
});
```

### Étape 5 : API de Reporting des Retenues

```typescript
// packages/modules/orders/src/api/withholding-reporting.ts

import { Hono } from "hono";

const withholdingRoutes = new Hono();

/** GET /withholdings/summary?period=2025-01 — Résumé des retenues mensuelles */
withholdingRoutes.get("/summary", async (c) => {
    const supabase = c.var.supabase;
    const restaurantId = c.var.restaurantId;
    const period = c.req.query("period");

    if (!period) {
        return c.json({ error: "Le paramètre 'period' est requis (format: YYYY-MM)" }, 400);
    }

    const { data: entries, error } = await supabase
        .from("withholding_tax_entries")
        .select("withholding_type, gross_amount, withholding_amount, net_amount")
        .eq("restaurant_id", restaurantId)
        .eq("period", period);

    if (error) {
        return c.json({ error: "Erreur lors de la récupération des retenues" }, 500);
    }

    const summary = {
        period,
        precompte_achats: { count: 0, base: 0, amount: 0 },
        tva_retenue_source: { count: 0, base: 0, amount: 0 },
        retenue_prestataire: { count: 0, base: 0, amount: 0 },
        total_retenu: 0,
    };

    for (const entry of entries ?? []) {
        const key = entry.withholding_type as keyof typeof summary;
        const bucket = summary[key];
        if (bucket && typeof bucket === "object") {
            (bucket as any).count += 1;
            (bucket as any).base += entry.gross_amount;
            (bucket as any).amount += entry.withholding_amount;
        }
        summary.total_retenu += entry.withholding_amount;
    }

    return c.json({
        success: true,
        withholding_summary: summary,
        declaration: {
            echeance: `15 du mois suivant la période ${period}`,
            total_a_reverser_fcfa: summary.total_retenu,
            formulaire: "Déclaration mensuelle des retenues à la source — DGI",
        },
    });
});

/** GET /withholdings/attestations?period=2025-01 — Liste des attestations */
withholdingRoutes.get("/attestations", async (c) => {
    const supabase = c.var.supabase;
    const restaurantId = c.var.restaurantId;
    const period = c.req.query("period");

    const query = supabase
        .from("withholding_tax_entries")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });

    if (period) query.eq("period", period);

    const { data, error } = await query;

    if (error) {
        return c.json({ error: "Erreur lors de la récupération des attestations" }, 500);
    }

    return c.json({ success: true, attestations: data ?? [] });
});

export { withholdingRoutes };
```

---

## Sanctions

### Défaut de Retenue à la Source

| Infraction | Sanction | Base légale |
|------------|----------|-------------|
| **Non-retenue du précompte sur achats** | **Solidarité fiscale** : KBouffe est redevable du précompte non retenu + pénalité de **50%** du montant | Art. L108 LPF |
| **Non-retenue de TVA à la source** | Solidarité fiscale + pénalité de **100%** de la TVA non retenue | Art. L108 bis LPF |
| **Non-retenue sur prestataires** | Redevabilité du montant non retenu + pénalité de **50%** | Art. L108 LPF |
| **Retard de reversement** | Pénalité de **30%** + intérêts de retard de **1,5% par mois** | Art. L97 LPF |
| **Défaut de déclaration des retenues** | Amende de **100 000 FCFA** par déclaration manquante + taxation d'office | Art. L96 LPF |
| **Défaut d'attestation au fournisseur** | Amende de **50 000 FCFA** par attestation manquante | Art. L101 LPF |
| **Défaut de transmission de la liste des bénéficiaires** | Amende de **500 000 FCFA** par trimestre | LF 2024, Art. 14 |

### Solidarité Fiscale — Risque Principal

> ⚠️ **Point critique** : En vertu de l'Art. L108 du LPF, si KBouffe ne retient pas les impôts dus, **KBouffe devient redevable de l'intégralité de l'impôt** que le fournisseur aurait dû payer, **en plus des pénalités**. C'est le risque fiscal le plus important pour une plateforme d'intermédiation.

### Exemple Chiffré

KBouffe verse **10 000 000 FCFA** à un restaurant sous régime simplifié **sans aucune retenue** :

| Élément | Montant |
|---------|---------|
| Précompte non retenu (5,5%) | 550 000 FCFA |
| Pénalité solidarité (50%) | 275 000 FCFA |
| TVA non retenue (19,25% sur base HT) | 1 614 000 FCFA |
| Pénalité TVA (100%) | 1 614 000 FCFA |
| **Total redressement** | **4 053 000 FCFA** |

Sur un volume mensuel de 100M FCFA de versements non conformes, l'exposition fiscale dépasse **40 millions FCFA par mois**.

---

## Recommandations Techniques pour KBouffe

### Priorité 1 — Immédiat (< 1 mois)

1. **Créer la table `partner_tax_profiles`** — collecter le NIU et le régime fiscal de chaque restaurant et livreur partenaire.
2. **Créer la table `withholding_tax_entries`** — registre de toutes les retenues effectuées.
3. **Implémenter `withholding-utils.ts`** — calcul centralisé des retenues selon le profil fiscal.
4. **Modifier la route `/transfer`** — appliquer les retenues avant le versement Mobile Money.
5. **Bloquer les versements** aux partenaires sans profil fiscal complété.

### Priorité 2 — Court terme (1-3 mois)

6. **Onboarding fiscal** — formulaire pour que chaque restaurant renseigne son NIU, régime fiscal, et upload son attestation de non-précompte.
7. **Modifier les payouts livreurs** — appliquer la retenue prestataire de 5,5%.
8. **Générer des attestations de retenue** — PDF à remettre à chaque partenaire après versement.
9. **API de reporting** (`/withholdings/summary`) — pour la déclaration mensuelle à la DGI.

### Priorité 3 — Moyen terme (3-6 mois)

10. **Transmission trimestrielle à la DGI** — export automatique de la liste des bénéficiaires avec montants et retenues.
11. **Tableau de bord fiscal** — vue synthétique des retenues par période pour chaque restaurant.
12. **Alertes d'expiration** — notification quand une attestation de non-précompte arrive à expiration.
13. **Intégration comptable** — rapprocher les retenues avec les `ledger_entries` existantes pour une comptabilité cohérente.

### Considérations Architecturales

- **Profil fiscal obligatoire** avant tout premier versement — ne jamais verser sans connaître le régime du partenaire.
- **Le montant Mobile Money est toujours le NET** — le brut moins les retenues.
- **Les retenues sont des dettes envers la DGI** — elles doivent être provisionnées et reversées mensuellement.
- **Attestations de retenue** ont une valeur juridique — le partenaire les utilise pour imputer sur son propre impôt.
- **Tous les montants en FCFA entiers** — les arrondis se font au FCFA supérieur pour les retenues (en faveur du fisc).
- **Utiliser `ledger_entries`** pour créer des entrées de type `withholding_tax` en complément des payouts.

---

## Références

1. **Code Général des Impôts du Cameroun** — Édition 2024, Art. 21bis (Précompte sur achats), Art. 93 (Retenue prestataires), Art. 149bis (TVA retenue à la source), Art. 68-73 (IRCM).
2. **Livre des Procédures Fiscales (LPF)** — Art. L96-L101 (Sanctions déclaratives), Art. L108 (Solidarité fiscale).
3. **Loi de Finances 2024** — Art. 14-15 (Obligations des plateformes numériques).
4. **Direction Générale des Impôts (DGI)** — Guide des retenues à la source et précomptes. [https://www.impots.cm](https://www.impots.cm)
5. **Instruction DGI n°004/MINFI/DGI/LC/L** — Modalités d'application du précompte sur achats.
6. **Circulaire n°008/MINFI/DGI** — TVA retenue à la source par les entreprises du régime réel.
7. **CEMAC — Directive TVA harmonisée** — Directive n°1/99/CEMAC-028-CM-03.
8. **OHADA — Acte Uniforme sur la Comptabilité** — Obligations d'enregistrement des retenues.
9. **Note circulaire DGI 2024** — Obligations de transparence des plateformes d'intermédiation numérique.
