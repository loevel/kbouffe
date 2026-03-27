# Marketing SMS et Publicité Commerciale — Cadre Juridique Camerounais

## Résumé

Le Cameroun encadre strictement les communications électroniques commerciales, y compris les SMS marketing, à travers la **Loi n°2010/012 du 21 décembre 2010 relative à la cybersécurité et la cybercriminalité** et les directives de l'**ANTIC** (Agence Nationale des Technologies de l'Information et de la Communication). Toute plateforme envoyant des SMS promotionnels doit obtenir le **consentement préalable explicite** (opt-in) du destinataire, fournir un **mécanisme de désinscription** (opt-out) dans chaque message, et respecter des **plages horaires autorisées**. Les opérateurs télécoms (MTN Cameroon, Orange Cameroon) imposent en complément leurs propres règles d'utilisation de leurs passerelles SMS bulk. Le non-respect de ces obligations expose la plateforme à des sanctions administratives de l'ANTIC, des pénalités contractuelles des opérateurs, et des amendes pouvant atteindre **10 000 000 FCFA**.

---

## Textes de Loi Applicables

### 1. Loi n°2010/012 du 21 décembre 2010 — Cybersécurité et Cybercriminalité

- **Article 29** : Interdit l'envoi de communications électroniques non sollicitées à des fins de prospection commerciale sans consentement préalable du destinataire.
- **Article 30** : Chaque communication commerciale électronique doit être clairement identifiable comme telle et doit indiquer l'identité de l'expéditeur.
- **Article 31** : Le destinataire doit pouvoir refuser, sans frais et de manière simple, de recevoir de futures communications (opt-out).
- **Article 72** : Sanctions pénales pour envoi massif de communications non sollicitées (spam) — amende de 1 000 000 à 10 000 000 FCFA et/ou emprisonnement de 1 à 5 ans.

### 2. Loi n°2015/018 du 21 décembre 2015 — Commerce Électronique

- **Article 14** : Les communications commerciales par voie électronique doivent être clairement identifiées. L'expéditeur doit indiquer son identité et la nature promotionnelle du message.
- **Article 15** : Obligation d'opt-in pour la prospection directe par voie électronique. Exception pour les clients existants (soft opt-in) uniquement pour des produits/services analogues.

### 3. Directives ANTIC

- **Délibération n°001/ANTIC/2013** : Encadrement des SMS bulk commerciaux — obligation d'identification de l'expéditeur, mécanisme de désinscription, interdiction de l'envoi entre 21h00 et 07h00.
- L'ANTIC peut ordonner le blocage des numéros/passerelles utilisés pour du spam.

### 4. Règles des opérateurs MTN Cameroon

- **Politique d'utilisation acceptable MTN SMS API** : tout compte professionnel utilisant la passerelle SMS MTN doit démontrer un mécanisme d'opt-in et d'opt-out. MTN se réserve le droit de suspendre l'accès API en cas d'abus signalé.
- **Sender ID** : obligation d'enregistrer un identifiant d'expéditeur reconnaissable (ex : « KBOUFFE »).
- **Fréquence** : pas plus de 2 SMS marketing par semaine à un même destinataire (recommandation MTN).
- **Contenu** : interdiction de contenu trompeur, d'allégations santé non vérifiées pour les produits alimentaires.

### 5. Réglementation sur la publicité alimentaire

- **Loi-cadre n°2011/012 du 6 mai 2011 (protection du consommateur)** — Article 6 : Interdiction de la publicité trompeuse. Les allégations sur la qualité, l'origine ou la composition des aliments doivent être vérifiables.
- **Décret n°2012/2861/PM** : Normes d'étiquetage et de publicité des denrées alimentaires — pas d'allégation thérapeutique sans autorisation ANOR.

---

## Obligations pour la Plateforme

| Obligation | Détail | Base légale |
|---|---|---|
| **Consentement préalable (opt-in)** | Obtenir l'accord explicite avant tout SMS marketing. La case ne peut être pré-cochée. | Art. 29, Loi 2010/012 |
| **Mécanisme de désinscription (opt-out)** | Chaque SMS doit contenir une instruction claire pour se désinscrire (ex : « STOP au 8xxx ») | Art. 31, Loi 2010/012 |
| **Identification de l'expéditeur** | Le SMS doit mentionner clairement l'identité de la plateforme/restaurant | Art. 30, Loi 2010/012 |
| **Plages horaires** | Interdiction d'envoi entre 21h00 et 07h00 (heure de Douala/Yaoundé, UTC+1) | Délibération ANTIC 2013 |
| **Limite de fréquence** | Maximum 2 SMS marketing/semaine par destinataire | Politique MTN |
| **Contenu véridique** | Pas d'allégation trompeuse sur prix, qualité, origine des aliments | Art. 6, Loi 2011/012 |
| **Registre de consentements** | Maintenir un registre horodaté prouvant le consentement de chaque destinataire | Bonne pratique / preuve en cas de litige |
| **Distinction transactionnel/marketing** | Les SMS de suivi de commande (transactionnels) ne nécessitent pas d'opt-in. Les SMS promotionnels oui. | Art. 29 al. 2, Loi 2010/012 |

---

## ❌ Exemple Non-Conforme

Le code actuel de KBouffe envoie des SMS marketing **sans vérification de consentement**, **sans opt-out**, **sans contrôle horaire**, et **sans limite de fréquence** :

### Route SMS actuelle (`packages/modules/marketing/src/api/sms.ts`)

```typescript
import { Hono } from "hono";
import { enqueueSms } from "@kbouffe/module-core";

export const smsRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ❌ Aucune vérification de consentement du destinataire
// ❌ Aucun mécanisme d'opt-out dans le message
// ❌ Aucune vérification de plage horaire
// ❌ Aucun contrôle de fréquence d'envoi
// ❌ Pas de distinction transactionnel vs marketing

smsRoutes.post("/send", async (c) => {
  const body = await c.req.json<{ recipientMsisdn: string; message: string }>();

  if (!body.recipientMsisdn?.trim()) {
    return c.json({ error: "recipientMsisdn est requis" }, 400);
  }
  if (!body.message?.trim()) {
    return c.json({ error: "message est requis" }, 400);
  }

  // ❌ Envoi direct sans aucune vérification réglementaire
  await enqueueSms(c.env, {
    to: body.recipientMsisdn.trim(),
    content: body.message.trim(),
  });

  return c.json({ success: true, queued: true });
});
```

### Campagne SMS bulk actuelle (pas de consentement)

```typescript
// ❌ Envoi en masse à tous les clients sans vérifier opt-in
smsRoutes.post("/campaign/send", async (c) => {
  const { message, restaurantId } = await c.req.json();
  const supabase = c.var.supabase;

  // ❌ Récupère TOUS les clients sans filtre de consentement
  const { data: customers } = await supabase
    .from("orders")
    .select("customer_phone")
    .eq("restaurant_id", restaurantId)
    .not("customer_phone", "is", null);

  const uniquePhones = [...new Set(customers?.map((c) => c.customer_phone))];

  // ❌ Pas de vérification d'opt-in, d'opt-out, d'horaire, ni de fréquence
  for (const phone of uniquePhones) {
    await enqueueSms(c.env, { to: phone, content: message });
  }

  return c.json({ success: true, sent: uniquePhones.length });
});
```

**Violations identifiées :**
1. Aucune table `sms_consents` pour tracer le consentement
2. Aucun lien de désinscription dans les messages
3. Envoi possible à toute heure (y compris la nuit)
4. Aucune limite de fréquence par destinataire
5. Pas de distinction entre SMS transactionnel et marketing
6. Pas de Sender ID enregistré

---

## ✅ Exemple Conforme

### 1. Migration SQL — Consentement SMS et journalisation

```sql
-- Migration: add_sms_consent_tracking
-- Conforme à la Loi n°2010/012, Art. 29 (opt-in) et Art. 31 (opt-out)

CREATE TABLE IF NOT EXISTS public.sms_consents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone           TEXT NOT NULL,
    restaurant_id   UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    consented       BOOLEAN NOT NULL DEFAULT false,
    consent_source  TEXT NOT NULL CHECK (consent_source IN (
                        'checkout_optin',    -- Opt-in lors du passage de commande
                        'account_settings',  -- Paramètres du compte client
                        'sms_keyword',       -- Réponse "OUI" par SMS
                        'web_form',          -- Formulaire web dédié
                        'import_verified'    -- Import avec preuve de consentement
                    )),
    consented_at    TIMESTAMPTZ,
    revoked_at      TIMESTAMPTZ,
    ip_address      TEXT,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Un seul enregistrement actif par téléphone/restaurant
    CONSTRAINT uq_sms_consent_phone_restaurant UNIQUE (phone, restaurant_id)
);

CREATE INDEX idx_sms_consents_phone ON public.sms_consents(phone);
CREATE INDEX idx_sms_consents_restaurant ON public.sms_consents(restaurant_id);
CREATE INDEX idx_sms_consents_active ON public.sms_consents(restaurant_id, consented)
    WHERE consented = true;

-- Journal de tous les SMS envoyés (audit trail)
CREATE TABLE IF NOT EXISTS public.sms_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id   UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    phone           TEXT NOT NULL,
    message_type    TEXT NOT NULL CHECK (message_type IN ('transactional', 'marketing')),
    content         TEXT NOT NULL,
    campaign_id     TEXT,
    consent_id      UUID REFERENCES public.sms_consents(id),
    status          TEXT NOT NULL DEFAULT 'queued' CHECK (status IN (
                        'queued', 'sent', 'delivered', 'failed', 'blocked'
                    )),
    blocked_reason  TEXT,
    sent_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sms_log_restaurant ON public.sms_log(restaurant_id);
CREATE INDEX idx_sms_log_phone ON public.sms_log(phone);
CREATE INDEX idx_sms_log_sent_at ON public.sms_log(sent_at DESC);
CREATE INDEX idx_sms_log_phone_sent ON public.sms_log(phone, sent_at DESC);
```

### 2. Fonctions de vérification conformes (`packages/modules/marketing/src/api/sms-compliance.ts`)

```typescript
import { Hono } from "hono";
import { enqueueSms } from "@kbouffe/module-core";

export const smsRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ── Configuration réglementaire ──────────────────────────────────
const SMS_QUIET_HOURS = { start: 21, end: 7 }; // 21h00–07h00 UTC+1 (ANTIC)
const MAX_MARKETING_SMS_PER_WEEK = 2;           // Politique MTN
const CAMEROON_TZ_OFFSET = 1;                   // UTC+1
const OPT_OUT_SUFFIX = "\nSTOP SMS: envoyez STOP au 8100";
const SENDER_ID = "KBOUFFE";

// ── Helpers ──────────────────────────────────────────────────────

/** Vérifie si l'heure courante est dans les plages autorisées (Art. ANTIC) */
function isWithinAllowedHours(): boolean {
  const now = new Date();
  const cameroonHour = (now.getUTCHours() + CAMEROON_TZ_OFFSET) % 24;
  // Interdit entre 21h00 et 07h00
  if (cameroonHour >= SMS_QUIET_HOURS.start || cameroonHour < SMS_QUIET_HOURS.end) {
    return false;
  }
  return true;
}

/** Vérifie le consentement opt-in d'un destinataire (Art. 29, Loi 2010/012) */
async function hasMarketingConsent(
  supabase: SupabaseClient,
  phone: string,
  restaurantId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("sms_consents")
    .select("id, consented")
    .eq("phone", phone)
    .eq("restaurant_id", restaurantId)
    .eq("consented", true)
    .is("revoked_at", null)
    .maybeSingle();

  return !!data;
}

/** Vérifie la fréquence d'envoi (max 2 SMS marketing / semaine, politique MTN) */
async function isUnderFrequencyLimit(
  supabase: SupabaseClient,
  phone: string,
  restaurantId: string,
): Promise<boolean> {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { count } = await supabase
    .from("sms_log")
    .select("id", { count: "exact", head: true })
    .eq("phone", phone)
    .eq("restaurant_id", restaurantId)
    .eq("message_type", "marketing")
    .gte("sent_at", oneWeekAgo);

  return (count ?? 0) < MAX_MARKETING_SMS_PER_WEEK;
}

/** Ajoute le suffixe opt-out au message (Art. 31, Loi 2010/012) */
function appendOptOut(message: string): string {
  if (message.includes("STOP")) return message;
  return `${message}${OPT_OUT_SUFFIX}`;
}

// ── Route SMS marketing conforme ─────────────────────────────────

smsRoutes.post("/send", async (c) => {
  const supabase = c.var.supabase;
  const restaurantId = c.var.restaurantId;
  const body = await c.req.json<{
    recipientMsisdn: string;
    message: string;
    type: "transactional" | "marketing";
  }>();

  const phone = body.recipientMsisdn?.trim();
  const messageType = body.type ?? "marketing";

  if (!phone) return c.json({ error: "recipientMsisdn est requis" }, 400);
  if (!body.message?.trim()) return c.json({ error: "message est requis" }, 400);

  // Les SMS transactionnels (suivi commande) passent sans opt-in
  if (messageType === "marketing") {
    // ✅ Vérification de plage horaire (Délibération ANTIC 2013)
    if (!isWithinAllowedHours()) {
      return c.json({
        error: "Envoi marketing interdit entre 21h00 et 07h00 (réglementation ANTIC)",
        blocked: true,
      }, 403);
    }

    // ✅ Vérification du consentement opt-in (Art. 29, Loi 2010/012)
    const hasConsent = await hasMarketingConsent(supabase, phone, restaurantId);
    if (!hasConsent) {
      // Log le blocage pour audit
      await supabase.from("sms_log").insert({
        restaurant_id: restaurantId,
        phone,
        message_type: "marketing",
        content: body.message.trim(),
        status: "blocked",
        blocked_reason: "no_consent",
      });

      return c.json({
        error: "Le destinataire n'a pas consenti à recevoir des SMS marketing",
        blocked: true,
      }, 403);
    }

    // ✅ Vérification de fréquence (Politique MTN — max 2/semaine)
    const underLimit = await isUnderFrequencyLimit(supabase, phone, restaurantId);
    if (!underLimit) {
      await supabase.from("sms_log").insert({
        restaurant_id: restaurantId,
        phone,
        message_type: "marketing",
        content: body.message.trim(),
        status: "blocked",
        blocked_reason: "frequency_limit",
      });

      return c.json({
        error: "Limite de fréquence atteinte (max 2 SMS marketing/semaine)",
        blocked: true,
      }, 429);
    }
  }

  // ✅ Ajout opt-out pour les SMS marketing (Art. 31, Loi 2010/012)
  const finalMessage =
    messageType === "marketing"
      ? appendOptOut(body.message.trim())
      : body.message.trim();

  // ✅ Envoi via queue avec sender ID enregistré
  await enqueueSms(c.env, {
    to: phone,
    content: `[${SENDER_ID}] ${finalMessage}`,
  });

  // ✅ Journalisation complète pour audit
  await supabase.from("sms_log").insert({
    restaurant_id: restaurantId,
    phone,
    message_type: messageType,
    content: finalMessage,
    status: "queued",
  });

  return c.json({ success: true, queued: true, type: messageType });
});

// ── Campagne SMS bulk conforme ───────────────────────────────────

smsRoutes.post("/campaign/send", async (c) => {
  const supabase = c.var.supabase;
  const restaurantId = c.var.restaurantId;
  const { message, campaignId } = await c.req.json<{
    message: string;
    campaignId?: string;
  }>();

  if (!message?.trim()) return c.json({ error: "message est requis" }, 400);

  // ✅ Vérification de plage horaire avant envoi bulk
  if (!isWithinAllowedHours()) {
    return c.json({
      error: "Campagnes SMS interdites entre 21h00 et 07h00 (réglementation ANTIC)",
    }, 403);
  }

  // ✅ Récupérer UNIQUEMENT les numéros avec consentement actif
  const { data: consents } = await supabase
    .from("sms_consents")
    .select("phone, id")
    .eq("restaurant_id", restaurantId)
    .eq("consented", true)
    .is("revoked_at", null);

  if (!consents?.length) {
    return c.json({ success: true, sent: 0, message: "Aucun destinataire avec consentement actif" });
  }

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const finalMessage = appendOptOut(message.trim());
  let sentCount = 0;
  let blockedCount = 0;

  for (const consent of consents) {
    // ✅ Vérifier la fréquence individuelle
    const { count } = await supabase
      .from("sms_log")
      .select("id", { count: "exact", head: true })
      .eq("phone", consent.phone)
      .eq("restaurant_id", restaurantId)
      .eq("message_type", "marketing")
      .gte("sent_at", oneWeekAgo);

    if ((count ?? 0) >= MAX_MARKETING_SMS_PER_WEEK) {
      blockedCount++;
      await supabase.from("sms_log").insert({
        restaurant_id: restaurantId,
        phone: consent.phone,
        message_type: "marketing",
        content: finalMessage,
        campaign_id: campaignId,
        consent_id: consent.id,
        status: "blocked",
        blocked_reason: "frequency_limit",
      });
      continue;
    }

    await enqueueSms(c.env, {
      to: consent.phone,
      content: `[${SENDER_ID}] ${finalMessage}`,
    });

    await supabase.from("sms_log").insert({
      restaurant_id: restaurantId,
      phone: consent.phone,
      message_type: "marketing",
      content: finalMessage,
      campaign_id: campaignId,
      consent_id: consent.id,
      status: "queued",
    });

    sentCount++;
  }

  return c.json({
    success: true,
    sent: sentCount,
    blocked: blockedCount,
    total_eligible: consents.length,
  });
});

// ── Gestion opt-out (désinscription) ─────────────────────────────

smsRoutes.post("/unsubscribe", async (c) => {
  const supabase = c.var.supabase;
  const { phone, restaurantId } = await c.req.json<{
    phone: string;
    restaurantId: string;
  }>();

  if (!phone?.trim()) return c.json({ error: "phone est requis" }, 400);

  // ✅ Révoquer le consentement (Art. 31 — sans frais, de manière simple)
  const { error } = await supabase
    .from("sms_consents")
    .update({
      consented: false,
      revoked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("phone", phone.trim())
    .eq("restaurant_id", restaurantId);

  if (error) {
    return c.json({ error: "Erreur lors de la désinscription" }, 500);
  }

  return c.json({ success: true, message: "Désinscription effectuée" });
});

// ── Enregistrement du consentement (opt-in) ──────────────────────

smsRoutes.post("/consent", async (c) => {
  const supabase = c.var.supabase;
  const restaurantId = c.var.restaurantId;
  const body = await c.req.json<{
    phone: string;
    source: string;
  }>();

  if (!body.phone?.trim()) return c.json({ error: "phone est requis" }, 400);

  // ✅ Enregistrer le consentement avec horodatage et source (preuve)
  const { data, error } = await supabase
    .from("sms_consents")
    .upsert(
      {
        phone: body.phone.trim(),
        restaurant_id: restaurantId,
        consented: true,
        consent_source: body.source ?? "web_form",
        consented_at: new Date().toISOString(),
        revoked_at: null,
        ip_address: c.req.header("CF-Connecting-IP") ?? null,
        user_agent: c.req.header("User-Agent") ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "phone,restaurant_id" },
    )
    .select()
    .single();

  if (error) return c.json({ error: "Erreur lors de l'enregistrement du consentement" }, 500);

  return c.json({ success: true, consent: data });
});
```

---

## Sanctions

### Sanctions pénales (Loi n°2010/012)

| Infraction | Amende | Emprisonnement |
|---|---|---|
| Envoi de SMS commerciaux non sollicités (spam) | 1 000 000 – 10 000 000 FCFA | 1 – 5 ans |
| Défaut d'identification de l'expéditeur | 500 000 – 5 000 000 FCFA | 6 mois – 2 ans |
| Défaut de mécanisme d'opt-out | 500 000 – 5 000 000 FCFA | — |
| Publicité trompeuse (Loi 2011/012) | 500 000 – 5 000 000 FCFA | 15 jours – 6 mois |

### Sanctions administratives (ANTIC)

- **Mise en demeure** puis blocage du Sender ID et de la passerelle SMS.
- **Suspension de l'accès** aux API SMS des opérateurs.
- **Publication** de l'infraction dans les médias (name & shame).
- **Signalement** au Procureur de la République pour poursuites pénales.

### Sanctions opérateur (MTN Cameroon)

- Suspension temporaire ou définitive de l'accès API SMS.
- Résiliation du contrat de service bulk SMS.
- Facture majorée en cas de détection de spam (pénalité contractuelle).

---

## Recommandations Techniques pour KBouffe

### Priorité 1 — Immédiat (bloquant)

1. **Créer la table `sms_consents`** avec le schéma ci-dessus. Chaque consentement doit inclure : numéro, source, horodatage, adresse IP.
2. **Ajouter la table `sms_log`** pour journaliser chaque SMS envoyé, y compris les blocages.
3. **Modifier la route `/api/sms/send`** pour distinguer les types `transactional` et `marketing`. Les SMS transactionnels (notification de commande) ne nécessitent pas d'opt-in.
4. **Implémenter la vérification de consentement** avant tout envoi marketing via `sms_consents`.
5. **Ajouter le suffixe opt-out** à chaque SMS marketing : `STOP SMS: envoyez STOP au 8100`.
6. **Bloquer les envois hors plages horaires** (21h00–07h00 heure camerounaise).

### Priorité 2 — Court terme (1-2 semaines)

7. **Implémenter le contrôle de fréquence** : max 2 SMS marketing/semaine par numéro.
8. **Enregistrer le Sender ID « KBOUFFE »** auprès de MTN Cameroon.
9. **Modifier le formulaire de checkout** (mobile + web) pour proposer l'opt-in SMS marketing (case non pré-cochée).
10. **Créer l'endpoint `/api/sms/unsubscribe`** pour traiter les désinscriptions.
11. **Créer un webhook** pour recevoir les réponses « STOP » via MTN SMS API.

### Priorité 3 — Moyen terme

12. **Tableau de bord marketing** : afficher le taux d'opt-in, le nombre d'envois, les blocages.
13. **Rapport d'audit SMS** exportable pour répondre aux demandes ANTIC.
14. **Double opt-in** (optionnel mais recommandé) : SMS de confirmation après inscription.
15. **Filtrage de contenu** : vérifier l'absence d'allégations trompeuses dans les messages marketing avant envoi.

### Configuration Cloudflare Workers

```typescript
// wrangler.toml — Ajouter la liaison queue SMS
// [[queues.producers]]
// queue = "kbouffe-sms-queue"
// binding = "SMS_QUEUE"

// Secrets requis (wrangler secret put) :
// MTN_SMS_SENDER_ID = "KBOUFFE"
// MTN_SMS_API_KEY = "..."
// MTN_SMS_API_SECRET = "..."
```

---

## Références

1. **Loi n°2010/012 du 21 décembre 2010** relative à la cybersécurité et la cybercriminalité au Cameroun — Articles 29-31, 72.
2. **Loi n°2015/018 du 21 décembre 2015** régissant le commerce électronique au Cameroun — Articles 14-15.
3. **Loi-cadre n°2011/012 du 6 mai 2011** portant protection du consommateur au Cameroun — Article 6.
4. **Décret n°2012/2861/PM** fixant les conditions d'étiquetage et de publicité des denrées alimentaires.
5. **Délibération n°001/ANTIC/2013** — Encadrement des SMS commerciaux bulk.
6. **MTN Cameroon — Conditions d'utilisation des API SMS** (documentation partenaire).
7. **ANTIC** — Agence Nationale des Technologies de l'Information et de la Communication : [https://antic.cm](https://antic.cm)
8. **ART (Agence de Régulation des Télécommunications)** : [https://www.art.cm](https://www.art.cm)
