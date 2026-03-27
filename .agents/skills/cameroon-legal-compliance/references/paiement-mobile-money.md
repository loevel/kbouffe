# Réglementation des Paiements Mobile Money au Cameroun

## Résumé

Les services de paiement par monnaie électronique au Cameroun et dans la zone CEMAC (Communauté Économique et Monétaire de l'Afrique Centrale) sont encadrés par le **Règlement n°02/18/CEMAC/UMAC/COBAC du 21 décembre 2018** relatif aux services de paiement dans la CEMAC. Ce règlement établit un cadre juridique complet pour les établissements de monnaie électronique (EME), les prestataires de services de paiement (PSP), et les intermédiaires de paiement.

L'autorité de supervision est la **COBAC** (Commission Bancaire de l'Afrique Centrale), assistée par la **BEAC** (Banque des États de l'Afrique Centrale) et, au niveau national, par le **MINFI** (Ministère des Finances du Cameroun).

**KBouffe opère comme intermédiaire de paiement** : la plateforme ne détient pas de fonds clients de manière permanente mais facilite les transactions entre les clients et les restaurants via MTN Mobile Money. Cette position d'intermédiaire comporte des obligations réglementaires spécifiques, notamment en matière de protection des fonds clients, de traçabilité des transactions, et de lutte contre le blanchiment d'argent.

**Architecture de paiement KBouffe** :
- Client → MTN MoMo (Collection API) → KBouffe (compte marchand) → Restaurant (Disbursement API)
- Données stockées : référence de transaction, MSISDN, montant, payload du fournisseur (JSONB)
- Secrets : webhook secrets MTN MoMo via `wrangler secret put`

**État actuel de conformité** :
- ✅ Utilisation de l'API MTN MoMo officielle (Collection + Disbursement)
- ✅ Secrets de webhook gérés via Cloudflare Workers secrets
- ❌ MSISDN non chiffré en base de données ni masqué dans les logs
- ❌ Aucune validation des limites de transaction réglementaires
- ❌ Aucun mécanisme de détection des transactions suspectes
- ❌ Aucune politique de conservation des données de paiement formalisée
- ❌ Pas de piste d'audit complète des transactions
- ❌ Pas de chiffrement des payloads de paiement en base

---

## Textes de Loi Applicables

### 1. Règlement CEMAC n°02/18/CEMAC/UMAC/COBAC

**Titre complet** : Règlement n°02/18/CEMAC/UMAC/COBAC du 21 décembre 2018 relatif aux services de paiement dans la CEMAC.

Ce règlement est le texte fondateur de la réglementation des services de paiement électronique dans toute la zone CEMAC (Cameroun, Congo, Gabon, Guinée Équatoriale, République Centrafricaine, Tchad).

**Dispositions clés** :

| Article | Contenu | Impact KBouffe |
|---------|---------|----------------|
| Art. 1-5 | Définitions et champ d'application | KBouffe est un « accepteur de paiement » ou « intermédiaire » |
| Art. 6-12 | Catégories de prestataires de services de paiement | Détermine si KBouffe a besoin d'un agrément |
| Art. 13-20 | Conditions d'agrément des EME | Non directement applicable si KBouffe reste intermédiaire |
| Art. 21-30 | Obligations des PSP (sécurité, disponibilité, information) | Obligations de sécurité et d'information du client |
| Art. 31-40 | Protection des fonds des utilisateurs | Obligations si KBouffe détient temporairement des fonds |
| Art. 41-50 | Obligations en matière de LBC/FT (lutte contre le blanchiment) | KBouffe doit contribuer à la détection des transactions suspectes |
| Art. 55-65 | Sanctions | Exercice non autorisé = infraction pénale |

### 2. Règlement COBAC R-2005/01

**Titre** : Règlement relatif aux diligences des établissements assujettis en matière de lutte contre le blanchiment des capitaux et le financement du terrorisme en Afrique Centrale.

Impose des obligations de vigilance (KYC) et de déclaration de soupçon pour tous les intermédiaires financiers, y compris les plateformes de paiement.

### 3. Règlement CEMAC n°01/11-CEMAC/UMAC/CM

**Titre** : Règlement relatif à l'exercice de l'activité d'émission de monnaie électronique.

Définit les conditions spécifiques aux EME. Pertinent pour évaluer si KBouffe, en cas d'évolution de son modèle (wallet prépayé, fonds séquestrés), nécessiterait un agrément EME.

### 4. Loi n°2010/021 du 21 décembre 2010 (Cameroun)

**Commerce électronique** — Dispositions relatives aux paiements en ligne, obligations d'information sur les moyens de paiement, et sécurité des transactions.

### 5. Loi n°2016/007 du 12 juillet 2016 (Cameroun)

**Titre** : Loi portant Code Pénal du Cameroun — Articles relatifs à l'escroquerie, l'abus de confiance, et les infractions financières.

Applicable en cas de détournement de fonds ou d'exercice illégal d'activités financières.

### 6. Normes GABAC (Groupe d'Action contre le Blanchiment d'Argent en Afrique Centrale)

Le GABAC est le bras opérationnel de la CEMAC pour la lutte anti-blanchiment. Ses recommandations, alignées sur celles du GAFI/FATF, s'appliquent à KBouffe en tant qu'intermédiaire manipulant des fonds.

---

## Obligations pour la Plateforme

### 1. Qualification Juridique de KBouffe

**Statut actuel : Intermédiaire technique / Accepteur de paiement**

KBouffe facilite les paiements entre clients et restaurants via l'API MTN MoMo. Dans ce modèle :
- Le client paye via MTN MoMo (Collection API)
- Les fonds transitent par le compte marchand KBouffe
- KBouffe reverse les fonds au restaurant (Disbursement API)

**Quand un agrément EME serait-il requis ?**

| Critère | Seuil / Condition | Statut KBouffe |
|---------|-------------------|----------------|
| Émission de monnaie électronique | Création de valeur monétaire stockée | ⚠️ Le wallet KBouffe pourrait constituer de la monnaie électronique si rechargeable |
| Détention de fonds clients | Fonds détenus > 24h avant reversement | ⚠️ À vérifier selon les délais de disbursement |
| Volume de transactions | Pas de seuil explicite mais surveillance COBAC | À surveiller |
| Wallet rechargeable | Le client peut ajouter des fonds au wallet | ⚠️ Si implémenté, nécessite un agrément EME |

**Recommandation** : Tant que KBouffe :
1. Ne permet pas le rechargement direct du wallet (le solde ne provient que de remboursements)
2. Reverse les fonds aux restaurants dans un délai court (< 24h)
3. N'émet pas de valeur monétaire stockée

→ KBouffe reste un **intermédiaire technique** et n'a pas besoin d'un agrément EME. Toutefois, un avis juridique spécialisé est fortement recommandé.

### 2. Obligations de Sécurité des Paiements (Art. 21-30)

| Obligation | Description | État KBouffe |
|-----------|-------------|-------------|
| Authentification forte | Deux facteurs minimum pour les paiements | ✅ MTN MoMo gère l'authentification (PIN MoMo) |
| Chiffrement des données de paiement | MSISDN, références, montants | ❌ MSISDN stocké en clair |
| Intégrité des transactions | Protection contre la modification des données | ⚠️ Webhook secrets en place mais pas de signature vérifiée côté BDD |
| Disponibilité du service | SLA minimum pour les services de paiement | ⚠️ Pas de SLA formalisé |
| Traçabilité complète | Audit trail de chaque transaction | ❌ Incomplet |
| Non-répudiation | Preuve de l'initiation et de la réception du paiement | ⚠️ Partiel via les références MTN |

### 3. Protection des Fonds Clients (Art. 31-40)

Si KBouffe détient temporairement les fonds des clients avant reversement aux restaurants :

- **Ségrégation des fonds** : Les fonds clients doivent être séparés des fonds propres de KBouffe
- **Délai de reversement** : Les fonds doivent être reversés dans un délai raisonnable (< 24h recommandé)
- **Compte de cantonnement** : En cas de volume important, obligation d'ouvrir un compte dédié dans un établissement de crédit agréé
- **Interdiction d'utilisation** : KBouffe ne peut pas utiliser les fonds clients pour son propre fonctionnement

### 4. KYC — Know Your Customer (Règlement COBAC R-2005/01)

Même en tant qu'intermédiaire, KBouffe a des obligations de vigilance :

| Niveau | Données requises | Seuil de déclenchement |
|--------|-----------------|----------------------|
| Simplifié | Nom, prénom, numéro de téléphone | Transactions < 100 000 FCFA/jour |
| Standard | + Pièce d'identité (CNI/Passeport), date de naissance | Transactions entre 100 000 et 500 000 FCFA/jour |
| Renforcé | + Justificatif de domicile, source des fonds | Transactions > 500 000 FCFA/jour ou profil à risque |

### 5. Limites de Transaction (Réglementation MTN MoMo / COBAC)

Les limites réglementaires pour les transactions de monnaie électronique au Cameroun :

| Catégorie | Limite par transaction | Limite journalière | Limite mensuelle |
|-----------|----------------------|--------------------|--------------------|
| Niveau 1 (KYC simplifié) | 100 000 FCFA | 500 000 FCFA | 2 000 000 FCFA |
| Niveau 2 (KYC standard) | 500 000 FCFA | 2 000 000 FCFA | 10 000 000 FCFA |
| Niveau 3 (KYC renforcé) | 1 500 000 FCFA | 5 000 000 FCFA | 25 000 000 FCFA |

> **Note** : Ces limites sont indicatives et basées sur les grilles réglementaires COBAC. Les limites exactes peuvent varier selon l'opérateur (MTN) et les mises à jour réglementaires. Consulter les conditions générales MTN MoMo en vigueur.

**KBouffe doit** :
- Valider que chaque transaction respecte ces limites avant de soumettre à l'API MTN
- Calculer les cumuls journaliers et mensuels par utilisateur
- Refuser les transactions dépassant les seuils
- Alerter en cas de tentative répétée de dépassement (indicateur de blanchiment)

### 6. Lutte Anti-Blanchiment — LBC/FT (GABAC/FATF)

**Obligations de déclaration de soupçon** :

KBouffe doit mettre en place un dispositif de détection des transactions suspectes :

| Indicateur | Seuil / Pattern | Action requise |
|-----------|----------------|----------------|
| Fractionnement (structuring) | Plusieurs transactions proches du seuil en peu de temps | Alerte interne + déclaration ANIF |
| Volume inhabituel | Augmentation soudaine du volume de transactions d'un utilisateur | Investigation interne |
| Transactions circulaires | Paiement suivi d'un remboursement répété | Blocage + investigation |
| Comptes dormants réactivés | Compte inactif > 6 mois avec transaction soudaine élevée | Vérification d'identité |
| Transactions transfrontalières | Paiements vers/depuis des numéros étrangers | Vigilance renforcée |

**ANIF** (Agence Nationale d'Investigation Financière) : autorité camerounaise de renseignement financier. KBouffe doit déclarer toute transaction suspecte à l'ANIF.

### 7. Conservation des Données de Paiement

| Type de données | Durée de conservation | Base légale |
|----------------|----------------------|-------------|
| Références de transaction | 10 ans | Obligations comptables + GABAC |
| MSISDN (chiffré) | Durée de la relation + 5 ans | LBC/FT |
| Montants et dates | 10 ans | Obligations fiscales (Code Général des Impôts) |
| Payloads API (JSONB) | 5 ans | Preuve de transaction |
| Logs de webhook | 12 mois | Traçabilité technique |
| Preuves KYC | Durée de la relation + 5 ans | COBAC R-2005/01 |

### 8. Sécurité de l'API MTN MoMo

| Exigence | Description | État KBouffe |
|---------|-------------|-------------|
| HTTPS obligatoire | Toutes les communications API en TLS 1.2+ | ✅ (Cloudflare Workers) |
| Webhook secret validation | Vérifier la signature des callbacks MTN | ⚠️ Secret stocké mais vérification à auditer |
| Idempotence | Éviter les doubles débits via `externalId` unique | ⚠️ À vérifier |
| Sandbox vs Production | Environnements séparés avec clés distinctes | ⚠️ À documenter |
| Rate limiting | Protection contre les appels abusifs | ⚠️ Pas de rate limiting explicite côté KBouffe |
| Timeout et retry | Gestion des échecs réseau avec backoff exponentiel | ⚠️ À vérifier |

---

## ❌ Exemple Non-Conforme

### Traitement de paiement actuel — sans validation ni sécurisation

```typescript
// packages/modules/orders/src/api/payment-routes.ts (ACTUEL — NON CONFORME)
import { Hono } from "hono";

const paymentRoutes = new Hono();

interface PaymentRequest {
  order_id: string;
  amount: number;
  phone: string;
}

// ❌ Aucune validation des limites de transaction
// ❌ MSISDN en clair dans les logs
// ❌ Pas de piste d'audit
// ❌ Payload stocké sans chiffrement
// ❌ Pas de vérification de signature webhook
// ❌ Pas de détection de transactions suspectes
paymentRoutes.post("/pay", async (c) => {
  const { order_id, amount, phone }: PaymentRequest = await c.req.json();
  const supabase = c.get("supabase");
  const userId = c.get("userId");

  // ❌ Aucune validation du montant (pas de limite réglementaire)
  if (amount <= 0) {
    return c.json({ error: "Montant invalide" }, 400);
  }

  // ❌ MSISDN en clair dans les logs d'application
  console.log(`Processing payment for ${phone}, amount: ${amount} FCFA`);

  // ❌ Aucune vérification du cumul journalier/mensuel
  const momoResponse = await fetch(
    `${c.env.MTN_MOMO_API_URL}/collection/v1_0/requesttopay`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${c.env.MTN_MOMO_TOKEN}`,
        "X-Reference-Id": crypto.randomUUID(),
        "X-Target-Environment": c.env.MTN_MOMO_ENV,
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": c.env.MTN_MOMO_SUBSCRIPTION_KEY,
      },
      body: JSON.stringify({
        amount: amount.toString(),
        currency: "XAF",
        externalId: order_id,
        payer: {
          partyIdType: "MSISDN",
          // ❌ MSISDN transmis tel quel — aucune normalisation
          partyId: phone,
        },
        payerMessage: `Paiement commande ${order_id}`,
        payeeNote: `KBouffe order ${order_id}`,
      }),
    }
  );

  if (!momoResponse.ok) {
    // ❌ Erreur MTN loguée avec le MSISDN en clair
    console.error(
      `MTN MoMo payment failed for ${phone}: ${momoResponse.status}`
    );
    return c.json({ error: "Échec du paiement" }, 500);
  }

  // ❌ Payload complet stocké en JSONB sans chiffrement (contient le MSISDN)
  // ❌ Pas de champ d'audit (IP, user agent, horodatage détaillé)
  const momoPayload = await momoResponse.json();

  const { error } = await supabase.from("payment_transactions").insert({
    order_id,
    user_id: userId,
    amount,
    currency: "XAF",
    provider: "mtn_momo",
    status: "pending",
    reference_id: momoPayload.referenceId,
    msisdn: phone, // ❌ MSISDN stocké en clair
    provider_payload: momoPayload, // ❌ Payload complet non chiffré
  });

  if (error) {
    console.error(`DB insert failed for payment ${order_id}: ${error.message}`);
    return c.json({ error: "Erreur d'enregistrement du paiement" }, 500);
  }

  return c.json({
    success: true,
    reference: momoPayload.referenceId,
    message: "Paiement en cours de traitement",
  });
});

// ❌ Webhook sans vérification de signature
paymentRoutes.post("/webhook/mtn", async (c) => {
  const payload = await c.req.json();

  // ❌ Aucune vérification que la requête vient bien de MTN
  console.log(`Webhook received: ${JSON.stringify(payload)}`);

  const supabase = c.get("supabase");

  // ❌ Pas de vérification de l'intégrité du payload
  await supabase
    .from("payment_transactions")
    .update({
      status: payload.status === "SUCCESSFUL" ? "completed" : "failed",
      provider_payload: payload, // ❌ Payload écrasé sans historique
    })
    .eq("reference_id", payload.referenceId);

  return c.json({ success: true });
});

export { paymentRoutes };
```

### Problèmes identifiés :

1. **MSISDN en clair** : le numéro de téléphone apparaît dans les logs, dans la base de données, et dans les payloads — violation de la confidentialité des données financières
2. **Aucune limite de transaction** : un utilisateur pourrait initier des transactions dépassant les plafonds réglementaires COBAC
3. **Pas de piste d'audit** : impossible de retracer l'historique complet d'une transaction en cas de litige ou d'enquête
4. **Webhook non sécurisé** : n'importe quel acteur pourrait envoyer de faux callbacks et modifier le statut des paiements
5. **Pas de détection anti-blanchiment** : aucun mécanisme pour identifier les transactions suspectes (fractionnement, volumes inhabituels)
6. **Payload non chiffré** : les réponses MTN contenant des données sensibles sont stockées en clair

---

## ✅ Exemple Conforme

### Traitement de paiement sécurisé et conforme

```typescript
// packages/modules/orders/src/api/payment-routes.ts (CONFORME)
import { Hono } from "hono";
import { maskMsisdn, sanitizeForLogs } from "@kbouffe/module-core/lib/privacy-utils";
import {
  validateTransactionLimits,
  detectSuspiciousActivity,
  normalizeMsisdn,
  encryptSensitiveField,
} from "../lib/payment-compliance";

const paymentRoutes = new Hono();

// ✅ Limites réglementaires COBAC (Niveau 1 par défaut)
const TRANSACTION_LIMITS = {
  level_1: {
    per_transaction: 100_000,
    daily: 500_000,
    monthly: 2_000_000,
  },
  level_2: {
    per_transaction: 500_000,
    daily: 2_000_000,
    monthly: 10_000_000,
  },
  level_3: {
    per_transaction: 1_500_000,
    daily: 5_000_000,
    monthly: 25_000_000,
  },
} as const;

interface PaymentRequest {
  order_id: string;
  amount: number;
  phone: string;
}

// ✅ Paiement avec validation complète
paymentRoutes.post("/pay", async (c) => {
  const { order_id, amount, phone }: PaymentRequest = await c.req.json();
  const supabase = c.get("supabase");
  const userId = c.get("userId");

  // ✅ Normalisation du MSISDN (format international +237...)
  const normalizedMsisdn = normalizeMsisdn(phone);
  if (!normalizedMsisdn) {
    return c.json(
      { error: "Numéro de téléphone invalide. Format attendu : +237XXXXXXXXX" },
      400
    );
  }

  // ✅ Validation du montant minimum
  if (!Number.isInteger(amount) || amount < 100) {
    return c.json(
      { error: "Montant invalide. Minimum : 100 FCFA." },
      400
    );
  }

  // ✅ Récupération du niveau KYC de l'utilisateur
  const { data: userProfile } = await supabase
    .from("users")
    .select("kyc_level")
    .eq("id", userId)
    .single();

  const kycLevel = (userProfile?.kyc_level || "level_1") as keyof typeof TRANSACTION_LIMITS;
  const limits = TRANSACTION_LIMITS[kycLevel];

  // ✅ Vérification de la limite par transaction
  if (amount > limits.per_transaction) {
    return c.json(
      {
        error: `Le montant dépasse la limite autorisée de ${limits.per_transaction.toLocaleString("fr-FR")} FCFA pour votre niveau de vérification.`,
        limit: limits.per_transaction,
        upgrade_url: "https://kbouffe.com/verification",
      },
      422
    );
  }

  // ✅ Vérification des cumuls journalier et mensuel
  const limitsCheck = await validateTransactionLimits(
    supabase,
    userId,
    amount,
    limits
  );

  if (!limitsCheck.allowed) {
    // ✅ Log sans données personnelles
    console.warn(
      `Transaction limit reached for user ${userId.slice(0, 8)}...: ${limitsCheck.reason}`
    );

    return c.json(
      {
        error: limitsCheck.reason,
        daily_total: limitsCheck.dailyTotal,
        monthly_total: limitsCheck.monthlyTotal,
        daily_limit: limits.daily,
        monthly_limit: limits.monthly,
      },
      422
    );
  }

  // ✅ Détection de transactions suspectes (LBC/FT)
  const suspiciousCheck = await detectSuspiciousActivity(
    supabase,
    userId,
    amount
  );

  if (suspiciousCheck.flagged) {
    // ✅ Journalisation de l'alerte (sans données personnelles)
    await supabase.from("aml_alerts").insert({
      user_id: userId,
      alert_type: suspiciousCheck.alertType,
      amount,
      details: suspiciousCheck.details,
      status: "pending_review",
      created_at: new Date().toISOString(),
    });

    console.warn(
      `AML alert: ${suspiciousCheck.alertType} for user ${userId.slice(0, 8)}...`
    );

    // ✅ Bloquer si le risque est élevé
    if (suspiciousCheck.severity === "high") {
      return c.json(
        {
          error:
            "Cette transaction nécessite une vérification supplémentaire. Veuillez contacter le support.",
        },
        403
      );
    }
  }

  // ✅ Génération d'un identifiant unique pour l'idempotence
  const externalId = crypto.randomUUID();

  // ✅ Log masqué
  console.info(
    `Payment initiated: user=${userId.slice(0, 8)}..., amount=${amount} XAF, ref=${externalId}`
  );

  // ✅ Appel API MTN MoMo avec gestion d'erreur robuste
  let momoResponse: Response;
  try {
    momoResponse = await fetch(
      `${c.env.MTN_MOMO_API_URL}/collection/v1_0/requesttopay`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${c.env.MTN_MOMO_TOKEN}`,
          "X-Reference-Id": externalId,
          "X-Target-Environment": c.env.MTN_MOMO_ENV,
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": c.env.MTN_MOMO_SUBSCRIPTION_KEY,
          "X-Callback-Url": `${c.env.API_BASE_URL}/api/payments/webhook/mtn`,
        },
        body: JSON.stringify({
          amount: amount.toString(),
          currency: "XAF",
          externalId,
          payer: {
            partyIdType: "MSISDN",
            partyId: normalizedMsisdn,
          },
          payerMessage: `Paiement commande KBouffe`,
          payeeNote: `KBouffe #${order_id.slice(0, 8)}`,
        }),
      }
    );
  } catch (networkError) {
    console.error(`MTN API network error for ref ${externalId}`);
    return c.json(
      {
        error:
          "Service de paiement temporairement indisponible. Veuillez réessayer.",
      },
      503
    );
  }

  if (!momoResponse.ok) {
    // ✅ Log sans MSISDN
    console.error(
      `MTN MoMo payment failed: ref=${externalId}, status=${momoResponse.status}`
    );
    return c.json({ error: "Échec du paiement. Veuillez réessayer." }, 502);
  }

  // ✅ Chiffrement du MSISDN et du payload avant stockage
  const encryptedMsisdn = await encryptSensitiveField(
    normalizedMsisdn,
    c.env.DATA_ENCRYPTION_KEY
  );

  const now = new Date().toISOString();

  // ✅ Enregistrement complet avec piste d'audit
  const { error: insertError } = await supabase
    .from("payment_transactions")
    .insert({
      id: crypto.randomUUID(),
      order_id,
      user_id: userId,
      amount,
      currency: "XAF",
      provider: "mtn_momo",
      status: "pending",
      reference_id: externalId,
      msisdn_encrypted: encryptedMsisdn,
      msisdn_masked: maskMsisdn(normalizedMsisdn),
      kyc_level: kycLevel,
      ip_address: c.req.header("cf-connecting-ip") || "unknown",
      user_agent: c.req.header("user-agent") || "unknown",
      created_at: now,
      updated_at: now,
    });

  if (insertError) {
    console.error(`DB insert failed for payment ref=${externalId}`);
    return c.json({ error: "Erreur d'enregistrement du paiement" }, 500);
  }

  // ✅ Piste d'audit séparée
  await supabase.from("payment_audit_trail").insert({
    transaction_reference: externalId,
    event_type: "payment_initiated",
    actor_id: userId,
    details: {
      amount,
      currency: "XAF",
      provider: "mtn_momo",
      kyc_level: kycLevel,
    },
    ip_address: c.req.header("cf-connecting-ip") || "unknown",
    created_at: now,
  });

  return c.json({
    success: true,
    reference: externalId,
    message: "Paiement en cours de traitement. Confirmez sur votre téléphone.",
  });
});

// ✅ Webhook sécurisé avec vérification de signature
paymentRoutes.post("/webhook/mtn", async (c) => {
  // ✅ Vérification de la signature du webhook
  const signature = c.req.header("x-signature");
  const webhookSecret = c.env.MTN_MOMO_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    console.warn("Webhook received without signature — rejected");
    return c.json({ error: "Unauthorized" }, 401);
  }

  const rawBody = await c.req.text();

  // ✅ Calcul et vérification du HMAC
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(webhookSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const expectedSignature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(rawBody)
  );

  const expectedHex = Array.from(new Uint8Array(expectedSignature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (signature !== expectedHex) {
    console.warn("Webhook signature mismatch — rejected");
    return c.json({ error: "Invalid signature" }, 403);
  }

  const payload = JSON.parse(rawBody);

  // ✅ Sanitisation du payload pour les logs
  console.info(
    `Webhook received: ref=${payload.externalId}, status=${payload.status}`
  );

  const supabase = c.get("supabase");
  const now = new Date().toISOString();
  const newStatus = payload.status === "SUCCESSFUL" ? "completed" : "failed";

  // ✅ Mise à jour avec conservation de l'historique des statuts
  const { data: existingTx } = await supabase
    .from("payment_transactions")
    .select("id, status, status_history")
    .eq("reference_id", payload.externalId)
    .single();

  if (!existingTx) {
    console.warn(`Webhook for unknown reference: ${payload.externalId}`);
    return c.json({ error: "Transaction not found" }, 404);
  }

  // ✅ Protection contre les transitions de statut invalides
  if (existingTx.status === "completed" || existingTx.status === "refunded") {
    console.warn(
      `Webhook attempted status change on finalized transaction: ${payload.externalId}`
    );
    return c.json({ success: true, message: "Transaction already finalized" });
  }

  const statusHistory = existingTx.status_history || [];
  statusHistory.push({
    from: existingTx.status,
    to: newStatus,
    timestamp: now,
    source: "mtn_webhook",
  });

  await supabase
    .from("payment_transactions")
    .update({
      status: newStatus,
      status_history: statusHistory,
      updated_at: now,
    })
    .eq("reference_id", payload.externalId);

  // ✅ Piste d'audit du webhook
  await supabase.from("payment_audit_trail").insert({
    transaction_reference: payload.externalId,
    event_type: `webhook_${newStatus}`,
    actor_id: "system",
    details: {
      mtn_status: payload.status,
      mtn_reason: payload.reason || null,
    },
    ip_address: c.req.header("cf-connecting-ip") || "unknown",
    created_at: now,
  });

  return c.json({ success: true });
});

export { paymentRoutes };
```

### Module de conformité paiement

```typescript
// packages/modules/orders/src/lib/payment-compliance.ts
import type { SupabaseClient } from "@supabase/supabase-js";

interface TransactionLimits {
  per_transaction: number;
  daily: number;
  monthly: number;
}

interface LimitsCheckResult {
  allowed: boolean;
  reason?: string;
  dailyTotal: number;
  monthlyTotal: number;
}

/**
 * Normalise un MSISDN au format international camerounais (+237XXXXXXXXX).
 * Retourne null si le format est invalide.
 */
export function normalizeMsisdn(input: string): string | null {
  const cleaned = input.replace(/[\s\-\(\)]/g, "");

  let msisdn: string;
  if (cleaned.startsWith("+237")) {
    msisdn = cleaned;
  } else if (cleaned.startsWith("237")) {
    msisdn = `+${cleaned}`;
  } else if (cleaned.startsWith("6") || cleaned.startsWith("2")) {
    msisdn = `+237${cleaned}`;
  } else {
    return null;
  }

  // Validation : +237 suivi de 9 chiffres
  if (!/^\+237[0-9]{9}$/.test(msisdn)) {
    return null;
  }

  return msisdn;
}

/**
 * Vérifie les limites de transaction journalières et mensuelles
 * conformément au Règlement COBAC.
 */
export async function validateTransactionLimits(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  limits: TransactionLimits
): Promise<LimitsCheckResult> {
  const now = new Date();

  // Début de la journée (UTC)
  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0, 0, 0, 0);

  // Début du mois (UTC)
  const startOfMonth = new Date(now.getUTCFullYear(), now.getUTCMonth(), 1);

  // Cumul journalier
  const { data: dailyData } = await supabase
    .from("payment_transactions")
    .select("amount")
    .eq("user_id", userId)
    .in("status", ["pending", "completed"])
    .gte("created_at", startOfDay.toISOString());

  const dailyTotal =
    (dailyData || []).reduce((sum, tx) => sum + tx.amount, 0) + amount;

  if (dailyTotal > limits.daily) {
    return {
      allowed: false,
      reason: `Limite journalière atteinte : ${limits.daily.toLocaleString("fr-FR")} FCFA. Réessayez demain.`,
      dailyTotal: dailyTotal - amount,
      monthlyTotal: 0,
    };
  }

  // Cumul mensuel
  const { data: monthlyData } = await supabase
    .from("payment_transactions")
    .select("amount")
    .eq("user_id", userId)
    .in("status", ["pending", "completed"])
    .gte("created_at", startOfMonth.toISOString());

  const monthlyTotal =
    (monthlyData || []).reduce((sum, tx) => sum + tx.amount, 0) + amount;

  if (monthlyTotal > limits.monthly) {
    return {
      allowed: false,
      reason: `Limite mensuelle atteinte : ${limits.monthly.toLocaleString("fr-FR")} FCFA. Augmentez votre niveau de vérification.`,
      dailyTotal: dailyTotal - amount,
      monthlyTotal: monthlyTotal - amount,
    };
  }

  return {
    allowed: true,
    dailyTotal,
    monthlyTotal,
  };
}

interface SuspiciousActivityResult {
  flagged: boolean;
  alertType?: string;
  severity?: "low" | "medium" | "high";
  details?: Record<string, unknown>;
}

/**
 * Détecte les patterns de transactions suspectes (LBC/FT — GABAC).
 */
export async function detectSuspiciousActivity(
  supabase: SupabaseClient,
  userId: string,
  amount: number
): Promise<SuspiciousActivityResult> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Vérification 1 : fractionnement (structuring)
  // Plusieurs transactions dans la dernière heure
  const { data: recentTx } = await supabase
    .from("payment_transactions")
    .select("amount, created_at")
    .eq("user_id", userId)
    .gte("created_at", oneHourAgo.toISOString())
    .order("created_at", { ascending: false });

  if (recentTx && recentTx.length >= 5) {
    return {
      flagged: true,
      alertType: "structuring",
      severity: "high",
      details: {
        transaction_count_1h: recentTx.length,
        total_amount_1h: recentTx.reduce((s, tx) => s + tx.amount, 0) + amount,
      },
    };
  }

  // Vérification 2 : volume inhabituel sur 24h
  const { data: dailyTx } = await supabase
    .from("payment_transactions")
    .select("amount")
    .eq("user_id", userId)
    .gte("created_at", twentyFourHoursAgo.toISOString());

  const dailyVolume =
    (dailyTx || []).reduce((s, tx) => s + tx.amount, 0) + amount;

  // Moyenne historique sur 30 jours
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const { data: monthlyTx } = await supabase
    .from("payment_transactions")
    .select("amount")
    .eq("user_id", userId)
    .gte("created_at", thirtyDaysAgo.toISOString());

  const monthlyTotal = (monthlyTx || []).reduce((s, tx) => s + tx.amount, 0);
  const dailyAverage = monthlyTotal / 30;

  // Si le volume journalier est 5x supérieur à la moyenne
  if (dailyAverage > 0 && dailyVolume > dailyAverage * 5) {
    return {
      flagged: true,
      alertType: "unusual_volume",
      severity: "medium",
      details: {
        daily_volume: dailyVolume,
        daily_average: Math.round(dailyAverage),
        ratio: Math.round(dailyVolume / dailyAverage),
      },
    };
  }

  // Vérification 3 : montant élevé isolé
  if (amount >= 500_000) {
    return {
      flagged: true,
      alertType: "high_value_transaction",
      severity: "low",
      details: { amount },
    };
  }

  return { flagged: false };
}

/**
 * Chiffre un champ sensible avec AES-256-GCM (compatible Web Crypto API / Cloudflare Workers).
 */
export async function encryptSensitiveField(
  plaintext: string,
  encryptionKeyHex: string
): Promise<string> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const keyBuffer = new Uint8Array(
    encryptionKeyHex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16))
  );

  const key = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext)
  );

  // Format : iv(hex):ciphertext(hex)
  const ivHex = Array.from(iv)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const ctHex = Array.from(new Uint8Array(ciphertext))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `${ivHex}:${ctHex}`;
}

/**
 * Déchiffre un champ sensible.
 */
export async function decryptSensitiveField(
  encrypted: string,
  encryptionKeyHex: string
): Promise<string> {
  const [ivHex, ctHex] = encrypted.split(":");

  const iv = new Uint8Array(
    ivHex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16))
  );
  const ciphertext = new Uint8Array(
    ctHex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16))
  );

  const keyBuffer = new Uint8Array(
    encryptionKeyHex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16))
  );

  const key = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(plaintext);
}
```

### Schéma de base de données pour l'audit des paiements

```sql
-- Migration : Tables de conformité paiement
-- Conforme au Règlement CEMAC n°02/18 et COBAC R-2005/01

-- Ajout de colonnes de conformité à la table payment_transactions existante
ALTER TABLE public.payment_transactions
  ADD COLUMN IF NOT EXISTS msisdn_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS msisdn_masked TEXT,
  ADD COLUMN IF NOT EXISTS kyc_level TEXT DEFAULT 'level_1',
  ADD COLUMN IF NOT EXISTS ip_address TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ✅ Index pour les vérifications de limites (cumuls journalier/mensuel)
CREATE INDEX IF NOT EXISTS idx_payment_tx_user_status_date
  ON public.payment_transactions(user_id, status, created_at);

CREATE INDEX IF NOT EXISTS idx_payment_tx_reference
  ON public.payment_transactions(reference_id);

-- ✅ Table de piste d'audit des paiements (immuable)
CREATE TABLE IF NOT EXISTS public.payment_audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_reference TEXT NOT NULL,
  event_type TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_audit_reference
  ON public.payment_audit_trail(transaction_reference);
CREATE INDEX idx_payment_audit_event_type
  ON public.payment_audit_trail(event_type);
CREATE INDEX idx_payment_audit_created_at
  ON public.payment_audit_trail(created_at);

-- ✅ RLS : seul le service role peut écrire/lire l'audit trail
ALTER TABLE public.payment_audit_trail ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages payment audit trail"
  ON public.payment_audit_trail FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ✅ Table d'alertes anti-blanchiment (LBC/FT)
CREATE TABLE IF NOT EXISTS public.aml_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  alert_type TEXT NOT NULL CHECK (
    alert_type IN ('structuring', 'unusual_volume', 'high_value_transaction', 'circular_transaction', 'dormant_reactivation')
  ),
  amount INTEGER NOT NULL,
  details JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (
    status IN ('pending_review', 'investigating', 'cleared', 'reported_anif', 'blocked')
  ),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  reported_to_anif_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_aml_alerts_user_id ON public.aml_alerts(user_id);
CREATE INDEX idx_aml_alerts_status ON public.aml_alerts(status);
CREATE INDEX idx_aml_alerts_type ON public.aml_alerts(alert_type);
CREATE INDEX idx_aml_alerts_created_at ON public.aml_alerts(created_at);

ALTER TABLE public.aml_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage AML alerts"
  ON public.aml_alerts FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ✅ Ajout du niveau KYC à la table users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS kyc_level TEXT DEFAULT 'level_1'
    CHECK (kyc_level IN ('level_1', 'level_2', 'level_3')),
  ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS kyc_document_type TEXT,
  ADD COLUMN IF NOT EXISTS kyc_document_verified BOOLEAN DEFAULT false;

-- ✅ Vue pour le monitoring des transactions (dashboard admin)
CREATE OR REPLACE VIEW public.payment_daily_summary AS
SELECT
  date_trunc('day', created_at) AS day,
  COUNT(*) AS transaction_count,
  SUM(amount) AS total_volume,
  SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) AS completed_volume,
  SUM(CASE WHEN status = 'failed' THEN amount ELSE 0 END) AS failed_volume,
  COUNT(DISTINCT user_id) AS unique_users
FROM public.payment_transactions
GROUP BY date_trunc('day', created_at)
ORDER BY day DESC;

-- ✅ Fonction pour vérifier les limites (peut être appelée via RPC)
CREATE OR REPLACE FUNCTION public.check_transaction_limits(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_kyc_level TEXT;
  v_daily_total INTEGER;
  v_monthly_total INTEGER;
  v_daily_limit INTEGER;
  v_monthly_limit INTEGER;
  v_per_tx_limit INTEGER;
BEGIN
  SELECT kyc_level INTO v_kyc_level FROM public.users WHERE id = p_user_id;
  v_kyc_level := COALESCE(v_kyc_level, 'level_1');

  CASE v_kyc_level
    WHEN 'level_1' THEN
      v_per_tx_limit := 100000; v_daily_limit := 500000; v_monthly_limit := 2000000;
    WHEN 'level_2' THEN
      v_per_tx_limit := 500000; v_daily_limit := 2000000; v_monthly_limit := 10000000;
    WHEN 'level_3' THEN
      v_per_tx_limit := 1500000; v_daily_limit := 5000000; v_monthly_limit := 25000000;
  END CASE;

  SELECT COALESCE(SUM(amount), 0) INTO v_daily_total
  FROM public.payment_transactions
  WHERE user_id = p_user_id
    AND status IN ('pending', 'completed')
    AND created_at >= date_trunc('day', now());

  SELECT COALESCE(SUM(amount), 0) INTO v_monthly_total
  FROM public.payment_transactions
  WHERE user_id = p_user_id
    AND status IN ('pending', 'completed')
    AND created_at >= date_trunc('month', now());

  RETURN jsonb_build_object(
    'allowed', (
      p_amount <= v_per_tx_limit
      AND (v_daily_total + p_amount) <= v_daily_limit
      AND (v_monthly_total + p_amount) <= v_monthly_limit
    ),
    'kyc_level', v_kyc_level,
    'per_transaction_limit', v_per_tx_limit,
    'daily_limit', v_daily_limit,
    'daily_total', v_daily_total,
    'monthly_limit', v_monthly_limit,
    'monthly_total', v_monthly_total
  );
END;
$$;
```

---

## Sanctions

### Sanctions Pénales

| Infraction | Base légale | Sanction |
|-----------|------------|----------|
| Exercice non autorisé de services de paiement | Règlement CEMAC n°02/18, Art. 55 | **5 à 10 ans d'emprisonnement** et **10 000 000 à 100 000 000 FCFA** d'amende |
| Détournement de fonds clients | Code Pénal camerounais, Art. 318 (abus de confiance) | **5 à 10 ans d'emprisonnement** |
| Non-respect des obligations LBC/FT | Règlement COBAC R-2005/01 | **Retrait d'agrément** + sanctions pénales |
| Non-déclaration de transaction suspecte à l'ANIF | Loi relative au blanchiment | **1 à 5 ans d'emprisonnement** et amendes |
| Défaut de sécurité des données de paiement | Loi n°2010/012, Art. 74 | **1 à 2 ans d'emprisonnement** et **1 000 000 à 5 000 000 FCFA** |

### Sanctions Administratives (COBAC)

- **Avertissement** : premier manquement mineur
- **Blâme** : manquement répété
- **Interdiction d'exercer** : manquement grave
- **Retrait d'agrément** : infraction majeure ou répétée
- **Amende administrative** : jusqu'à 100 000 000 FCFA selon la gravité

### Sanctions par MTN MoMo (Contractuelles)

- Suspension temporaire de l'accès à l'API
- Résiliation du contrat marchand
- Gel des fonds en transit
- Signalement aux autorités de régulation

### Responsabilité Civile

- Remboursement intégral des fonds détournés ou perdus
- Dommages et intérêts au profit des utilisateurs lésés
- Responsabilité solidaire avec le partenaire de paiement en cas de faille de sécurité

---

## Recommandations Techniques pour KBouffe

### Priorité 1 — Actions Immédiates (0-30 jours)

1. **Masquage du MSISDN dans les logs**
   - Déployer `maskMsisdn()` dans tous les handlers de paiement
   - Auditer tous les `console.log/error/warn` qui traitent des données de paiement
   - Configurer les logs Cloudflare Workers pour filtrer les données sensibles

2. **Vérification de signature webhook MTN MoMo**
   - Implémenter la vérification HMAC-SHA256 sur tous les endpoints webhook
   - Rejeter systématiquement les webhooks sans signature valide
   - Logger les tentatives de webhook invalides (alerte de sécurité)

3. **Validation des limites de transaction**
   - Implémenter `validateTransactionLimits()` avant chaque appel API MTN
   - Vérifier les cumuls journaliers et mensuels par utilisateur
   - Retourner des messages d'erreur explicites avec les limites atteintes

4. **Normalisation du MSISDN**
   - Valider et normaliser au format +237XXXXXXXXX avant toute transaction
   - Rejeter les numéros non camerounais (sauf si expansion future)

### Priorité 2 — Actions à Court Terme (30-90 jours)

5. **Chiffrement du MSISDN en base de données**
   - Migrer vers le stockage chiffré (AES-256-GCM)
   - Conserver une version masquée pour l'affichage (msisdn_masked)
   - Gérer la rotation des clés de chiffrement

6. **Piste d'audit complète**
   - Créer `payment_audit_trail` (table immuable, append-only)
   - Logger chaque événement : initiation, webhook, remboursement, litige
   - Inclure les métadonnées (IP, user agent, horodatage précis)

7. **Détection des transactions suspectes (LBC/FT)**
   - Implémenter `detectSuspiciousActivity()` avec les indicateurs GABAC
   - Créer la table `aml_alerts` pour le suivi des alertes
   - Dashboard admin pour la revue des alertes

8. **Idempotence des paiements**
   - Générer un `externalId` unique côté KBouffe
   - Vérifier qu'une transaction avec le même `externalId` n'existe pas déjà
   - Gérer les doublons gracieusement (retourner la transaction existante)

### Priorité 3 — Actions à Moyen Terme (90-180 jours)

9. **Niveaux KYC**
   - Ajouter `kyc_level` à la table users
   - Implémenter le processus de vérification d'identité (upload CNI/passeport)
   - Ajuster automatiquement les limites selon le niveau KYC

10. **Monitoring et alertes temps réel**
    - Dashboard de monitoring des transactions (volumes, taux d'échec, alertes AML)
    - Alertes automatiques en cas d'anomalie (pic de transactions, taux d'échec élevé)
    - Rapport quotidien automatisé pour l'équipe compliance

11. **Procédure de déclaration ANIF**
    - Documenter la procédure interne de déclaration de soupçon
    - Désigner un correspondant ANIF au sein de l'équipe
    - Préparer les modèles de déclaration

12. **Consultation juridique**
    - Obtenir un avis juridique formel sur le statut d'intermédiaire de KBouffe
    - Évaluer la nécessité d'un agrément EME ou PSP selon le volume de transactions
    - Vérifier la conformité du contrat MTN MoMo marchand

---

## Références

### Textes Législatifs et Réglementaires

1. **Règlement n°02/18/CEMAC/UMAC/COBAC du 21 décembre 2018** relatif aux services de paiement dans la CEMAC
   - Texte fondateur de la réglementation des services de paiement en zone CEMAC

2. **Règlement COBAC R-2005/01** relatif aux diligences des établissements assujettis en matière de lutte contre le blanchiment des capitaux et le financement du terrorisme en Afrique Centrale

3. **Règlement n°01/11-CEMAC/UMAC/CM** relatif à l'exercice de l'activité d'émission de monnaie électronique

4. **Loi n°2010/021 du 21 décembre 2010** régissant le Commerce Électronique au Cameroun

5. **Loi n°2010/012 du 21 décembre 2010** relative à la Cybersécurité et la Cybercriminalité au Cameroun

6. **Loi n°2016/007 du 12 juillet 2016** portant Code Pénal du Cameroun

7. **Règlement CEMAC n°01/03-CEMAC-UMAC** portant prévention et répression du blanchiment des capitaux et du financement du terrorisme en Afrique Centrale

### Autorités Compétentes

- **COBAC** — Commission Bancaire de l'Afrique Centrale
  - Site web : [https://www.sgcobac.org](https://www.sgcobac.org)
  - Siège : Libreville, Gabon (compétence zone CEMAC)

- **BEAC** — Banque des États de l'Afrique Centrale
  - Site web : [https://www.beac.int](https://www.beac.int)
  - Autorité monétaire de la zone CEMAC

- **GABAC** — Groupe d'Action contre le Blanchiment d'Argent en Afrique Centrale
  - Site web : [https://www.gabac.org](https://www.gabac.org)
  - Organisme de type GAFI pour l'Afrique Centrale

- **ANIF** — Agence Nationale d'Investigation Financière (Cameroun)
  - Cellule de renseignement financier nationale
  - Destinataire des déclarations de soupçon

- **ANTIC** — Agence Nationale des Technologies de l'Information et de la Communication
  - Site web : [https://www.antic.cm](https://www.antic.cm)
  - Compétente pour la sécurité des systèmes d'information

### Références Techniques

- **MTN MoMo Developer Portal** : [https://momodeveloper.mtn.com](https://momodeveloper.mtn.com)
  - Documentation API Collection et Disbursement
  - Guide de sécurité des webhooks
  - Conditions d'utilisation marchands

- **PCI DSS v4.0** : Référence internationale pour la sécurité des données de paiement (non obligatoire en CEMAC mais bonne pratique)

- **Recommandations GAFI/FATF** : Standards internationaux de lutte anti-blanchiment, adoptés par le GABAC

### Ressources Complémentaires

- Rapport annuel COBAC sur la supervision bancaire en zone CEMAC
- Guide GABAC sur les obligations de vigilance des prestataires de services de paiement
- Rapport de l'évaluation mutuelle du Cameroun par le GABAC
- Documentation Cloudflare Workers sur la gestion des secrets et le chiffrement
