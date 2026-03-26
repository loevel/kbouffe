# Protection du Consommateur — Cadre Juridique Camerounais

## Résumé

La **Loi-cadre n°2011/012 du 6 mai 2011 portant protection du consommateur au Cameroun** est le texte fondateur régissant les droits des consommateurs dans toute transaction commerciale, y compris le commerce électronique de produits alimentaires. Cette loi, complétée par la **Loi n°2015/018 sur le commerce électronique** et les normes **OHADA**, impose des obligations strictes en matière d'**information du consommateur** (prix TTC, description complète, allergènes), de **droit de rétractation**, de **conformité des produits livrés**, de **garantie**, et de **traitement des réclamations**. Pour une plateforme de livraison alimentaire comme KBouffe, ces obligations s'appliquent tant au niveau de l'intermédiaire (la plateforme) qu'au niveau du vendeur (le restaurateur). Le non-respect expose à des amendes allant de **50 000 à 5 000 000 FCFA**, une suspension d'activité, voire des poursuites pénales pour tromperie.

---

## Textes de Loi Applicables

### 1. Loi-cadre n°2011/012 du 6 mai 2011 — Protection du Consommateur

- **Article 2** : Définition du consommateur — toute personne qui utilise des produits pour satisfaire ses propres besoins et ceux des personnes à sa charge.
- **Article 3** : Droits fondamentaux du consommateur — droit à l'information, droit à la sécurité, droit à la réparation, droit à la représentation.
- **Article 6** : Interdiction de la publicité trompeuse ou mensongère. Toute information commerciale doit être véridique, vérifiable et non susceptible d'induire en erreur.
- **Article 7** : Obligation d'information précontractuelle — le professionnel doit informer le consommateur de manière claire sur les caractéristiques essentielles du produit, le prix TTC, les conditions de vente.
- **Article 8** : Affichage obligatoire des prix — tout prix doit être affiché de manière visible et inclure l'ensemble des taxes (prix TTC — Toutes Taxes Comprises).
- **Article 12** : Obligation de conformité — le produit livré doit être conforme à la description, à la commande et aux attentes légitimes du consommateur.
- **Article 14** : Garantie légale de conformité — le consommateur dispose d'un recours en cas de défaut de conformité.
- **Article 18** : Pratiques commerciales trompeuses — interdiction de toute pratique créant une confusion, induisant en erreur sur le prix, la nature, la qualité ou l'origine du produit.
- **Article 25** : Droit de réclamation — tout consommateur a le droit d'adresser une réclamation au professionnel et d'obtenir une réponse dans un délai raisonnable.
- **Article 30** : Sanctions — amendes, suspension d'activité, interdiction d'exercer.

### 2. Loi n°2015/018 du 21 décembre 2015 — Commerce Électronique

- **Article 8** : Information précontractuelle renforcée pour le commerce en ligne — le vendeur doit fournir, avant conclusion du contrat : prix TTC, frais de livraison, délai de livraison, droit de rétractation, coordonnées complètes.
- **Article 12** : Droit de rétractation de **14 jours** à compter de la réception pour les contrats conclus à distance. **Exception** : les denrées alimentaires périssables sont exclues de ce droit.
- **Article 13** : Confirmation de commande — le vendeur doit envoyer un accusé de réception confirmant les détails de la commande (référence, montant, livraison).
- **Article 16** : Responsabilité du professionnel de commerce électronique — le vendeur est responsable de la bonne exécution du contrat, y compris en cas de défaillance d'un prestataire (livreur, etc.).

### 3. Décret n°2012/2861/PM — Étiquetage des Denrées Alimentaires

- Obligation d'indiquer la **composition**, les **allergènes**, la **date de fabrication/péremption**, les **conditions de conservation**.
- Pour la vente en ligne de produits alimentaires, ces informations doivent être accessibles avant l'achat.

### 4. Normes ANOR (Agence des Normes et de la Qualité)

- NC 801:2019 — Hygiène des denrées alimentaires.
- Normes d'étiquetage nutritionnel pour aliments préemballés.

---

## Obligations pour la Plateforme

| Obligation | Détail | Base légale |
|---|---|---|
| **Prix TTC** | Tous les prix affichés doivent inclure toutes les taxes. Le montant final ne doit pas surprendre le client. | Art. 8, Loi 2011/012 |
| **Détail des frais** | Frais de livraison, frais de service, et tout supplément doivent être indiqués séparément et clairement avant validation | Art. 7, Loi 2011/012 ; Art. 8, Loi 2015/018 |
| **Description des produits** | Chaque produit doit avoir une description complète : ingrédients, taille, allergènes si pertinent | Art. 7, Loi 2011/012 ; Décret 2012/2861 |
| **Allergènes** | Les allergènes majeurs (arachides, gluten, lactose, etc.) doivent être signalés de manière visible | Décret 2012/2861 |
| **Conformité de la livraison** | Le produit livré doit correspondre à ce qui a été commandé (quantité, composition, description) | Art. 12, Loi 2011/012 |
| **Droit de rétractation** | 14 jours pour les achats e-commerce. **Exception** : plats préparés et denrées périssables | Art. 12, Loi 2015/018 |
| **Accusé de réception** | Confirmer chaque commande avec : référence, détail, prix, livraison estimée | Art. 13, Loi 2015/018 |
| **Mécanisme de réclamation** | Le consommateur doit pouvoir déposer une réclamation et obtenir une réponse | Art. 25, Loi 2011/012 |
| **Remboursement** | En cas de non-conformité ou non-livraison, remboursement intégral | Art. 14, Loi 2011/012 |
| **Interdiction pratiques trompeuses** | Pas de faux prix barrés, pas de promotions fictives, pas de stock artificiellement limité | Art. 18, Loi 2011/012 |

---

## ❌ Exemple Non-Conforme

### Affichage de prix sans décomposition TTC

```typescript
// ❌ L'API retourne les montants bruts sans décomposition claire
// ❌ Pas de mention TTC / HT
// ❌ Pas d'information sur les allergènes
// ❌ Le total peut surprendre le client (frais cachés)

ordersRoutes.post("/", async (c) => {
  const supabase = c.var.supabase;
  const restaurantId = c.var.restaurantId;
  const body = await c.req.json();

  const orderData = {
    restaurant_id: restaurantId,
    customer_id: body.customer_id ?? null,
    customer_name: body.customer_name,
    customer_phone: body.customer_phone,
    items: body.items, // ❌ Snapshot sans prix unitaire TTC ni allergènes
    subtotal: body.subtotal,         // ❌ HT ou TTC ? Non précisé
    delivery_fee: body.delivery_fee ?? 0, // ❌ Pas affiché avant validation
    service_fee: body.service_fee ?? 0,   // ❌ Frais « surprise »
    total: body.total,               // ❌ Aucune décomposition vérifiable
    status: "pending",
    delivery_type: body.delivery_type ?? "delivery",
    payment_method: body.payment_method,
    payment_status: body.payment_status ?? "pending",
    notes: body.notes ?? null,
  };

  // ❌ Aucune validation côté serveur que total = subtotal + fees
  // ❌ Pas d'accusé de réception structuré envoyé au client
  // ❌ Aucun champ pour les informations allergènes

  const { data, error } = await supabase
    .from("orders")
    .insert(orderData as any)
    .select()
    .single();

  if (error) return c.json({ error: "Erreur lors de la création de la commande" }, 500);

  return c.json({ success: true, order: data }, 201);
});
```

### Page produit sans information consommateur

```typescript
// ❌ Le produit ne contient pas d'allergènes, ni de description complète
interface Product {
  id: string;
  name: string;
  price: number;       // ❌ HT ? TTC ? Pas défini
  description?: string; // ❌ Optionnel — devrait être obligatoire
  image_url?: string;
  // ❌ Manquant : allergens, ingredients, nutritional_info, price_is_ttc
}
```

**Violations identifiées :**
1. Les prix ne sont pas explicitement marqués comme TTC
2. Les frais de livraison et de service ne sont pas décomposés clairement
3. Pas de validation serveur que `total = subtotal + delivery_fee + service_fee`
4. Aucune information sur les allergènes
5. Pas d'accusé de réception de commande structuré
6. Pas de mécanisme de réclamation intégré
7. Pas de politique de remboursement claire

---

## ✅ Exemple Conforme

### 1. Migration SQL — Informations produit conformes

```sql
-- Migration: add_consumer_protection_fields
-- Conforme à la Loi-cadre n°2011/012 et au Décret n°2012/2861

-- Enrichir la table products avec les informations légales
ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS ingredients TEXT,
    ADD COLUMN IF NOT EXISTS allergens TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS nutritional_info JSONB,
    ADD COLUMN IF NOT EXISTS is_price_ttc BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS origin TEXT,
    ADD COLUMN IF NOT EXISTS conservation_info TEXT;

-- Table de réclamations (Art. 25, Loi 2011/012)
CREATE TABLE IF NOT EXISTS public.complaints (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    customer_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
    restaurant_id   UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    type            TEXT NOT NULL CHECK (type IN (
                        'non_conformity',    -- Produit non conforme à la commande
                        'missing_item',      -- Article manquant
                        'quality',           -- Problème de qualité
                        'delivery_issue',    -- Problème de livraison
                        'pricing',           -- Erreur de prix
                        'other'
                    )),
    description     TEXT NOT NULL,
    evidence_urls   TEXT[] DEFAULT '{}',
    status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
                        'open', 'under_review', 'resolved', 'refunded', 'rejected'
                    )),
    resolution      TEXT,
    refund_amount   INTEGER,
    resolved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_complaints_order ON public.complaints(order_id);
CREATE INDEX idx_complaints_customer ON public.complaints(customer_id);
CREATE INDEX idx_complaints_restaurant ON public.complaints(restaurant_id);
CREATE INDEX idx_complaints_status ON public.complaints(status);

-- Table de remboursements
CREATE TABLE IF NOT EXISTS public.refunds (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    complaint_id        UUID REFERENCES public.complaints(id) ON DELETE SET NULL,
    restaurant_id       UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    customer_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
    amount              INTEGER NOT NULL CHECK (amount > 0),
    currency            TEXT NOT NULL DEFAULT 'XAF',
    reason              TEXT NOT NULL,
    status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
                            'pending', 'approved', 'processing', 'completed', 'rejected'
                        )),
    refund_method       TEXT NOT NULL CHECK (refund_method IN (
                            'momo_reversal', 'wallet_credit', 'coupon'
                        )),
    processed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_refunds_order ON public.refunds(order_id);
CREATE INDEX idx_refunds_customer ON public.refunds(customer_id);
CREATE INDEX idx_refunds_restaurant ON public.refunds(restaurant_id);
```

### 2. Création de commande conforme (`packages/modules/orders/src/api/orders.ts`)

```typescript
import { Hono } from "hono";

const ordersRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// Liste des allergènes majeurs reconnus (base Codex Alimentarius / Décret 2012/2861)
const KNOWN_ALLERGENS = [
  "arachides", "gluten", "lait", "oeufs", "poisson",
  "crustaces", "soja", "fruits_a_coque", "celeri",
  "moutarde", "sesame", "sulfites", "lupin", "mollusques",
] as const;

interface OrderItemInput {
  product_id: string;
  quantity: number;
  options?: Array<{ id: string; name: string; price: number }>;
}

interface CreateOrderInput {
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  items: OrderItemInput[];
  delivery_type: "delivery" | "pickup" | "on_site";
  delivery_address?: string;
  payment_method: string;
  notes?: string;
  coupon_code?: string;
}

ordersRoutes.post("/", async (c) => {
  const supabase = c.var.supabase;
  const restaurantId = c.var.restaurantId;
  const body = await c.req.json<CreateOrderInput>();

  if (!body.items?.length) {
    return c.json({ error: "La commande doit contenir au moins un article" }, 400);
  }

  // ✅ Récupérer les produits avec prix TTC et allergènes (Art. 7-8, Loi 2011/012)
  const productIds = body.items.map((i) => i.product_id);
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, price, is_price_ttc, allergens, ingredients, is_available")
    .eq("restaurant_id", restaurantId)
    .in("id", productIds);

  if (productsError || !products?.length) {
    return c.json({ error: "Produits introuvables" }, 404);
  }

  // ✅ Vérifier la disponibilité de chaque produit
  const productMap = new Map(products.map((p) => [p.id, p]));
  for (const item of body.items) {
    const product = productMap.get(item.product_id);
    if (!product) {
      return c.json({ error: `Produit ${item.product_id} introuvable` }, 404);
    }
    if (!product.is_available) {
      return c.json({ error: `"${product.name}" n'est plus disponible` }, 400);
    }
  }

  // ✅ Calcul serveur du total (ne pas faire confiance au client)
  let subtotal = 0;
  const itemsSnapshot = body.items.map((item) => {
    const product = productMap.get(item.product_id)!;
    const optionsTotal = item.options?.reduce((sum, opt) => sum + opt.price, 0) ?? 0;
    const lineTotal = (product.price + optionsTotal) * item.quantity;
    subtotal += lineTotal;

    return {
      product_id: product.id,
      name: product.name,
      unit_price_ttc: product.price,        // ✅ Prix explicitement TTC
      quantity: item.quantity,
      options: item.options ?? [],
      line_total_ttc: lineTotal,            // ✅ Sous-total ligne TTC
      allergens: product.allergens ?? [],    // ✅ Allergènes du produit
      ingredients: product.ingredients,      // ✅ Ingrédients
    };
  });

  // ✅ Récupérer les frais du restaurant (transparence — Art. 8, Loi 2015/018)
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("delivery_fee, service_fee_percent, service_fee_fixed")
    .eq("id", restaurantId)
    .single();

  const deliveryFee =
    body.delivery_type === "delivery" ? (restaurant?.delivery_fee ?? 0) : 0;
  const serviceFee = restaurant?.service_fee_fixed
    ?? Math.round(subtotal * ((restaurant?.service_fee_percent ?? 0) / 100));

  // ✅ Calcul du total vérifiable côté serveur
  const totalTtc = subtotal + deliveryFee + serviceFee;

  // ✅ Collecte des allergènes combinés (information consommateur)
  const allAllergens = [
    ...new Set(itemsSnapshot.flatMap((item) => item.allergens)),
  ];

  const orderData = {
    restaurant_id: restaurantId,
    customer_id: body.customer_id ?? null,
    customer_name: body.customer_name,
    customer_phone: body.customer_phone,
    items: itemsSnapshot,                 // ✅ Snapshot enrichi avec prix TTC et allergènes
    subtotal,                             // ✅ Calculé côté serveur
    delivery_fee: deliveryFee,            // ✅ Frais de livraison explicite
    service_fee: serviceFee,              // ✅ Frais de service explicite
    total: totalTtc,                      // ✅ Total TTC = subtotal + livraison + service
    status: "pending" as const,
    delivery_type: body.delivery_type,
    delivery_address: body.delivery_address ?? null,
    payment_method: body.payment_method,
    payment_status: "pending" as const,
    notes: body.notes ?? null,
    allergens_summary: allAllergens,      // ✅ Résumé allergènes de la commande
    updated_at: new Date().toISOString(),
  };

  const { data: order, error } = await supabase
    .from("orders")
    .insert(orderData as any)
    .select()
    .single();

  if (error) {
    console.error("Create order error:", error);
    return c.json({ error: "Erreur lors de la création de la commande" }, 500);
  }

  // ✅ Retourner un accusé de réception structuré (Art. 13, Loi 2015/018)
  return c.json({
    success: true,
    order: {
      id: order.id,
      reference: String(order.id).slice(0, 8).toUpperCase(),
      items: itemsSnapshot.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unit_price_ttc: item.unit_price_ttc,
        line_total_ttc: item.line_total_ttc,
      })),
      price_breakdown: {
        subtotal_ttc: subtotal,           // ✅ Sous-total TTC
        delivery_fee: deliveryFee,        // ✅ Frais de livraison
        service_fee: serviceFee,          // ✅ Frais de service
        total_ttc: totalTtc,              // ✅ Total TTC
        currency: "XAF",
        note: "Tous les prix sont TTC (Toutes Taxes Comprises)",
      },
      allergens_warning: allAllergens.length > 0
        ? `⚠️ Cette commande contient les allergènes suivants : ${allAllergens.join(", ")}`
        : null,
      delivery_type: body.delivery_type,
      estimated_delivery: null,           // Sera mis à jour à l'acceptation
      status: "pending",
      created_at: order.created_at,
    },
  }, 201);
});
```

### 3. Route de réclamation (`packages/modules/orders/src/api/complaints.ts`)

```typescript
import { Hono } from "hono";

const complaintsRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// ✅ Dépôt de réclamation (Art. 25, Loi 2011/012)
complaintsRoutes.post("/", async (c) => {
  const supabase = c.var.supabase;
  const body = await c.req.json<{
    order_id: string;
    type: string;
    description: string;
    evidence_urls?: string[];
  }>();

  if (!body.order_id || !body.type || !body.description?.trim()) {
    return c.json({
      error: "order_id, type et description sont requis pour déposer une réclamation",
    }, 400);
  }

  // Vérifier que la commande appartient au client
  const { data: order } = await supabase
    .from("orders")
    .select("id, restaurant_id, customer_id, total")
    .eq("id", body.order_id)
    .single();

  if (!order) return c.json({ error: "Commande introuvable" }, 404);

  const { data: complaint, error } = await supabase
    .from("complaints")
    .insert({
      order_id: body.order_id,
      customer_id: c.var.userId,
      restaurant_id: order.restaurant_id,
      type: body.type,
      description: body.description.trim(),
      evidence_urls: body.evidence_urls ?? [],
      status: "open",
    })
    .select()
    .single();

  if (error) {
    console.error("Create complaint error:", error);
    return c.json({ error: "Erreur lors de la création de la réclamation" }, 500);
  }

  return c.json({
    success: true,
    complaint,
    message: "Votre réclamation a été enregistrée. Vous recevrez une réponse sous 48 heures.",
  }, 201);
});

// ✅ Demande de remboursement (Art. 14, Loi 2011/012)
complaintsRoutes.post("/:id/refund", async (c) => {
  const supabase = c.var.supabase;
  const complaintId = c.req.param("id");
  const body = await c.req.json<{ amount: number; reason: string; refund_method: string }>();

  const { data: complaint } = await supabase
    .from("complaints")
    .select("id, order_id, customer_id, restaurant_id, status")
    .eq("id", complaintId)
    .single();

  if (!complaint) return c.json({ error: "Réclamation introuvable" }, 404);
  if (complaint.status === "rejected") {
    return c.json({ error: "Cette réclamation a été rejetée" }, 400);
  }

  const { data: refund, error } = await supabase
    .from("refunds")
    .insert({
      order_id: complaint.order_id,
      complaint_id: complaintId,
      restaurant_id: complaint.restaurant_id,
      customer_id: complaint.customer_id,
      amount: body.amount,
      currency: "XAF",
      reason: body.reason,
      refund_method: body.refund_method ?? "wallet_credit",
      status: "pending",
    })
    .select()
    .single();

  if (error) return c.json({ error: "Erreur lors de la demande de remboursement" }, 500);

  // Mettre à jour le statut de la réclamation
  await supabase
    .from("complaints")
    .update({ status: "under_review", updated_at: new Date().toISOString() })
    .eq("id", complaintId);

  return c.json({
    success: true,
    refund,
    message: "Votre demande de remboursement est en cours de traitement.",
  }, 201);
});
```

### 4. Affichage produit conforme (composant React)

```tsx
// packages/modules/catalog/src/ui/components/ProductCard.tsx

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    is_price_ttc: boolean;
    allergens: string[];
    ingredients?: string;
    image_url?: string;
    is_available: boolean;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="rounded-lg border p-4">
      {product.image_url && (
        <img src={product.image_url} alt={product.name} className="w-full rounded-md" />
      )}
      <h3 className="mt-2 text-lg font-semibold">{product.name}</h3>

      {/* ✅ Description obligatoire (Art. 7, Loi 2011/012) */}
      <p className="text-sm text-surface-600">{product.description}</p>

      {/* ✅ Prix TTC affiché clairement (Art. 8, Loi 2011/012) */}
      <p className="mt-2 text-xl font-bold">
        {product.price.toLocaleString("fr-CM")} FCFA
        <span className="ml-1 text-xs font-normal text-surface-500">TTC</span>
      </p>

      {/* ✅ Allergènes signalés (Décret 2012/2861) */}
      {product.allergens.length > 0 && (
        <div className="mt-2 rounded bg-amber-50 p-2 text-xs text-amber-800">
          <span className="font-semibold">⚠️ Allergènes :</span>{" "}
          {product.allergens.join(", ")}
        </div>
      )}

      {/* ✅ Ingrédients si disponibles */}
      {product.ingredients && (
        <p className="mt-1 text-xs text-surface-500">
          <span className="font-medium">Ingrédients :</span> {product.ingredients}
        </p>
      )}

      {!product.is_available && (
        <p className="mt-2 text-sm font-medium text-red-600">Indisponible</p>
      )}
    </div>
  );
}
```

---

## Sanctions

### Sanctions civiles (Loi n°2011/012)

| Infraction | Sanction |
|---|---|
| Défaut d'information précontractuelle | Amende de 50 000 à 500 000 FCFA |
| Prix non affichés TTC | Amende de 100 000 à 1 000 000 FCFA |
| Non-conformité du produit livré | Remboursement intégral + dommages-intérêts |
| Refus de traiter une réclamation | Amende de 100 000 à 500 000 FCFA |
| Pratique commerciale trompeuse | Amende de 500 000 à 5 000 000 FCFA |

### Sanctions pénales

| Infraction | Amende | Emprisonnement |
|---|---|---|
| Tromperie sur la qualité/origine (Art. 18) | 1 000 000 – 5 000 000 FCFA | 15 jours – 6 mois |
| Publicité mensongère (Art. 6) | 500 000 – 5 000 000 FCFA | 15 jours – 6 mois |
| Vente de denrées impropres à la consommation | 500 000 – 10 000 000 FCFA | 3 mois – 3 ans |
| Récidive | Peines doublées | — |

### Sanctions administratives

- **Suspension temporaire d'activité** ordonnée par le Ministère du Commerce.
- **Fermeture de l'établissement** en cas de danger pour la santé publique.
- **Retrait du droit d'exercer** le commerce pour le dirigeant.
- **Publication de la sanction** dans les médias (Décision MINCOMMERCE).

### Recours du consommateur

- Réclamation directe auprès du professionnel (Art. 25).
- Saisine de la **Direction de la Concurrence et de la Protection du Consommateur** (MINCOMMERCE).
- Action en justice devant le tribunal de première instance.
- Recours aux associations de consommateurs agréées.

---

## Recommandations Techniques pour KBouffe

### Priorité 1 — Immédiat (bloquant)

1. **Ajouter les champs `allergens`, `ingredients` et `is_price_ttc`** à la table `products`. Rendre `description` obligatoire (NOT NULL).
2. **Calculer le total côté serveur** dans `POST /api/orders`. Ne jamais accepter un `total` fourni par le client sans vérification.
3. **Décomposer les prix dans la réponse de commande** : `subtotal_ttc`, `delivery_fee`, `service_fee`, `total_ttc` avec mention « Tous les prix sont TTC ».
4. **Afficher clairement « TTC »** à côté de chaque prix sur le dashboard et l'app mobile.
5. **Ajouter un avertissement allergènes** visible sur chaque fiche produit et dans le récapitulatif de commande.

### Priorité 2 — Court terme (1-2 semaines)

6. **Créer la table `complaints`** et l'endpoint `POST /api/complaints` pour les réclamations clients.
7. **Créer la table `refunds`** et le processus de remboursement.
8. **Envoyer un accusé de réception** par SMS transactionnel à chaque commande (référence, montant TTC, livraison estimée).
9. **Ajouter une page « Réclamation »** dans le dashboard client et l'app mobile.
10. **Implémenter la vérification de conformité** : comparer les articles livrés vs commandés (confirmation livreur).

### Priorité 3 — Moyen terme

11. **Système de notation** : permettre au client de signaler les non-conformités via le système de reviews.
12. **Politique de remboursement** claire et accessible (page dédiée dans l'app et le site).
13. **Information sur le droit de rétractation** : inclure dans les CGV que les denrées périssables sont exclues, mais que les articles non périssables (goodies, boissons scellées) bénéficient des 14 jours.
14. **Rapports de réclamations** pour les restaurateurs : taux de plaintes, types, temps de résolution.
15. **Médiation** : prévoir un mécanisme de médiation en cas de litige non résolu entre client et restaurateur.

---

## Références

1. **Loi-cadre n°2011/012 du 6 mai 2011** portant protection du consommateur au Cameroun — Articles 2, 3, 6, 7, 8, 12, 14, 18, 25, 30.
2. **Loi n°2015/018 du 21 décembre 2015** régissant le commerce électronique au Cameroun — Articles 8, 12, 13, 16.
3. **Décret n°2012/2861/PM** fixant les conditions d'étiquetage et de publicité des denrées alimentaires.
4. **Code Civil camerounais** — Obligations contractuelles, responsabilité du fait des produits.
5. **ANOR** — Agence des Normes et de la Qualité du Cameroun : Normes NC 801:2019.
6. **MINCOMMERCE** — Ministère du Commerce, Direction de la Concurrence et de la Protection du Consommateur.
7. **Codex Alimentarius** — Commission mixte FAO/OMS, Liste des allergènes majeurs.
8. **Acte Uniforme OHADA relatif au Droit Commercial Général** — Obligations du vendeur professionnel.
