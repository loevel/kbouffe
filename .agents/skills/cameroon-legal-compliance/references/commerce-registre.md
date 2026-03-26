# 📋 Immatriculation Commerciale au Cameroun — RCCM, NIF & OHADA

> Référence juridique pour le skill `cameroon-legal-compliance`.
> Concerne : l'enregistrement légal des entreprises commerciales au Cameroun, applicable à KBouffe (en tant que plateforme) et à ses restaurants partenaires.

---

## Résumé

Toute personne physique ou morale exerçant une activité commerciale au Cameroun **doit être immatriculée** au Registre du Commerce et du Crédit Mobilier (RCCM) et posséder un Numéro d'Identifiant Fiscal (NIF) délivré par la Direction Générale des Impôts (DGI). Ces obligations découlent de l'Acte Uniforme OHADA relatif au Droit Commercial Général (AUDCG) et du Code Général des Impôts du Cameroun.

**Pour KBouffe** : en tant que plateforme de commande alimentaire opérant commercialement, KBouffe doit elle-même être immatriculée (SARL, SA ou SAS) et posséder un NIF. De plus, KBouffe a une **obligation de diligence** envers ses utilisateurs et les autorités : elle ne doit pas faciliter l'activité commerciale d'entreprises non enregistrées.

**Pour les restaurants partenaires** : chaque restaurant souhaitant vendre via KBouffe doit fournir la preuve de son immatriculation au RCCM, son NIF, et sa patente en cours de validité. Sans ces documents, le restaurant opère dans l'illégalité et expose KBouffe à un risque de complicité.

---

## Textes de Loi Applicables

### 1. Acte Uniforme OHADA relatif au Droit Commercial Général (AUDCG)

- **Article 35** : Toute personne physique ayant la qualité de commerçant doit, dans le premier mois d'exploitation de son commerce, demander son immatriculation au RCCM.
- **Article 36** : Toute société commerciale ou groupement d'intérêt économique doit demander son immatriculation dans le mois suivant sa constitution.
- **Article 44** : L'immatriculation fait présumer la qualité de commerçant.
- **Article 60** : Toute modification des informations inscrites au RCCM doit faire l'objet d'une inscription modificative dans les 30 jours.

### 2. Code Général des Impôts du Cameroun (CGI)

- **Article 93 bis** : Toute personne physique ou morale assujettie à un impôt ou une taxe est tenue de s'inscrire auprès du service des impôts compétent et d'obtenir un NIF.
- **Livre des Procédures Fiscales, Art. L1** : Le NIF est obligatoire pour toute opération commerciale, bancaire ou administrative.

### 3. Loi n° 2010/001 du 13 avril 2010 portant promotion des PME

- Définit les catégories d'entreprises (TPE, PE, ME) et les formalités simplifiées via le CFCE.

### 4. Décret n° 2016/0284/PM fixant les conditions de création et de fonctionnement du CFCE

- Le **Centre de Formalités de Création d'Entreprises** (CFCE) est le guichet unique pour l'immatriculation au RCCM, l'obtention du NIF, la patente, et l'inscription à la CNPS (sécurité sociale).

### 5. Loi n° 2010/021 du 21 décembre 2010 régissant le commerce électronique au Cameroun

- **Article 7** : Tout commerçant en ligne doit afficher sur son site : sa raison sociale, son numéro RCCM, son NIF, son adresse et ses coordonnées.
- **Article 8** : Le prestataire de commerce électronique est tenu de vérifier la licéité des offres publiées sur sa plateforme.

---

## Obligations pour la Plateforme

### KBouffe en tant qu'entité commerciale

| Obligation | Détail | Document requis |
|---|---|---|
| Immatriculation au RCCM | En tant que SARL, SA ou SAS exerçant le commerce électronique | Extrait RCCM |
| Obtention du NIF | Inscription auprès de la DGI du Centre des Impôts compétent | Attestation NIF |
| Patente annuelle | Taxe professionnelle annuelle sur l'activité commerciale | Quittance de patente |
| Inscription CNPS | Si employés salariés au Cameroun | Attestation CNPS |
| Mentions légales | Affichage obligatoire sur le site (RCCM, NIF, siège social, capital) | Page mentions légales |
| Conformité e-commerce | Respect de la loi 2010/021 sur le commerce électronique | CGV, politique de confidentialité |

### Vérification des restaurants partenaires

KBouffe doit vérifier **avant activation** d'un restaurant sur la plateforme :

| Document | Obligatoire | Vérification |
|---|---|---|
| **RCCM** (extrait ou numéro) | ✅ Oui | Format : `RC/DLA/YYYY/X/NNNNN` (varie par greffe) |
| **NIF** (Numéro d'Identifiant Fiscal) | ✅ Oui | Format : `MNNNNNNNNNA` (M = lettre, N = chiffre, A = lettre clé) |
| **Patente** (quittance annuelle) | ✅ Oui | Vérifier la validité pour l'année en cours |
| **Pièce d'identité du gérant** | ✅ Oui | CNI ou passeport camerounais |
| **Statuts de la société** | ⚠️ Recommandé | Pour vérifier l'objet social (restauration) |
| **Plan de localisation** | ⚠️ Recommandé | Pour confirmer l'adresse physique |

---

## ❌ Exemple Non-Conforme

> **Situation actuelle de KBouffe** : l'endpoint d'enregistrement de restaurant ne collecte ni ne vérifie aucun document légal. Le restaurant est créé avec `is_verified: false` mais peut être activé sans jamais soumettre de RCCM ou NIF.

### API — Enregistrement sans vérification (actuel)

```typescript
// ❌ NON-CONFORME — apps/web-dashboard/src/app/api/register-restaurant/route.ts
// Aucun document légal n'est collecté ni vérifié

const { error: restaurantError } = await supabase
  .from("restaurants")
  .insert({
    id: restaurantId,
    owner_id: userId,
    name: restaurantName.trim(),
    slug,
    address: address?.trim() || "À définir",
    city: city?.trim() || "Douala",
    cuisine_type: cuisineType || "african",
    is_published: true,    // ❌ Publié immédiatement sans vérification
    is_verified: false,    // ❌ Flag existe mais jamais vérifié automatiquement
    // ❌ Aucun champ RCCM, NIF, patente
    // ❌ Aucun workflow de soumission de documents
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
```

### Problèmes identifiés

1. **`is_published: true`** dès la création — le restaurant est visible publiquement sans aucune vérification légale.
2. **Aucun champ de document légal** collecté lors de l'onboarding (RCCM, NIF, patente).
3. **Pas de workflow de vérification** — `is_verified` peut rester `false` indéfiniment sans impact sur la visibilité.
4. **Risque juridique** — KBouffe facilite l'activité commerciale d'entités potentiellement non enregistrées.

---

## ✅ Exemple Conforme

### Migration SQL — Ajout des champs de conformité commerciale

```sql
-- Migration: add_commercial_registration_fields
-- Les champs kyc_rccm, kyc_niu existent déjà dans la table restaurants.
-- Cette migration ajoute les champs manquants pour une conformité complète.

ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS kyc_patente_number TEXT,
  ADD COLUMN IF NOT EXISTS kyc_patente_url TEXT,
  ADD COLUMN IF NOT EXISTS kyc_patente_expiry DATE,
  ADD COLUMN IF NOT EXISTS kyc_statuts_url TEXT,
  ADD COLUMN IF NOT EXISTS kyc_manager_name TEXT,
  ADD COLUMN IF NOT EXISTS kyc_manager_id_type TEXT CHECK (kyc_manager_id_type IN ('cni', 'passport')),
  ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS kyc_verified_by UUID REFERENCES public.users(id);

-- Index pour les recherches admin par statut KYC
CREATE INDEX IF NOT EXISTS idx_restaurants_kyc_status ON public.restaurants(kyc_status);

-- Table d'audit pour tracer l'historique des vérifications
CREATE TABLE IF NOT EXISTS public.restaurant_kyc_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN (
    'documents_submitted', 'under_review', 'approved',
    'rejected', 'documents_requested', 'suspended'
  )),
  performed_by UUID REFERENCES public.users(id),
  reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kyc_audit_restaurant
  ON public.restaurant_kyc_audit(restaurant_id);
```

### API — Enregistrement avec collecte de documents

```typescript
// ✅ CONFORME — Collecte obligatoire des documents légaux à l'onboarding

import { Hono } from "hono";

const registerRestaurant = new Hono();

// Validation des formats de documents camerounais
function validateRCCM(rccm: string): boolean {
  // Format typique : RC/DLA/2024/B/12345 (varie par greffe)
  return /^RC\/[A-Z]{2,5}\/\d{4}\/[A-Z]\/\d{1,6}$/.test(rccm);
}

function validateNIF(nif: string): boolean {
  // Format NIF camerounais : lettre + 9 chiffres + lettre clé
  return /^[A-Z]\d{9}[A-Z]$/.test(nif);
}

registerRestaurant.post("/api/register-restaurant", async (c) => {
  const body = await c.req.json();

  const {
    restaurantName,
    address,
    city,
    phone,
    // Documents légaux obligatoires
    rccmNumber,
    nifNumber,
    patenteNumber,
    patenteExpiry,
    managerName,
    managerIdType,
  } = body;

  // Validation des documents obligatoires
  const errors: string[] = [];

  if (!rccmNumber || !validateRCCM(rccmNumber)) {
    errors.push("Le numéro RCCM est obligatoire et doit être au format valide (ex: RC/DLA/2024/B/12345)");
  }

  if (!nifNumber || !validateNIF(nifNumber)) {
    errors.push("Le NIF est obligatoire et doit être au format valide (ex: M012345678A)");
  }

  if (!patenteNumber) {
    errors.push("Le numéro de patente est obligatoire");
  }

  if (!managerName || !managerIdType) {
    errors.push("L'identité du gérant est obligatoire (nom + type de pièce d'identité)");
  }

  if (errors.length > 0) {
    return c.json({ error: "Documents légaux incomplets", details: errors }, 400);
  }

  // Vérifier l'unicité du RCCM et du NIF (pas de doublon)
  const { data: existing } = await supabase
    .from("restaurants")
    .select("id, name")
    .or(`kyc_rccm.eq.${rccmNumber},kyc_niu.eq.${nifNumber}`)
    .limit(1);

  if (existing && existing.length > 0) {
    return c.json({
      error: "Un restaurant avec ce RCCM ou ce NIF est déjà enregistré sur la plateforme"
    }, 409);
  }

  // Création du restaurant avec documents légaux
  const restaurantId = crypto.randomUUID();
  const { error } = await supabase
    .from("restaurants")
    .insert({
      id: restaurantId,
      owner_id: userId,
      name: restaurantName.trim(),
      slug: generateSlug(restaurantName),
      address: address?.trim(),
      city: city?.trim() || "Douala",
      phone,
      is_published: false,       // ✅ NON publié tant que non vérifié
      is_verified: false,         // ✅ Vérification admin requise
      kyc_status: "pending",      // ✅ Statut de vérification initialisé
      kyc_rccm: rccmNumber,       // ✅ RCCM stocké
      kyc_niu: nifNumber,         // ✅ NIF stocké
      kyc_patente_number: patenteNumber,
      kyc_patente_expiry: patenteExpiry,
      kyc_manager_name: managerName,
      kyc_manager_id_type: managerIdType,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

  if (error) {
    return c.json({ error: "Erreur lors de la création du restaurant" }, 500);
  }

  // Créer l'entrée d'audit
  await supabase.from("restaurant_kyc_audit").insert({
    restaurant_id: restaurantId,
    action: "documents_submitted",
    performed_by: userId,
    metadata: {
      rccm_provided: true,
      nif_provided: true,
      patente_provided: true,
    }
  });

  return c.json({
    success: true,
    restaurantId,
    message: "Restaurant créé. Vos documents sont en cours de vérification. Vous recevrez une notification une fois la vérification terminée.",
    kyc_status: "pending"
  }, 201);
});
```

### API — Vérification admin des documents

```typescript
// ✅ CONFORME — Endpoint admin pour valider/rejeter les documents

adminRoutes.patch("/api/admin/restaurants/:id/kyc", async (c) => {
  const restaurantId = c.req.param("id");
  const { action, reason } = await c.req.json();
  const adminId = c.get("userId");

  if (!["approved", "rejected", "documents_requested"].includes(action)) {
    return c.json({ error: "Action invalide" }, 400);
  }

  if (action === "rejected" && !reason) {
    return c.json({ error: "Un motif de rejet est obligatoire" }, 400);
  }

  const updates: Record<string, unknown> = {
    kyc_status: action,
    updated_at: new Date().toISOString(),
  };

  if (action === "approved") {
    updates.is_verified = true;
    updates.is_published = true;  // Publier après vérification
    updates.kyc_verified_at = new Date().toISOString();
    updates.kyc_verified_by = adminId;
  }

  if (action === "rejected") {
    updates.kyc_rejection_reason = reason;
    updates.is_verified = false;
    updates.is_published = false;
  }

  const { error } = await supabase
    .from("restaurants")
    .update(updates)
    .eq("id", restaurantId);

  if (error) {
    return c.json({ error: "Erreur lors de la mise à jour" }, 500);
  }

  // Audit trail
  await supabase.from("restaurant_kyc_audit").insert({
    restaurant_id: restaurantId,
    action,
    performed_by: adminId,
    reason: reason || null,
  });

  // TODO: Envoyer une notification SMS/email au propriétaire du restaurant

  return c.json({
    success: true,
    message: action === "approved"
      ? "Restaurant vérifié et publié avec succès"
      : `Documents ${action === "rejected" ? "rejetés" : "demandés"} — motif : ${reason}`
  });
});
```

### Hook React — Soumission de documents KYC

```typescript
// ✅ CONFORME — Hook pour la soumission de documents par le marchand

import { authFetch } from "@kbouffe/module-core";
import { useState } from "react";

interface KYCDocuments {
  rccmNumber: string;
  nifNumber: string;
  patenteNumber: string;
  patenteExpiry: string;
  managerName: string;
  managerIdType: "cni" | "passport";
  rccmFile: File | null;
  nifFile: File | null;
  patenteFile: File | null;
  managerIdFile: File | null;
}

export function useKYCSubmission(restaurantId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitDocuments = async (documents: KYCDocuments) => {
    setLoading(true);
    setError(null);

    try {
      // 1. Upload des fichiers vers R2
      const fileUploads = await Promise.all([
        documents.rccmFile && uploadDocument(documents.rccmFile, "kyc/rccm"),
        documents.nifFile && uploadDocument(documents.nifFile, "kyc/nif"),
        documents.patenteFile && uploadDocument(documents.patenteFile, "kyc/patente"),
        documents.managerIdFile && uploadDocument(documents.managerIdFile, "kyc/id"),
      ]);

      // 2. Mettre à jour les informations KYC du restaurant
      const response = await authFetch(`/api/restaurants/${restaurantId}/kyc`, {
        method: "POST",
        body: JSON.stringify({
          kyc_rccm: documents.rccmNumber,
          kyc_niu: documents.nifNumber,
          kyc_patente_number: documents.patenteNumber,
          kyc_patente_expiry: documents.patenteExpiry,
          kyc_manager_name: documents.managerName,
          kyc_manager_id_type: documents.managerIdType,
          kyc_rccm_url: fileUploads[0] || null,
          kyc_niu_url: fileUploads[1] || null,
          kyc_patente_url: fileUploads[2] || null,
          kyc_id_url: fileUploads[3] || null,
          kyc_status: "documents_submitted",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de la soumission");
      }

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  return { submitDocuments, loading, error };
}
```

---

## Sanctions

### Pour exercice de commerce sans immatriculation au RCCM

| Infraction | Base légale | Sanction |
|---|---|---|
| Exercice du commerce sans RCCM | AUDCG, Art. 70 | Amende de **100 000 à 1 000 000 FCFA** |
| Déclarations fausses ou incomplètes au RCCM | AUDCG, Art. 70 | Amende de **100 000 à 500 000 FCFA** + radiation possible |
| Non-mise à jour du RCCM sous 30 jours | AUDCG, Art. 60-61 | Amende + perte de la présomption de commerçant |
| Exercice du commerce sans NIF | CGI, Art. 93 bis | **Pénalités fiscales** de 10% à 100% du montant d'impôt éludé |
| Non-paiement de la patente | CGI, Titre III | **Fermeture administrative** de l'établissement + pénalités de 10% par mois de retard |

### Pour KBouffe en tant que plateforme

| Risque | Description |
|---|---|
| **Complicité d'exercice illégal du commerce** | Faciliter la vente par des commerçants non immatriculés |
| **Non-conformité e-commerce** | Non-respect de la loi 2010/021 (mentions légales, vérification des vendeurs) |
| **Responsabilité solidaire fiscale** | En cas de non-déclaration des revenus des partenaires |
| **Fermeture administrative** | Décision préfectorale si les infractions sont graves ou répétées |

---

## Recommandations Techniques pour KBouffe

### 1. Bloquer la publication sans vérification

```typescript
// Dans le middleware de visibilité publique des restaurants
// packages/modules/core/src/api/stores.ts

function isRestaurantPublishable(restaurant: {
  kyc_status: string | null;
  is_verified: boolean | null;
  kyc_rccm: string | null;
  kyc_niu: string | null;
}): boolean {
  return (
    restaurant.kyc_status === "approved" &&
    restaurant.is_verified === true &&
    !!restaurant.kyc_rccm &&
    !!restaurant.kyc_niu
  );
}

// Utiliser dans les queries publiques :
// .eq("is_verified", true).eq("kyc_status", "approved")
```

### 2. Ajouter des contraintes SQL

```sql
-- Empêcher la publication sans vérification KYC
ALTER TABLE public.restaurants
  ADD CONSTRAINT chk_publish_requires_kyc
  CHECK (
    is_published = false
    OR (kyc_status = 'approved' AND is_verified = true)
  );

-- Assurer l'unicité du RCCM et du NIF
CREATE UNIQUE INDEX IF NOT EXISTS idx_restaurants_kyc_rccm_unique
  ON public.restaurants(kyc_rccm) WHERE kyc_rccm IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_restaurants_kyc_niu_unique
  ON public.restaurants(kyc_niu) WHERE kyc_niu IS NOT NULL;
```

### 3. Workflow de vérification KYC

```
┌──────────────┐     ┌─────────────────────┐     ┌──────────────────┐
│   pending     │────▶│ documents_submitted  │────▶│   under_review   │
│ (inscription) │     │ (docs envoyés)       │     │ (admin vérifie)  │
└──────────────┘     └─────────────────────┘     └────────┬─────────┘
                                                          │
                              ┌────────────────────┐      │
                              │ documents_requested │◀─────┤
                              │ (docs incomplets)   │      │
                              └────────────────────┘      │
                                                    ┌─────▼─────┐
                                              ┌─────┤           ├─────┐
                                              │     └───────────┘     │
                                         ┌────▼────┐           ┌─────▼────┐
                                         │approved │           │ rejected │
                                         │(vérifié)│           │ (refusé) │
                                         └─────────┘           └──────────┘
```

### 4. Vérification périodique de la patente

```typescript
// Cron job (Cloudflare Workers Cron Trigger) — vérification annuelle
export default {
  async scheduled(event: ScheduledEvent, env: Env) {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    // Trouver les restaurants dont la patente expire dans 30 jours
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const { data: expiring } = await supabase
      .from("restaurants")
      .select("id, name, owner_id, kyc_patente_expiry")
      .lte("kyc_patente_expiry", thirtyDaysFromNow.toISOString().split("T")[0])
      .eq("is_verified", true);

    for (const restaurant of expiring || []) {
      // Notifier le propriétaire
      await env.SMS_QUEUE.send({
        type: "patente_expiry_warning",
        restaurantId: restaurant.id,
        ownerId: restaurant.owner_id,
        message: `Votre patente pour "${restaurant.name}" expire bientôt. Veuillez la renouveler pour maintenir votre présence sur KBouffe.`,
      });
    }

    // Suspendre les restaurants dont la patente est expirée
    const today = new Date().toISOString().split("T")[0];
    await supabase
      .from("restaurants")
      .update({
        is_published: false,
        kyc_status: "documents_requested",
        kyc_rejection_reason: "Patente expirée — veuillez soumettre la patente renouvelée",
        updated_at: new Date().toISOString(),
      })
      .lt("kyc_patente_expiry", today)
      .eq("is_verified", true);
  },
};
```

### 5. Page de mentions légales obligatoire

```typescript
// apps/web-dashboard/src/app/mentions-legales/page.tsx
// Obligatoire selon la loi 2010/021 sur le commerce électronique

export default function MentionsLegales() {
  return (
    <main>
      <h1>Mentions Légales</h1>
      <section>
        <h2>Éditeur du site</h2>
        <p>Raison sociale : KBouffe [FORME JURIDIQUE]</p>
        <p>RCCM : [NUMÉRO RCCM]</p>
        <p>NIF : [NUMÉRO NIF]</p>
        <p>Siège social : [ADRESSE], Douala, Cameroun</p>
        <p>Capital social : [MONTANT] FCFA</p>
        <p>Directeur de la publication : [NOM DU GÉRANT]</p>
        <p>Téléphone : [NUMÉRO]</p>
        <p>Email : contact@kbouffe.com</p>
      </section>
      <section>
        <h2>Hébergement</h2>
        <p>Cloudflare, Inc. — 101 Townsend St, San Francisco, CA 94107, USA</p>
      </section>
    </main>
  );
}
```

---

## Références

| Source | Lien / Référence |
|---|---|
| Acte Uniforme OHADA – Droit Commercial Général (AUDCG) | Adopté le 15 décembre 2010, entré en vigueur le 15 mai 2011 |
| Code Général des Impôts du Cameroun | Direction Générale des Impôts (DGI) — www.impots.cm |
| Loi n° 2010/021 du 21 décembre 2010 | Commerce électronique au Cameroun |
| Loi n° 2010/001 du 13 avril 2010 | Promotion des PME au Cameroun |
| Décret n° 2016/0284/PM | Création et fonctionnement du CFCE |
| OHADA – Organisation pour l'Harmonisation en Afrique du Droit des Affaires | www.ohada.org |
| ANOR – Agence des Normes et de la Qualité | www.anor.cm |
| DGI – Direction Générale des Impôts | www.impots.cm |
| CFCE – Centre de Formalités de Création d'Entreprises | Présent à Douala, Yaoundé, et les chefs-lieux de région |

---

> **Dernière mise à jour** : Juillet 2025
> **Applicable à** : KBouffe v1.x — Plateforme de commande alimentaire au Cameroun
