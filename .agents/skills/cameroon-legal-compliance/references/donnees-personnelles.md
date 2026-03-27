# Protection des Données Personnelles au Cameroun

## Résumé

Le Cameroun encadre la protection des données personnelles principalement par la **Loi n°2010/012 du 21 décembre 2010 relative à la Cybersécurité et la Cybercriminalité au Cameroun**. Cette loi impose des obligations strictes à tout responsable de traitement de données personnelles opérant sur le territoire camerounais, y compris les plateformes numériques comme KBouffe.

L'autorité de régulation est l'**ANTIC** (Agence Nationale des Technologies de l'Information et de la Communication), créée par le décret n°2002/092 du 8 avril 2002 et réorganisée par le décret n°2012/180 du 10 avril 2012. L'ANTIC est chargée de la régulation, du contrôle et du suivi des activités liées à la sécurité des systèmes d'information et des réseaux de communications électroniques, ainsi que de la certification électronique.

**KBouffe collecte des données personnelles sensibles** : nom complet, numéro de téléphone (MSISDN), adresse email, avatar, solde du portefeuille, adresses de livraison, historique de commandes, et informations de paiement MTN MoMo. Ces données font l'objet d'une protection renforcée, en particulier le MSISDN (donnée d'identification directe) et les données financières.

**État actuel de conformité KBouffe** :
- ✅ Authentification sécurisée via Supabase Auth (JWT)
- ✅ Politiques RLS (Row Level Security) en place
- ✅ Endpoint de suppression de compte existant
- ❌ Aucun mécanisme de consentement explicite
- ❌ Aucune fonctionnalité d'export de données
- ❌ Aucun bandeau de consentement cookies
- ❌ Aucune politique de confidentialité implémentée
- ❌ Aucune politique de rétention des données
- ❌ Aucune déclaration préalable à l'ANTIC

---

## Textes de Loi Applicables

### 1. Loi n°2010/012 du 21 décembre 2010

**Titre complet** : Loi n°2010/012 du 21 décembre 2010 relative à la Cybersécurité et la Cybercriminalité au Cameroun.

**Dispositions clés relatives aux données personnelles** :

| Article | Contenu | Impact KBouffe |
|---------|---------|----------------|
| Art. 41 | Définition des données personnelles : « toute information relative à une personne physique identifiée ou identifiable directement ou indirectement » | Le MSISDN, l'email, le nom, l'adresse sont des données personnelles |
| Art. 42 | Obligation de déclaration préalable du traitement auprès de l'ANTIC | KBouffe doit déclarer ses traitements avant mise en production |
| Art. 43 | Consentement explicite, libre, éclairé et préalable de la personne concernée | L'inscription KBouffe doit recueillir un consentement granulaire |
| Art. 44 | Finalité déterminée, explicite et légitime du traitement | Chaque collecte doit être liée à une finalité précise |
| Art. 45 | Droit d'accès de la personne concernée à ses données | KBouffe doit permettre la consultation des données collectées |
| Art. 46 | Droit de rectification et de suppression | L'endpoint de suppression existe mais le droit de rectification est incomplet |
| Art. 47 | Obligation de sécurité et de confidentialité | Les données doivent être protégées contre l'accès non autorisé |
| Art. 48 | Durée de conservation proportionnée à la finalité | Aucune politique de rétention n'est en place |
| Art. 49 | Transfert de données vers un pays tiers | Supabase héberge les données hors du Cameroun — problème potentiel |
| Art. 74 | Sanctions pénales pour traitement illicite | 1 à 2 ans d'emprisonnement, 1 000 000 à 5 000 000 FCFA d'amende |

### 2. Loi n°2010/013 du 21 décembre 2010

**Titre complet** : Loi n°2010/013 du 21 décembre 2010 régissant les Communications Électroniques au Cameroun.

Renforce les obligations en matière de confidentialité des communications et de protection des données des abonnés (incluant le MSISDN).

### 3. Loi n°2010/021 du 21 décembre 2010

**Titre complet** : Loi n°2010/021 du 21 décembre 2010 régissant le Commerce Électronique au Cameroun.

| Article | Contenu | Impact KBouffe |
|---------|---------|----------------|
| Art. 30-35 | Obligations d'information du consommateur en ligne | Pages d'information obligatoires (CGU, mentions légales) |
| Art. 38 | Droit de rétractation (7 jours pour les biens, hors denrées périssables) | KBouffe vend de la nourriture — exemption possible mais doit être mentionnée |
| Art. 42 | Protection des données dans le commerce électronique | Politique de confidentialité obligatoire |

### 4. Règlement n°21/08-UEAC-133-CM-18 (CEMAC)

Cadre communautaire CEMAC sur les transactions électroniques, applicable au Cameroun en tant qu'État membre. Renforce les obligations de protection des données dans les transactions électroniques transfrontalières au sein de la zone CEMAC.

### 5. Convention de l'Union Africaine sur la Cybersécurité et la Protection des Données Personnelles (Convention de Malabo, 2014)

Signée par le Cameroun, cette convention établit un cadre continental pour la protection des données personnelles. Bien que non encore ratifiée par le Cameroun, elle constitue une référence normative importante et influence l'interprétation des textes nationaux.

---

## Obligations pour la Plateforme

### 1. Déclaration Préalable à l'ANTIC (Art. 42)

Avant tout traitement de données personnelles, KBouffe **doit** effectuer une déclaration auprès de l'ANTIC précisant :
- L'identité du responsable du traitement (KBouffe / entité juridique)
- La finalité du traitement (livraison de repas, paiements, marketing)
- Les catégories de données collectées
- Les destinataires des données
- La durée de conservation envisagée
- Les mesures de sécurité mises en œuvre
- Les transferts de données hors du territoire national

**Procédure** : Formulaire de déclaration disponible auprès de l'ANTIC. Délai de traitement : environ 30 jours. Le récépissé de déclaration doit être conservé et son numéro affiché dans la politique de confidentialité.

### 2. Consentement Explicite et Éclairé (Art. 43)

Le consentement doit être :
- **Libre** : pas de case pré-cochée, pas de consentement conditionné à l'utilisation du service pour les finalités non essentielles
- **Éclairé** : information claire et compréhensible en français sur les données collectées et leur utilisation
- **Spécifique** : un consentement distinct pour chaque finalité (exécution du service vs marketing vs partage avec des tiers)
- **Préalable** : recueilli avant la collecte effective des données
- **Documenté** : preuve de consentement horodatée et conservée

### 3. Information de la Personne Concernée (Art. 43-44)

Au moment de la collecte, KBouffe doit informer l'utilisateur de :
- L'identité du responsable du traitement
- Les finalités du traitement
- Les catégories de données collectées
- Les destinataires (Supabase, MTN MoMo, prestataires de livraison)
- La durée de conservation
- Les droits de la personne (accès, rectification, suppression, opposition)
- L'existence de transferts internationaux de données
- Le caractère obligatoire ou facultatif des réponses

### 4. Droits des Personnes Concernées (Art. 45-46)

| Droit | Obligation KBouffe | État actuel |
|-------|-------------------|-------------|
| Accès | Fournir une copie de toutes les données collectées sous 30 jours | ❌ Non implémenté |
| Rectification | Permettre la modification des données inexactes | ⚠️ Partiel (profil modifiable mais pas toutes les données) |
| Suppression | Supprimer les données sur demande | ⚠️ Endpoint existe mais suppression complète non vérifiée |
| Opposition | Permettre de s'opposer au traitement pour certaines finalités (marketing) | ❌ Non implémenté |
| Portabilité | Exporter les données dans un format structuré et lisible | ❌ Non implémenté |

### 5. Sécurité et Confidentialité (Art. 47)

Obligation de mettre en œuvre des mesures techniques et organisationnelles appropriées :
- Chiffrement des données sensibles (MSISDN, données financières)
- Contrôle d'accès basé sur les rôles (RBAC — partiellement en place)
- Journalisation des accès aux données personnelles
- Pseudonymisation ou anonymisation quand possible
- Tests de sécurité réguliers (pentests)
- Formation du personnel au traitement des données

### 6. Durée de Conservation (Art. 48)

Les données ne peuvent être conservées au-delà de la durée nécessaire à la finalité du traitement :

| Type de données | Durée recommandée | Justification |
|----------------|-------------------|---------------|
| Données de compte actif | Durée de la relation commerciale | Exécution du contrat |
| Données de compte supprimé | 12 mois après suppression | Obligations légales (fiscalité, litiges) |
| Historique de commandes | 5 ans | Obligations comptables et fiscales (Code Général des Impôts) |
| Données de paiement (MSISDN, références) | 5 ans | Obligations anti-blanchiment (GABAC) |
| Logs de connexion | 12 mois | Obligations légales (Loi n°2010/012, Art. 47) |
| Données de marketing (consentement) | Durée du consentement + 3 ans | Preuve de consentement |
| Adresses de livraison | Durée de la relation + 6 mois | Exécution du service |

### 7. Transferts Internationaux de Données (Art. 49)

KBouffe utilise **Supabase** dont les serveurs peuvent être situés hors du Cameroun et de la zone CEMAC. L'article 49 de la loi impose que le transfert de données personnelles vers un pays tiers ne puisse avoir lieu que si ce pays assure un niveau de protection adéquat.

**Actions requises** :
- Identifier la localisation exacte des serveurs Supabase utilisés
- Évaluer le niveau de protection du pays d'hébergement
- Mettre en place des clauses contractuelles types avec Supabase
- Informer les utilisateurs du transfert dans la politique de confidentialité
- Envisager le chiffrement côté client pour les données les plus sensibles

### 8. Notification des Violations de Données

En cas de violation de données (fuite, accès non autorisé, perte), KBouffe doit :
- Notifier l'ANTIC dans les meilleurs délais (72h recommandées par analogie avec les standards internationaux)
- Informer les personnes concernées si la violation présente un risque élevé
- Documenter l'incident (nature, étendue, mesures correctives)
- Mettre en œuvre des mesures correctives immédiates

---

## ❌ Exemple Non-Conforme

### Inscription utilisateur actuelle — sans consentement ni information

```typescript
// packages/modules/core/src/api/auth-routes.ts (ACTUEL — NON CONFORME)
import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";

const authRoutes = new Hono();

// ❌ Aucune vérification de consentement
// ❌ Aucune information sur le traitement des données
// ❌ Aucune trace de consentement en base
// ❌ Le MSISDN est stocké en clair dans les logs
authRoutes.post("/register", async (c) => {
  const { phone, password, full_name, email } = await c.req.json();

  const supabase = createClient(
    c.env.SUPABASE_URL,
    c.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // ❌ Données collectées sans consentement préalable
  const { data: authData, error: authError } = await supabase.auth.signUp({
    phone,
    password,
    options: {
      data: { full_name, email },
    },
  });

  if (authError) {
    // ❌ Log du numéro de téléphone en clair
    console.log(`Registration failed for ${phone}: ${authError.message}`);
    return c.json({ error: "Erreur lors de l'inscription" }, 400);
  }

  // ❌ Insertion du profil sans consentement documenté
  const { error: profileError } = await supabase.from("users").insert({
    id: authData.user!.id,
    phone,
    full_name,
    email,
    wallet_balance: 0,
  });

  if (profileError) {
    console.error(`Profile creation failed for ${phone}`);
    return c.json({ error: "Erreur lors de la création du profil" }, 500);
  }

  // ❌ Aucune information sur les droits de l'utilisateur
  // ❌ Aucune référence à la politique de confidentialité
  return c.json({
    success: true,
    user: authData.user,
    message: "Inscription réussie",
  });
});

// ❌ Aucun endpoint d'export de données (droit d'accès)
// ❌ Aucun endpoint de consultation des données collectées
// ❌ La suppression de compte ne vérifie pas la suppression complète

export { authRoutes };
```

### Problèmes identifiés :

1. **Absence de consentement** : l'utilisateur n'est jamais informé du traitement de ses données ni invité à donner son consentement
2. **Pas de granularité** : aucune distinction entre consentement pour le service de base et consentement marketing
3. **MSISDN en clair dans les logs** : violation de l'obligation de confidentialité
4. **Aucune traçabilité** : impossible de prouver que l'utilisateur a consenti
5. **Droits non implémentés** : pas d'accès, pas d'export, pas de rectification complète

---

## ✅ Exemple Conforme

### Inscription utilisateur conforme — avec consentement, information et traçabilité

```typescript
// packages/modules/core/src/api/auth-routes.ts (CONFORME)
import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { maskMsisdn } from "../lib/privacy-utils";

const authRoutes = new Hono();

// Types pour le consentement
interface ConsentPayload {
  /** Consentement pour le traitement nécessaire au service (obligatoire) */
  service_consent: boolean;
  /** Consentement pour les communications marketing (facultatif) */
  marketing_consent: boolean;
  /** Consentement pour le partage avec des tiers (facultatif) */
  third_party_consent: boolean;
  /** Version de la politique de confidentialité acceptée */
  privacy_policy_version: string;
}

interface RegisterPayload {
  phone: string;
  password: string;
  full_name: string;
  email?: string;
  consent: ConsentPayload;
}

// ✅ Inscription avec consentement explicite
authRoutes.post("/register", async (c) => {
  const body: RegisterPayload = await c.req.json();
  const { phone, password, full_name, email, consent } = body;

  // ✅ Vérification du consentement obligatoire au service
  if (!consent?.service_consent) {
    return c.json(
      {
        error:
          "Le consentement au traitement des données est obligatoire pour utiliser KBouffe.",
        required_consents: ["service_consent"],
        privacy_policy_url: "https://kbouffe.com/politique-de-confidentialite",
      },
      422
    );
  }

  // ✅ Vérification de la version de la politique de confidentialité
  if (!consent.privacy_policy_version) {
    return c.json(
      {
        error:
          "Vous devez accepter la politique de confidentialité en vigueur.",
        current_version: "2024-01-v1",
        privacy_policy_url: "https://kbouffe.com/politique-de-confidentialite",
      },
      422
    );
  }

  const supabase = createClient(
    c.env.SUPABASE_URL,
    c.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: authData, error: authError } = await supabase.auth.signUp({
    phone,
    password,
    options: {
      data: { full_name, email },
    },
  });

  if (authError) {
    // ✅ MSISDN masqué dans les logs
    console.error(
      `Registration failed for ${maskMsisdn(phone)}: ${authError.message}`
    );
    return c.json({ error: "Erreur lors de l'inscription" }, 400);
  }

  const userId = authData.user!.id;
  const now = new Date().toISOString();

  // ✅ Création du profil utilisateur
  const { error: profileError } = await supabase.from("users").insert({
    id: userId,
    phone,
    full_name,
    email,
    wallet_balance: 0,
  });

  if (profileError) {
    console.error(
      `Profile creation failed for user ${userId.slice(0, 8)}...`
    );
    return c.json({ error: "Erreur lors de la création du profil" }, 500);
  }

  // ✅ Enregistrement horodaté du consentement avec métadonnées
  const consentRecords = [
    {
      user_id: userId,
      consent_type: "service",
      granted: consent.service_consent,
      privacy_policy_version: consent.privacy_policy_version,
      ip_address: c.req.header("cf-connecting-ip") || "unknown",
      user_agent: c.req.header("user-agent") || "unknown",
      granted_at: now,
    },
    {
      user_id: userId,
      consent_type: "marketing",
      granted: consent.marketing_consent ?? false,
      privacy_policy_version: consent.privacy_policy_version,
      ip_address: c.req.header("cf-connecting-ip") || "unknown",
      user_agent: c.req.header("user-agent") || "unknown",
      granted_at: now,
    },
    {
      user_id: userId,
      consent_type: "third_party",
      granted: consent.third_party_consent ?? false,
      privacy_policy_version: consent.privacy_policy_version,
      ip_address: c.req.header("cf-connecting-ip") || "unknown",
      user_agent: c.req.header("user-agent") || "unknown",
      granted_at: now,
    },
  ];

  const { error: consentError } = await supabase
    .from("user_consents")
    .insert(consentRecords);

  if (consentError) {
    console.error(`Consent recording failed for user ${userId.slice(0, 8)}...`);
    // ✅ Ne pas bloquer l'inscription mais alerter
  }

  // ✅ Journalisation de l'événement (audit trail)
  await supabase.from("audit_logs").insert({
    user_id: userId,
    action: "user_registered",
    details: {
      consents_granted: {
        service: consent.service_consent,
        marketing: consent.marketing_consent ?? false,
        third_party: consent.third_party_consent ?? false,
      },
      privacy_policy_version: consent.privacy_policy_version,
    },
    created_at: now,
  });

  // ✅ Réponse avec information sur les droits
  return c.json({
    success: true,
    user: {
      id: userId,
      phone: maskMsisdn(phone),
      full_name,
    },
    message: "Inscription réussie. Bienvenue sur KBouffe !",
    data_rights: {
      access: "Vous pouvez consulter vos données dans Paramètres > Mes données",
      export: "Vous pouvez exporter vos données dans Paramètres > Exporter mes données",
      deletion: "Vous pouvez supprimer votre compte dans Paramètres > Supprimer mon compte",
      modification: "Vous pouvez modifier vos informations dans Paramètres > Mon profil",
      contact: "Pour toute question : privacy@kbouffe.com",
    },
    privacy_policy_url: "https://kbouffe.com/politique-de-confidentialite",
  });
});

// ✅ Endpoint d'export de données (droit d'accès — Art. 45)
authRoutes.get("/my-data/export", async (c) => {
  const userId = c.get("userId");
  const supabase = c.get("supabase");

  const [
    { data: profile },
    { data: orders },
    { data: addresses },
    { data: consents },
    { data: payments },
    { data: favorites },
  ] = await Promise.all([
    supabase.from("users").select("*").eq("id", userId).single(),
    supabase
      .from("orders")
      .select("id, status, total, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase.from("addresses").select("*").eq("user_id", userId),
    supabase.from("user_consents").select("*").eq("user_id", userId),
    supabase
      .from("payment_transactions")
      .select("id, amount, status, provider, created_at")
      .eq("user_id", userId),
    supabase
      .from("restaurant_favorites")
      .select("restaurant_id, created_at")
      .eq("user_id", userId),
  ]);

  const exportData = {
    export_date: new Date().toISOString(),
    export_format: "JSON",
    legal_basis:
      "Droit d'accès — Art. 45, Loi n°2010/012 du 21 décembre 2010",
    data: {
      profile: {
        ...profile,
        phone: profile?.phone ? maskMsisdn(profile.phone) : null,
      },
      orders,
      addresses,
      consents,
      payments,
      favorites,
    },
  };

  // ✅ Audit de l'export
  await supabase.from("audit_logs").insert({
    user_id: userId,
    action: "data_export_requested",
    details: { sections: Object.keys(exportData.data) },
    created_at: new Date().toISOString(),
  });

  return c.json(exportData);
});

// ✅ Gestion du consentement (mise à jour)
authRoutes.put("/my-data/consent", async (c) => {
  const userId = c.get("userId");
  const supabase = c.get("supabase");
  const { consent_type, granted } = await c.req.json();

  const validTypes = ["marketing", "third_party"];
  if (!validTypes.includes(consent_type)) {
    return c.json(
      {
        error:
          "Type de consentement invalide. Le consentement au service ne peut pas être retiré sans supprimer le compte.",
      },
      400
    );
  }

  // ✅ On ne supprime jamais l'historique — on ajoute une nouvelle entrée
  const { error } = await supabase.from("user_consents").insert({
    user_id: userId,
    consent_type,
    granted,
    privacy_policy_version: "2024-01-v1",
    ip_address: c.req.header("cf-connecting-ip") || "unknown",
    user_agent: c.req.header("user-agent") || "unknown",
    granted_at: new Date().toISOString(),
  });

  if (error) {
    return c.json(
      { error: "Erreur lors de la mise à jour du consentement" },
      500
    );
  }

  await supabase.from("audit_logs").insert({
    user_id: userId,
    action: "consent_updated",
    details: { consent_type, granted },
    created_at: new Date().toISOString(),
  });

  return c.json({
    success: true,
    message: granted
      ? `Consentement "${consent_type}" accordé.`
      : `Consentement "${consent_type}" retiré.`,
  });
});

export { authRoutes };
```

### Utilitaires de confidentialité

```typescript
// packages/modules/core/src/lib/privacy-utils.ts

/**
 * Masque un MSISDN pour les logs et affichages non sensibles.
 * Exemple : +237691234567 → +237691***567
 */
export function maskMsisdn(msisdn: string): string {
  if (!msisdn || msisdn.length < 8) return "***";
  const visible = 6;
  const suffix = 3;
  return (
    msisdn.slice(0, visible) +
    "***" +
    msisdn.slice(msisdn.length - suffix)
  );
}

/**
 * Masque une adresse email pour les logs.
 * Exemple : john.doe@gmail.com → jo***@gmail.com
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "***";
  const [local, domain] = email.split("@");
  const visibleChars = Math.min(2, local.length);
  return `${local.slice(0, visibleChars)}***@${domain}`;
}

/**
 * Nettoie un objet de ses données personnelles pour la journalisation.
 */
export function sanitizeForLogs(
  data: Record<string, unknown>
): Record<string, unknown> {
  const sensitiveKeys = [
    "phone",
    "msisdn",
    "email",
    "full_name",
    "password",
    "token",
    "secret",
  ];
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
```

### Schéma de base de données pour le suivi du consentement

```sql
-- Migration : Création de la table de consentement utilisateur
-- Conforme à l'Art. 43, Loi n°2010/012

CREATE TABLE IF NOT EXISTS public.user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('service', 'marketing', 'third_party', 'analytics')),
  granted BOOLEAN NOT NULL,
  privacy_policy_version TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ✅ Index pour les requêtes fréquentes
CREATE INDEX idx_user_consents_user_id ON public.user_consents(user_id);
CREATE INDEX idx_user_consents_type ON public.user_consents(consent_type);
CREATE INDEX idx_user_consents_user_type ON public.user_consents(user_id, consent_type);

-- ✅ RLS : chaque utilisateur ne voit que ses propres consentements
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own consents"
  ON public.user_consents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consents"
  ON public.user_consents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ✅ Vue pour obtenir le consentement actuel (dernier en date) par type
CREATE OR REPLACE VIEW public.current_user_consents AS
SELECT DISTINCT ON (user_id, consent_type)
  user_id,
  consent_type,
  granted,
  privacy_policy_version,
  granted_at
FROM public.user_consents
ORDER BY user_id, consent_type, granted_at DESC;

-- ✅ Table de journal d'audit
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ✅ Seuls les admins peuvent consulter les logs d'audit
CREATE POLICY "Only service role can manage audit logs"
  ON public.audit_logs FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ✅ Politique de rétention : fonction pour purger les données expirées
CREATE OR REPLACE FUNCTION public.purge_expired_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Supprimer les logs de connexion de plus de 12 mois
  DELETE FROM public.audit_logs
  WHERE created_at < now() - INTERVAL '12 months'
    AND action IN ('user_login', 'user_logout', 'page_view');

  -- Anonymiser les données des comptes supprimés depuis plus de 12 mois
  UPDATE public.users
  SET
    full_name = 'Utilisateur supprimé',
    email = NULL,
    phone = NULL,
    avatar_url = NULL,
    updated_at = now()
  WHERE deleted_at IS NOT NULL
    AND deleted_at < now() - INTERVAL '12 months'
    AND full_name != 'Utilisateur supprimé';
END;
$$;

-- Planifier l'exécution via pg_cron (si disponible sur Supabase)
-- SELECT cron.schedule('purge-expired-data', '0 3 * * 0', 'SELECT public.purge_expired_data()');
```

---

## Sanctions

### Sanctions Pénales (Loi n°2010/012)

| Infraction | Article | Sanction |
|-----------|---------|----------|
| Traitement de données personnelles sans déclaration préalable | Art. 74 al. 1 | **1 à 2 ans d'emprisonnement** et/ou **1 000 000 à 5 000 000 FCFA** d'amende |
| Collecte de données par moyen frauduleux, déloyal ou illicite | Art. 74 al. 2 | **1 à 2 ans d'emprisonnement** et **1 000 000 à 5 000 000 FCFA** d'amende |
| Traitement de données malgré l'opposition de la personne concernée | Art. 74 al. 3 | **1 à 2 ans d'emprisonnement** et **1 000 000 à 5 000 000 FCFA** d'amende |
| Détournement de finalité du traitement | Art. 74 al. 4 | **1 à 5 ans d'emprisonnement** et **1 000 000 à 5 000 000 FCFA** d'amende |
| Défaut de sécurité entraînant une violation de données | Art. 74 al. 5 | **1 à 2 ans d'emprisonnement** et **500 000 à 2 000 000 FCFA** d'amende |
| Conservation des données au-delà de la durée autorisée | Art. 74 al. 6 | **500 000 à 2 000 000 FCFA** d'amende |
| Transfert non autorisé vers un pays tiers | Art. 74 al. 7 | **1 à 2 ans d'emprisonnement** et **1 000 000 à 5 000 000 FCFA** d'amende |

### Sanctions Administratives (ANTIC)

- Mise en demeure de se conformer dans un délai imparti
- Suspension temporaire du traitement de données
- Retrait de l'autorisation de traitement
- Publication de la sanction (atteinte à la réputation)

### Responsabilité Civile

- Dommages et intérêts au profit des victimes (personnes dont les données ont été traitées illicitement)
- Action collective possible en cas de violation massive

### Aggravation des Peines

Les peines sont **doublées** lorsque l'infraction est commise par le responsable du traitement ou son sous-traitant (Art. 74 in fine).

---

## Recommandations Techniques pour KBouffe

### Priorité 1 — Actions Immédiates (0-30 jours)

1. **Déclaration à l'ANTIC**
   - Préparer et soumettre le formulaire de déclaration de traitement de données
   - Conserver le récépissé et l'intégrer à la politique de confidentialité

2. **Politique de confidentialité**
   - Rédiger et publier une politique de confidentialité complète sur `https://kbouffe.com/politique-de-confidentialite`
   - Doit être rédigée en français, dans un langage clair et accessible
   - Inclure : identité du responsable, finalités, bases légales, destinataires, durées de conservation, droits, contact DPO, n° de déclaration ANTIC

3. **Mécanisme de consentement à l'inscription**
   - Implémenter le système de consentement granulaire (service / marketing / tiers)
   - Cases non pré-cochées
   - Lien vers la politique de confidentialité
   - Horodatage et stockage du consentement

4. **Masquage du MSISDN dans les logs**
   - Déployer `maskMsisdn()` dans tous les `console.log/error` qui traitent des numéros de téléphone
   - Auditer l'ensemble du codebase pour identifier les fuites de MSISDN

### Priorité 2 — Actions à Court Terme (30-90 jours)

5. **Endpoint d'export de données (droit d'accès)**
   - Implémenter `GET /api/my-data/export`
   - Format JSON structuré, couvrant toutes les données collectées
   - Inclure les métadonnées légales (base légale, date d'export)

6. **Gestion du consentement**
   - Implémenter `PUT /api/my-data/consent` pour modifier les consentements marketing/tiers
   - Interface utilisateur dans les paramètres du dashboard et de l'app mobile

7. **Table de consentement et audit**
   - Créer `user_consents` et `audit_logs` en base de données
   - Activer le RLS sur ces tables
   - Indexer les colonnes de recherche fréquente

8. **Bandeau cookies / consentement web**
   - Implémenter un bandeau de consentement sur le dashboard web
   - Catégories : cookies essentiels (pas de consentement requis), analytics, marketing
   - Stockage du choix utilisateur

### Priorité 3 — Actions à Moyen Terme (90-180 jours)

9. **Politique de rétention automatisée**
   - Implémenter la fonction `purge_expired_data()` en base
   - Planifier via `pg_cron` ou un Worker Cloudflare périodique
   - Documenter les durées de conservation par type de données

10. **Clauses contractuelles avec Supabase**
    - Obtenir le DPA (Data Processing Agreement) de Supabase
    - Vérifier la localisation des données
    - Documenter les garanties de protection adéquate

11. **Chiffrement des données sensibles**
    - Chiffrer le MSISDN en base de données (chiffrement au niveau applicatif via `pgcrypto` ou chiffrement côté client)
    - Chiffrer les payloads de paiement MTN MoMo

12. **Notification des violations**
    - Mettre en place une procédure interne de gestion des incidents
    - Préparer les modèles de notification (ANTIC, utilisateurs)
    - Intégrer des alertes automatiques en cas d'accès anormal aux données

---

## Références

### Textes Législatifs et Réglementaires

1. **Loi n°2010/012 du 21 décembre 2010** relative à la Cybersécurité et la Cybercriminalité au Cameroun
   - *Journal Officiel de la République du Cameroun*
   - Articles 41 à 49 (protection des données personnelles), Art. 74 (sanctions)

2. **Loi n°2010/013 du 21 décembre 2010** régissant les Communications Électroniques au Cameroun
   - Dispositions relatives à la confidentialité des données d'abonnés

3. **Loi n°2010/021 du 21 décembre 2010** régissant le Commerce Électronique au Cameroun
   - Articles 30-42 (protection du consommateur en ligne, données personnelles)

4. **Décret n°2012/180 du 10 avril 2012** portant réorganisation de l'ANTIC

5. **Règlement n°21/08-UEAC-133-CM-18** de la CEMAC sur les transactions électroniques

6. **Convention de l'Union Africaine sur la Cybersécurité et la Protection des Données Personnelles** (Convention de Malabo, 27 juin 2014)

### Autorités Compétentes

- **ANTIC** — Agence Nationale des Technologies de l'Information et de la Communication
  - Site web : [https://www.antic.cm](https://www.antic.cm)
  - Adresse : Yaoundé, Cameroun
  - Contact : contact@antic.cm

- **MINPOSTEL** — Ministère des Postes et Télécommunications du Cameroun
  - Tutelle de l'ANTIC

### Ressources Complémentaires

- Guide ANTIC sur la protection des données personnelles au Cameroun
- Rapport annuel ANTIC sur la cybersécurité
- Standards internationaux : ISO 27001, ISO 27701 (management de la vie privée)
- Lignes directrices du Comité Consultatif de la Convention 108 du Conseil de l'Europe (référence comparative)
- RGPD de l'Union Européenne (référence comparative pour les bonnes pratiques, non directement applicable)
