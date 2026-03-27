# 🏷️ Allergènes & Traçabilité Alimentaire au Cameroun

## Résumé

La gestion des allergènes et la traçabilité alimentaire sont des obligations légales au Cameroun, encadrées par la réglementation nationale et les normes communautaires CEMAC. La plateforme **KBouffe** dispose actuellement d'un système partiel de gestion des allergènes (`allergens` en JSON, `is_halal`, `is_vegan`, `is_gluten_free`, `calories`) mais **ne dispose d'aucun mécanisme de** :

- ✅ **Existant** : Liste d'allergènes par produit (JSON libre), indicateurs diététiques (halal/vegan/sans gluten), calories
- ❌ **Manquant** : Traçabilité des fournisseurs, dates de péremption, rappels de produits, confirmation d'allergènes à la commande, suivi des lots, notification en cas de risque sanitaire

Les **arachides (groundnuts)** sont l'allergène le plus critique dans le contexte camerounais — présentes dans de très nombreux plats traditionnels (ndolé, sauce d'arachide, beignets, koki) — et l'allergie aux arachides est l'une des plus mortelles. L'absence de système de confirmation des allergènes expose KBouffe à une **responsabilité civile et pénale directe** en cas de réaction allergique grave.

---

## Textes de Loi Applicables

### 1. Loi n° 2011/012 du 6 mai 2011 — Protection du Consommateur

**Articles relatifs à l'information et l'étiquetage :**

- **Article 7** : Le professionnel est tenu de fournir au consommateur une information loyale, claire et complète sur les caractéristiques essentielles du produit, **y compris les risques que le produit peut présenter pour la santé**.
- **Article 8** : L'étiquetage, la présentation et la publicité des denrées alimentaires ne doivent pas être de nature à induire le consommateur en erreur, notamment sur la **composition** du produit.
- **Article 9** : Le consommateur a le droit d'être informé de la présence de **substances pouvant provoquer des réactions allergiques**.
- **Article 14** : Le professionnel est responsable de plein droit des dommages causés par un défaut de sécurité du produit.
- **Article 16** : En cas de danger grave ou immédiat, le professionnel doit **retirer le produit du marché** et en informer les autorités compétentes et les consommateurs.
- **Article 26** : Responsabilité solidaire des intermédiaires de la chaîne de distribution.

### 2. Réglementation CEMAC sur l'Étiquetage Alimentaire

Le Cameroun, en tant que membre de la CEMAC (Communauté Économique et Monétaire de l'Afrique Centrale), applique les textes communautaires :

- **Règlement n° 01/06-UEAC-CM du 19 mars 2006** — Harmonisation des législations alimentaires en zone CEMAC.
- **Directive CEMAC D/01/08** — Étiquetage des denrées alimentaires préemballées dans l'espace CEMAC.

**Exigences d'étiquetage CEMAC :**

| Information | Obligatoire | Description |
|---|---|---|
| **Dénomination de vente** | ✅ | Nom du plat |
| **Liste des ingrédients** | ✅ | Tous les ingrédients par ordre décroissant de poids |
| **Allergènes** | ✅ | Mise en évidence des substances allergéniques |
| **Date de fabrication** | ✅ | Date de préparation du plat |
| **Date limite de consommation** | ✅ | DLC pour les denrées périssables |
| **Conditions de conservation** | ✅ | Température de stockage recommandée |
| **Nom et adresse du fabricant** | ✅ | Identification du restaurant |
| **Pays d'origine** | ✅ | Pour les ingrédients importés |
| **Quantité nette** | ✅ | Poids ou volume de la portion |
| **Lot de fabrication** | ✅ | Numéro de lot pour la traçabilité |

### 3. Normes ANOR relatives aux allergènes et à l'étiquetage

- **NC 03:2000** — Étiquetage des denrées alimentaires préemballées : impose la déclaration des substances provoquant des hypersensibilités.
- **NC 04:2002** — Hygiène générale des denrées alimentaires : inclut les dispositions relatives à la prévention de la contamination croisée par les allergènes.
- **NC 226:2003-06** — Code d'usages pour les aliments préemballés : exige l'identification claire des allergènes dans la liste des ingrédients.

### 4. Liste des Allergènes à Déclaration Obligatoire

La liste camerounaise s'aligne sur le Codex Alimentarius (CAC/GL 23-1997) avec des adaptations au contexte local :

| # | Allergène | Nom local / Contexte camerounais | Criticité |
|---|---|---|---|
| 1 | **Arachides (cacahuètes)** | Présentes dans le ndolé, sauce d'arachide, beignets, koki, egusi | 🔴 **CRITIQUE** |
| 2 | **Fruits à coque** | Noix de coco (très courante), noix de cajou | 🟠 Élevée |
| 3 | **Lait et produits laitiers** | Lait concentré, fromage Wagashi | 🟠 Élevée |
| 4 | **Œufs** | Omelettes, pâtisseries, beignets | 🟡 Modérée |
| 5 | **Poisson** | Très courant dans la cuisine camerounaise (stockfish, crevettes séchées) | 🟡 Modérée |
| 6 | **Crustacés** | Crevettes d'eau douce, crabes | 🟡 Modérée |
| 7 | **Soja** | Huile de soja (très utilisée), sauce soja | 🟡 Modérée |
| 8 | **Céréales contenant du gluten** | Blé (pain, beignets), sorgho | 🟡 Modérée |
| 9 | **Sésame** | Utilisé dans certaines préparations du Nord | 🟢 Faible |
| 10 | **Moutarde** | Présente dans certaines sauces | 🟢 Faible |
| 11 | **Céleri** | Rare dans la cuisine camerounaise | 🟢 Faible |
| 12 | **Lupin** | Rare | 🟢 Faible |
| 13 | **Mollusques** | Escargots (nkui), huîtres | 🟢 Faible |
| 14 | **Sulfites (> 10 mg/kg)** | Présents dans certaines boissons | 🟢 Faible |

> ⚠️ **Contexte camerounais critique** : L'arachide est l'ingrédient le plus omniprésent de la cuisine camerounaise. Elle peut être présente sous forme invisible (huile d'arachide, pâte d'arachide, poudre) dans des plats qui ne semblent pas en contenir. La contamination croisée est extrêmement fréquente dans les cuisines camerounaises.

### 5. Traçabilité Alimentaire — Cadre Juridique

- **Loi n° 2011/012, Article 15** : Le professionnel doit être en mesure d'identifier **l'origine de tous les ingrédients** utilisés dans la préparation des denrées.
- **Décret n° 2012/2861/PM, Article 18** : Tout établissement de restauration doit tenir un **registre des fournisseurs** avec les informations suivantes :
  - Nom et coordonnées du fournisseur
  - Nature des produits fournis
  - Date et quantité de chaque livraison
  - Numéro de lot (le cas échéant)
  - Date de péremption des produits livrés
- **NC 04:2002, Section 8** : Exige un système de traçabilité permettant de remonter la chaîne alimentaire "**de la fourche à la fourchette**" (farm to fork).

### 6. Rappel de Produits et Gestion de Crise

- **Loi n° 2011/012, Article 16** : En cas de danger grave ou immédiat pour la santé du consommateur, le professionnel doit :
  1. **Cesser immédiatement** la commercialisation du produit
  2. **Retirer** le produit des circuits de distribution
  3. **Informer** les autorités compétentes (MINSANTE, ANOR)
  4. **Notifier** les consommateurs ayant acheté le produit
  5. **Prendre les mesures** nécessaires pour prévenir les risques

- **Décret 2012/2861/PM, Article 22** : Les établissements doivent disposer d'une **procédure de rappel** documentée et testée régulièrement.

### 7. Exigences Spécifiques pour la Livraison Alimentaire

- **Décret 2012/2861/PM, Article 10** : Les contenants de livraison doivent :
  - Être de qualité alimentaire (matériaux autorisés au contact des aliments)
  - Porter une étiquette indiquant : nom du plat, liste des allergènes, date et heure de préparation, température de conservation recommandée
  - Maintenir la température appropriée pendant toute la durée du transport
  - Être fermés de manière à empêcher toute contamination

- **Article 11** : Le temps de livraison maximum recommandé est de **45 minutes** pour les plats chauds et **30 minutes** pour les plats froids.

---

## Obligations pour la Plateforme

### Obligations d'information sur les allergènes

| Obligation | Description | Base légale |
|---|---|---|
| **Déclaration complète** | Lister tous les allergènes présents dans chaque plat, y compris les traces potentielles | Loi 2011/012, Art. 7-9 ; NC 03:2000 |
| **Mise en évidence** | Les allergènes doivent être visuellement distincts dans la liste d'ingrédients (gras, couleur, icône) | Directive CEMAC D/01/08 |
| **Confirmation à la commande** | Demander au client de confirmer sa prise de connaissance des allergènes avant validation | Loi 2011/012, Art. 7 (devoir d'information renforcé) |
| **Profil allergique client** | Permettre au client de renseigner ses allergies pour filtrer/alerter automatiquement | Bonne pratique (recommandation ANOR) |
| **Avertissement contamination croisée** | Mentionner les risques de contamination croisée en cuisine | NC 04:2002, Section 4 |

### Obligations de traçabilité

| Obligation | Description | Base légale |
|---|---|---|
| **Registre fournisseurs** | Chaque restaurant doit documenter ses fournisseurs dans la plateforme | Décret 2012/2861, Art. 18 |
| **Suivi des lots** | Identifier le lot de chaque ingrédient utilisé | NC 04:2002, Section 8 |
| **Date de péremption** | Suivre la DLC (Date Limite de Consommation) des plats préparés | Directive CEMAC D/01/08 |
| **Historique des commandes** | Conserver l'historique complet pour remonter en cas d'incident | Loi 2011/012, Art. 15 |
| **Durée de conservation** | Archiver les données de traçabilité pendant **minimum 5 ans** | Recommandation Codex Alimentarius |

### Obligations de rappel et notification

| Obligation | Description | Base légale |
|---|---|---|
| **Procédure de rappel** | Disposer d'un processus documenté de retrait de produit dangereux | Loi 2011/012, Art. 16 |
| **Notification clients** | Notifier tous les clients ayant commandé un produit rappelé | Décret 2012/2861, Art. 22 |
| **Signalement autorités** | Signaler tout incident sanitaire au MINSANTE dans les 24h | Loi 96/03, Art. 29 |
| **Suspension automatique** | Retirer immédiatement le produit de la plateforme | Loi 2011/012, Art. 16 |

---

## ❌ Exemple Non-Conforme

### Système actuel de gestion des allergènes dans KBouffe

```sql
-- ❌ SCHÉMA ACTUEL : Allergènes stockés en JSON libre, aucune traçabilité
-- Source : supabase-types.ts (colonnes produits)

-- La table products actuelle ne contient que :
--   allergens     JSON    (tableau libre, aucune standardisation)
--   is_halal      BOOLEAN
--   is_vegan      BOOLEAN
--   is_gluten_free BOOLEAN
--   calories      INTEGER

-- ❌ MANQUANT :
--   - Aucune liste standardisée d'allergènes
--   - Aucun suivi de contamination croisée
--   - Aucune date de péremption
--   - Aucune traçabilité fournisseur
--   - Aucun mécanisme de rappel
--   - Aucune confirmation allergène à la commande
```

### Code API actuel — Normalisation insuffisante

```typescript
// ❌ NON-CONFORME : Gestion actuelle des allergènes
// Source : packages/modules/catalog/src/api/products.ts

function normalizeAllergens(allergens: any): string[] | null {
    if (!allergens) return null;
    if (Array.isArray(allergens)) return allergens.filter(a => !!a).map(a => a.trim());
    if (typeof allergens === "string") {
        return allergens.split(",").map(a => a.trim()).filter(a => !!a);
    }
    return null;
}

// Problèmes :
// ❌ Aucune validation contre une liste officielle d'allergènes
// ❌ Pas de standardisation des noms (ex: "cacahuète" vs "arachide" vs "peanut")
// ❌ Pas de suivi des traces de contamination croisée
// ❌ Pas de lien avec un référentiel normé
// ❌ Allergènes stockés comme chaînes libres — risque de fautes de frappe
```

### Création de produit actuelle — Sans traçabilité

```typescript
// ❌ NON-CONFORME : Création de produit sans traçabilité ni DLC
// Source : packages/modules/catalog/src/api/products.ts (lignes 78-86)

app.post("/", async (c) => {
    const body = await c.req.json();
    const restaurantId = c.get("restaurantId");
    const supabase = c.get("supabase");

    const { data, error } = await supabase
        .from("products")
        .insert({
            restaurant_id: restaurantId,
            category_id: body.category_id,
            name: body.name,
            description: body.description,
            price: body.price,
            image_url: body.image_url,
            is_available: body.is_available ?? true,
            // ❌ Allergènes en texte libre, non validés
            allergens: normalizeAllergens(body.allergens),
            is_halal: body.is_halal ?? false,
            is_vegan: body.is_vegan ?? false,
            is_gluten_free: body.is_gluten_free ?? false,
            calories: body.calories || null,
            // ❌ Aucune date de péremption
            // ❌ Aucune traçabilité fournisseur
            // ❌ Aucun numéro de lot
            // ❌ Aucune mention de contamination croisée
        })
        .select()
        .single();

    if (error) return c.json({ error: "Erreur lors de la création du produit" }, 500);
    return c.json({ success: true, product: data });
});
```

### Flux de commande actuel — Sans confirmation d'allergènes

```typescript
// ❌ NON-CONFORME : Commande passée sans vérification d'allergènes
// Le client peut commander un plat contenant un allergène auquel il est sensible
// sans AUCUNE confirmation ni avertissement

// Flux actuel :
// 1. Client consulte le menu → allergènes affichés (si renseignés)
// 2. Client ajoute au panier → aucune vérification
// 3. Client valide la commande → aucune confirmation allergènes
// 4. Commande transmise au restaurant → pas de mention spéciale allergènes
// 5. Aucune possibilité de rappel si problème détecté après livraison
```

---

## ✅ Exemple Conforme

### Migration SQL — Système complet d'allergènes et traçabilité

```sql
-- ✅ CONFORME : Migration pour le système d'allergènes et de traçabilité
-- À créer dans : supabase/migrations/XXX_add_allergen_traceability.sql

-- 1. Table de référence des allergènes standardisés
CREATE TABLE allergen_reference (
    id TEXT PRIMARY KEY,               -- Code court : 'arachides', 'lait', 'oeufs', etc.
    name_fr TEXT NOT NULL,             -- Nom officiel en français
    name_en TEXT NOT NULL,             -- Nom en anglais
    category TEXT NOT NULL,            -- 'majeur', 'mineur'
    icon TEXT,                         -- Emoji ou code icône : '🥜', '🥛', '🥚'
    description_fr TEXT,               -- Description en français
    cameroon_criticality TEXT NOT NULL -- 'critique', 'elevee', 'moderee', 'faible'
        CHECK (cameroon_criticality IN ('critique', 'elevee', 'moderee', 'faible')),
    common_in_dishes TEXT[],           -- Plats camerounais courants contenant cet allergène
    sort_order INTEGER DEFAULT 0
);

-- Données de référence : allergènes adaptés au contexte camerounais
INSERT INTO allergen_reference (id, name_fr, name_en, category, icon, cameroon_criticality, common_in_dishes, sort_order) VALUES
    ('arachides',    'Arachides (cacahuètes)',          'Peanuts',          'majeur', '🥜', 'critique',  ARRAY['Ndolé', 'Sauce arachide', 'Koki', 'Beignets', 'Egusi'], 1),
    ('fruits_coque', 'Fruits à coque',                  'Tree nuts',        'majeur', '🌰', 'elevee',   ARRAY['Desserts', 'Gâteaux'], 2),
    ('lait',         'Lait et produits laitiers',        'Milk',             'majeur', '🥛', 'elevee',   ARRAY['Fromage Wagashi', 'Yaourt', 'Pâtisseries'], 3),
    ('oeufs',        'Œufs',                            'Eggs',             'majeur', '🥚', 'moderee',  ARRAY['Omelette', 'Beignets', 'Pâtisseries'], 4),
    ('poisson',      'Poisson',                         'Fish',             'majeur', '🐟', 'moderee',  ARRAY['Stockfish', 'Poisson braisé', 'Mbongo'], 5),
    ('crustaces',    'Crustacés',                       'Crustaceans',      'majeur', '🦐', 'moderee',  ARRAY['Crevettes grillées', 'Sauce crevette'], 6),
    ('soja',         'Soja',                            'Soy',              'majeur', '🫘', 'moderee',  ARRAY['Huile de soja', 'Sauce soja'], 7),
    ('gluten',       'Céréales contenant du gluten',    'Gluten cereals',   'majeur', '🌾', 'moderee',  ARRAY['Pain', 'Beignets', 'Pâtes'], 8),
    ('sesame',       'Sésame',                          'Sesame',           'mineur', '⚪', 'faible',   ARRAY['Certaines sauces du Nord'], 9),
    ('moutarde',     'Moutarde',                        'Mustard',          'mineur', '🟡', 'faible',   ARRAY['Sauces industrielles'], 10),
    ('celeri',       'Céleri',                          'Celery',           'mineur', '🥬', 'faible',   ARRAY[]::TEXT[], 11),
    ('lupin',        'Lupin',                           'Lupin',            'mineur', '🌿', 'faible',   ARRAY[]::TEXT[], 12),
    ('mollusques',   'Mollusques',                      'Mollusks',         'mineur', '🐌', 'faible',   ARRAY['Escargots (nkui)'], 13),
    ('sulfites',     'Sulfites (> 10 mg/kg)',           'Sulfites',         'mineur', '⚗️', 'faible',   ARRAY['Vin', 'Bières'], 14);


-- 2. Table de liaison produit ↔ allergènes (remplace le JSON libre)
CREATE TABLE product_allergens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    allergen_id TEXT NOT NULL REFERENCES allergen_reference(id),
    presence_type TEXT NOT NULL DEFAULT 'present'
        CHECK (presence_type IN ('present', 'traces', 'cross_contamination')),
    -- 'present' : ingrédient direct
    -- 'traces' : peut contenir des traces
    -- 'cross_contamination' : risque de contamination croisée en cuisine
    notes TEXT, -- ex: "Huile d'arachide utilisée pour la friture"
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(product_id, allergen_id)
);

-- 3. Table de traçabilité des fournisseurs
CREATE TABLE restaurant_suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_phone TEXT,
    contact_email TEXT,
    address TEXT,
    city TEXT,
    supply_type TEXT NOT NULL CHECK (supply_type IN (
        'viandes', 'poissons', 'legumes', 'fruits', 'epices',
        'cereales', 'huiles', 'boissons', 'produits_laitiers', 'autre'
    )),
    license_number TEXT,           -- Numéro d'agrément du fournisseur
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Table des livraisons fournisseurs (traçabilité lot par lot)
CREATE TABLE supplier_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES restaurant_suppliers(id) ON DELETE CASCADE,
    delivery_date DATE NOT NULL,
    items JSONB NOT NULL,
    -- items: [{ name: "Arachides décortiquées", quantity: "10kg", batch_number: "LOT2025-001", expiry_date: "2025-08-15" }]
    received_by TEXT,              -- Nom de la personne qui a réceptionné
    temperature_on_arrival DECIMAL, -- Température à la réception (chaîne du froid)
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Informations de péremption et lot pour les plats préparés
ALTER TABLE products ADD COLUMN IF NOT EXISTS shelf_life_hours INTEGER;
    -- Durée de vie après préparation (ex: 4h pour un plat chaud, 24h réfrigéré)
ALTER TABLE products ADD COLUMN IF NOT EXISTS storage_temperature TEXT;
    -- 'ambient' | 'refrigerated' | 'frozen' | 'hot'
ALTER TABLE products ADD COLUMN IF NOT EXISTS cross_contamination_warning TEXT;
    -- Message d'avertissement de contamination croisée

-- 6. Profil allergique du client
CREATE TABLE user_allergen_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    allergen_id TEXT NOT NULL REFERENCES allergen_reference(id),
    severity TEXT NOT NULL DEFAULT 'moderate'
        CHECK (severity IN ('mild', 'moderate', 'severe', 'anaphylactic')),
    -- 'mild' : inconfort léger
    -- 'moderate' : réaction significative
    -- 'severe' : réaction grave nécessitant un traitement
    -- 'anaphylactic' : risque de choc anaphylactique (urgence vitale)
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, allergen_id)
);

-- 7. Confirmation d'allergènes à la commande
ALTER TABLE orders ADD COLUMN IF NOT EXISTS allergen_acknowledgment BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS allergen_acknowledgment_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS allergen_notes TEXT;
    -- Notes spéciales du client (ex: "Allergie sévère aux arachides, svp vérifier")

-- 8. Système de rappel de produits
CREATE TABLE product_recalls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    recall_type TEXT NOT NULL CHECK (recall_type IN (
        'allergen_undeclared',       -- Allergène non déclaré
        'contamination',             -- Contamination (bactérienne, chimique)
        'expired_ingredients',       -- Ingrédients périmés utilisés
        'temperature_breach',        -- Rupture chaîne du froid
        'foreign_body',              -- Corps étranger
        'customer_reaction',         -- Réaction allergique signalée
        'authority_order',           -- Ordre de rappel des autorités
        'other'
    )),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    affected_date_from DATE,       -- Période affectée (début)
    affected_date_to DATE,         -- Période affectée (fin)
    affected_orders_count INTEGER,
    status TEXT NOT NULL DEFAULT 'initiated'
        CHECK (status IN ('initiated', 'in_progress', 'notifications_sent', 'resolved', 'escalated')),

    -- Actions prises
    product_suspended_at TIMESTAMPTZ,
    customers_notified_at TIMESTAMPTZ,
    authorities_notified_at TIMESTAMPTZ,
    authority_reference TEXT,       -- Numéro de dossier MINSANTE
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES users(id),

    initiated_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Notifications de rappel aux clients affectés
CREATE TABLE recall_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recall_id UUID NOT NULL REFERENCES product_recalls(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id),
    user_id UUID NOT NULL REFERENCES users(id),
    notification_type TEXT NOT NULL CHECK (notification_type IN ('push', 'sms', 'email', 'in_app')),
    sent_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index de performance
CREATE INDEX idx_product_allergens_product ON product_allergens(product_id);
CREATE INDEX idx_product_allergens_allergen ON product_allergens(allergen_id);
CREATE INDEX idx_user_allergen_profiles_user ON user_allergen_profiles(user_id);
CREATE INDEX idx_restaurant_suppliers_restaurant ON restaurant_suppliers(restaurant_id);
CREATE INDEX idx_supplier_deliveries_restaurant ON supplier_deliveries(restaurant_id);
CREATE INDEX idx_supplier_deliveries_supplier ON supplier_deliveries(supplier_id);
CREATE INDEX idx_supplier_deliveries_date ON supplier_deliveries(delivery_date DESC);
CREATE INDEX idx_product_recalls_restaurant ON product_recalls(restaurant_id);
CREATE INDEX idx_product_recalls_product ON product_recalls(product_id);
CREATE INDEX idx_product_recalls_status ON product_recalls(status);
CREATE INDEX idx_recall_notifications_recall ON recall_notifications(recall_id);
CREATE INDEX idx_recall_notifications_user ON recall_notifications(user_id);
CREATE INDEX idx_recall_notifications_order ON recall_notifications(order_id);

-- RLS Policies
ALTER TABLE allergen_reference ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_allergen_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_recalls ENABLE ROW LEVEL SECURITY;
ALTER TABLE recall_notifications ENABLE ROW LEVEL SECURITY;

-- Allergènes de référence : lecture publique
CREATE POLICY "public_read_allergen_reference"
    ON allergen_reference FOR SELECT USING (true);

-- Allergènes produit : lecture publique (les clients doivent voir)
CREATE POLICY "public_read_product_allergens"
    ON product_allergens FOR SELECT USING (true);

-- Restaurant owners gèrent leurs propres allergènes produit
CREATE POLICY "owners_manage_product_allergens"
    ON product_allergens FOR ALL
    USING (product_id IN (
        SELECT p.id FROM products p
        JOIN restaurants r ON p.restaurant_id = r.id
        WHERE r.owner_id = auth.uid()
    ));

-- Profil allergique : l'utilisateur gère le sien
CREATE POLICY "users_manage_own_allergen_profile"
    ON user_allergen_profiles FOR ALL
    USING (user_id = auth.uid());

-- Fournisseurs : le propriétaire du restaurant gère
CREATE POLICY "owners_manage_suppliers"
    ON restaurant_suppliers FOR ALL
    USING (restaurant_id IN (
        SELECT id FROM restaurants WHERE owner_id = auth.uid()
    ));

-- Livraisons fournisseurs : le propriétaire gère
CREATE POLICY "owners_manage_supplier_deliveries"
    ON supplier_deliveries FOR ALL
    USING (restaurant_id IN (
        SELECT id FROM restaurants WHERE owner_id = auth.uid()
    ));

-- Rappels : admins gèrent, propriétaires voient les leurs
CREATE POLICY "owners_view_own_recalls"
    ON product_recalls FOR SELECT
    USING (restaurant_id IN (
        SELECT id FROM restaurants WHERE owner_id = auth.uid()
    ));

CREATE POLICY "admins_manage_recalls"
    ON product_recalls FOR ALL
    USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- Notifications de rappel : le client voit les siennes
CREATE POLICY "users_view_own_recall_notifications"
    ON recall_notifications FOR SELECT
    USING (user_id = auth.uid());
```

### Interface TypeScript conforme — Types complets

```typescript
// ✅ CONFORME : Types pour le système d'allergènes et de traçabilité
// À ajouter dans : packages/shared-types/index.ts

// Liste standardisée des allergènes (alignée sur allergen_reference)
export type AllergenId =
    | "arachides"
    | "fruits_coque"
    | "lait"
    | "oeufs"
    | "poisson"
    | "crustaces"
    | "soja"
    | "gluten"
    | "sesame"
    | "moutarde"
    | "celeri"
    | "lupin"
    | "mollusques"
    | "sulfites";

export type AllergenPresenceType = "present" | "traces" | "cross_contamination";
export type AllergenSeverity = "mild" | "moderate" | "severe" | "anaphylactic";
export type CameroonCriticality = "critique" | "elevee" | "moderee" | "faible";

export interface AllergenReference {
    id: AllergenId;
    nameFr: string;
    nameEn: string;
    category: "majeur" | "mineur";
    icon: string;
    descriptionFr: string | null;
    cameroonCriticality: CameroonCriticality;
    commonInDishes: string[];
    sortOrder: number;
}

export interface ProductAllergen {
    id: string;
    productId: string;
    allergenId: AllergenId;
    presenceType: AllergenPresenceType;
    notes: string | null;
}

export interface UserAllergenProfile {
    id: string;
    userId: string;
    allergenId: AllergenId;
    severity: AllergenSeverity;
    notes: string | null;
}

export interface RestaurantSupplier {
    id: string;
    restaurantId: string;
    name: string;
    contactPhone: string | null;
    contactEmail: string | null;
    address: string | null;
    city: string | null;
    supplyType: "viandes" | "poissons" | "legumes" | "fruits" | "epices" |
                "cereales" | "huiles" | "boissons" | "produits_laitiers" | "autre";
    licenseNumber: string | null;
    isVerified: boolean;
    verifiedAt: string | null;
}

export interface SupplierDeliveryItem {
    name: string;
    quantity: string;
    batchNumber: string | null;
    expiryDate: string | null;
}

export interface SupplierDelivery {
    id: string;
    restaurantId: string;
    supplierId: string;
    deliveryDate: string;
    items: SupplierDeliveryItem[];
    receivedBy: string | null;
    temperatureOnArrival: number | null;
    notes: string | null;
}

export type RecallType =
    | "allergen_undeclared"
    | "contamination"
    | "expired_ingredients"
    | "temperature_breach"
    | "foreign_body"
    | "customer_reaction"
    | "authority_order"
    | "other";

export type RecallSeverity = "low" | "medium" | "high" | "critical";
export type RecallStatus = "initiated" | "in_progress" | "notifications_sent" | "resolved" | "escalated";

export interface ProductRecall {
    id: string;
    restaurantId: string;
    productId: string | null;
    recallType: RecallType;
    severity: RecallSeverity;
    title: string;
    description: string;
    affectedDateFrom: string | null;
    affectedDateTo: string | null;
    affectedOrdersCount: number | null;
    status: RecallStatus;
    productSuspendedAt: string | null;
    customersNotifiedAt: string | null;
    authoritiesNotifiedAt: string | null;
    authorityReference: string | null;
    resolutionNotes: string | null;
    resolvedAt: string | null;
    initiatedBy: string;
}
```

### Route API conforme — Gestion des allergènes avec validation

```typescript
// ✅ CONFORME : API de gestion des allergènes avec validation stricte
// À créer dans : packages/modules/catalog/src/api/allergens.ts

import { Hono } from "hono";
import type { AppEnv } from "../types";

const VALID_ALLERGEN_IDS = [
    "arachides", "fruits_coque", "lait", "oeufs", "poisson",
    "crustaces", "soja", "gluten", "sesame", "moutarde",
    "celeri", "lupin", "mollusques", "sulfites",
] as const;

const VALID_PRESENCE_TYPES = ["present", "traces", "cross_contamination"] as const;

const allergenRoutes = new Hono<AppEnv>();

// Récupérer la liste de référence des allergènes
allergenRoutes.get("/allergens/reference", async (c) => {
    const supabase = c.get("supabase");

    const { data, error } = await supabase
        .from("allergen_reference")
        .select("*")
        .order("sort_order");

    if (error) return c.json({ error: "Erreur lors de la récupération des allergènes" }, 500);
    return c.json({ success: true, allergens: data });
});

// Définir les allergènes d'un produit (remplace le JSON libre)
allergenRoutes.put("/products/:productId/allergens", async (c) => {
    const productId = c.req.param("productId");
    const restaurantId = c.get("restaurantId");
    const supabase = c.get("supabase");
    const body = await c.req.json();

    // Vérifier que le produit appartient au restaurant
    const { data: product } = await supabase
        .from("products")
        .select("id")
        .eq("id", productId)
        .eq("restaurant_id", restaurantId)
        .single();

    if (!product) {
        return c.json({ error: "Produit non trouvé" }, 404);
    }

    // Valider les allergènes
    const allergens: Array<{
        allergen_id: string;
        presence_type: string;
        notes?: string;
    }> = body.allergens ?? [];

    for (const allergen of allergens) {
        if (!VALID_ALLERGEN_IDS.includes(allergen.allergen_id as any)) {
            return c.json({
                error: `Allergène invalide : "${allergen.allergen_id}". ` +
                    `Valeurs autorisées : ${VALID_ALLERGEN_IDS.join(", ")}`,
                code: "INVALID_ALLERGEN_ID",
            }, 400);
        }
        if (!VALID_PRESENCE_TYPES.includes(allergen.presence_type as any)) {
            return c.json({
                error: `Type de présence invalide : "${allergen.presence_type}". ` +
                    `Valeurs autorisées : ${VALID_PRESENCE_TYPES.join(", ")}`,
                code: "INVALID_PRESENCE_TYPE",
            }, 400);
        }
    }

    // Supprimer les allergènes existants et les remplacer
    await supabase
        .from("product_allergens")
        .delete()
        .eq("product_id", productId);

    if (allergens.length > 0) {
        const insertData = allergens.map((a) => ({
            product_id: productId,
            allergen_id: a.allergen_id,
            presence_type: a.presence_type,
            notes: a.notes || null,
        }));

        const { error: insertError } = await supabase
            .from("product_allergens")
            .insert(insertData);

        if (insertError) {
            return c.json({ error: "Erreur lors de la mise à jour des allergènes" }, 500);
        }
    }

    // Mettre à jour le champ legacy pour compatibilité
    const allergenNames = allergens
        .filter((a) => a.presence_type === "present")
        .map((a) => a.allergen_id);

    await supabase
        .from("products")
        .update({
            allergens: allergenNames.length > 0 ? allergenNames : null,
            updated_at: new Date().toISOString(),
        })
        .eq("id", productId);

    return c.json({
        success: true,
        message: `${allergens.length} allergène(s) mis à jour pour ce produit.`,
    });
});

// Vérifier les conflits allergènes pour une commande
allergenRoutes.post("/orders/check-allergens", async (c) => {
    const userId = c.get("userId");
    const supabase = c.get("supabase");
    const body = await c.req.json();

    const productIds: string[] = body.product_ids ?? [];
    if (productIds.length === 0) {
        return c.json({ error: "Aucun produit à vérifier" }, 400);
    }

    // Récupérer le profil allergique du client
    const { data: userAllergens } = await supabase
        .from("user_allergen_profiles")
        .select("allergen_id, severity")
        .eq("user_id", userId);

    if (!userAllergens || userAllergens.length === 0) {
        return c.json({
            success: true,
            hasProfile: false,
            conflicts: [],
            message: "Aucun profil allergique renseigné. " +
                "Nous vous recommandons de renseigner vos allergies dans votre profil.",
        });
    }

    // Récupérer les allergènes des produits commandés
    const { data: productAllergens } = await supabase
        .from("product_allergens")
        .select(`
            product_id,
            allergen_id,
            presence_type,
            notes,
            products(name),
            allergen_reference(name_fr, icon, cameroon_criticality)
        `)
        .in("product_id", productIds);

    // Détecter les conflits
    const userAllergenIds = new Set(userAllergens.map((a) => a.allergen_id));
    const conflicts: Array<{
        productId: string;
        productName: string;
        allergenId: string;
        allergenName: string;
        allergenIcon: string;
        presenceType: string;
        userSeverity: string;
        cameroonCriticality: string;
    }> = [];

    for (const pa of productAllergens ?? []) {
        if (userAllergenIds.has(pa.allergen_id)) {
            const userAllergen = userAllergens.find((a) => a.allergen_id === pa.allergen_id);
            conflicts.push({
                productId: pa.product_id,
                productName: (pa as any).products?.name ?? "Produit inconnu",
                allergenId: pa.allergen_id,
                allergenName: (pa as any).allergen_reference?.name_fr ?? pa.allergen_id,
                allergenIcon: (pa as any).allergen_reference?.icon ?? "⚠️",
                presenceType: pa.presence_type,
                userSeverity: userAllergen?.severity ?? "moderate",
                cameroonCriticality: (pa as any).allergen_reference?.cameroon_criticality ?? "moderee",
            });
        }
    }

    // Classer les conflits par sévérité
    const severityOrder = { anaphylactic: 0, severe: 1, moderate: 2, mild: 3 };
    conflicts.sort((a, b) =>
        (severityOrder[a.userSeverity as keyof typeof severityOrder] ?? 3) -
        (severityOrder[b.userSeverity as keyof typeof severityOrder] ?? 3)
    );

    const hasCritical = conflicts.some(
        (c) => c.userSeverity === "anaphylactic" || c.userSeverity === "severe"
    );

    return c.json({
        success: true,
        hasProfile: true,
        conflicts,
        hasCriticalConflict: hasCritical,
        message: conflicts.length > 0
            ? `⚠️ ATTENTION : ${conflicts.length} conflit(s) allergène(s) détecté(s). ` +
              (hasCritical
                  ? "RISQUE GRAVE — Veuillez vérifier attentivement avant de commander."
                  : "Veuillez vérifier avant de confirmer votre commande.")
            : "Aucun conflit détecté avec votre profil allergique.",
    });
});

export { allergenRoutes };
```

### Système de rappel de produits

```typescript
// ✅ CONFORME : Système de rappel de produits
// À créer dans : packages/modules/catalog/src/api/recalls.ts

import { Hono } from "hono";
import type { AppEnv } from "../types";

const recallRoutes = new Hono<AppEnv>();

// Initier un rappel de produit
recallRoutes.post("/products/:productId/recall", async (c) => {
    const productId = c.req.param("productId");
    const restaurantId = c.get("restaurantId");
    const userId = c.get("userId");
    const supabase = c.get("supabase");
    const body = await c.req.json();

    // Vérifier que le produit appartient au restaurant
    const { data: product } = await supabase
        .from("products")
        .select("id, name, restaurant_id")
        .eq("id", productId)
        .eq("restaurant_id", restaurantId)
        .single();

    if (!product) {
        return c.json({ error: "Produit non trouvé" }, 404);
    }

    // 1. Suspendre immédiatement le produit (Art. 16 - Loi 2011/012)
    await supabase
        .from("products")
        .update({ is_available: false, updated_at: new Date().toISOString() })
        .eq("id", productId);

    // 2. Identifier les commandes affectées
    const affectedDateFrom = body.affected_date_from || new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString().split("T")[0];
    const affectedDateTo = body.affected_date_to || new Date().toISOString().split("T")[0];

    const { data: affectedOrders } = await supabase
        .from("order_items")
        .select(`
            order_id,
            orders(id, user_id, created_at, status)
        `)
        .eq("product_id", productId)
        .gte("created_at", affectedDateFrom)
        .lte("created_at", affectedDateTo);

    const uniqueOrders = new Map<string, { orderId: string; userId: string }>();
    for (const item of affectedOrders ?? []) {
        const order = (item as any).orders;
        if (order && !uniqueOrders.has(order.id)) {
            uniqueOrders.set(order.id, {
                orderId: order.id,
                userId: order.user_id,
            });
        }
    }

    // 3. Créer le rappel
    const { data: recall, error: recallError } = await supabase
        .from("product_recalls")
        .insert({
            restaurant_id: restaurantId,
            product_id: productId,
            recall_type: body.recall_type || "other",
            severity: body.severity || "high",
            title: body.title || `Rappel : ${product.name}`,
            description: body.description,
            affected_date_from: affectedDateFrom,
            affected_date_to: affectedDateTo,
            affected_orders_count: uniqueOrders.size,
            status: "initiated",
            product_suspended_at: new Date().toISOString(),
            initiated_by: userId,
        })
        .select()
        .single();

    if (recallError) {
        return c.json({ error: "Erreur lors de la création du rappel" }, 500);
    }

    // 4. Créer les notifications pour chaque client affecté
    const notifications = Array.from(uniqueOrders.values()).map((order) => ({
        recall_id: recall.id,
        order_id: order.orderId,
        user_id: order.userId,
        notification_type: "in_app" as const,
        message: `⚠️ RAPPEL PRODUIT : Le produit "${product.name}" que vous avez commandé ` +
            `fait l'objet d'un rappel pour cause de : ${body.description}. ` +
            `Si vous ressentez des symptômes, consultez immédiatement un médecin. ` +
            `Contactez-nous pour un remboursement.`,
    }));

    if (notifications.length > 0) {
        await supabase
            .from("recall_notifications")
            .insert(notifications);

        // Mettre à jour le statut du rappel
        await supabase
            .from("product_recalls")
            .update({
                status: "notifications_sent",
                customers_notified_at: new Date().toISOString(),
            })
            .eq("id", recall.id);
    }

    // 5. TODO: Envoyer des notifications push/SMS via kbouffe-sms-queue
    // pour les cas de sévérité 'critical' ou 'high'

    return c.json({
        success: true,
        recall: {
            id: recall.id,
            productSuspended: true,
            affectedOrdersCount: uniqueOrders.size,
            notificationsSent: notifications.length,
        },
        message: `Rappel initié. Produit suspendu. ${notifications.length} client(s) notifié(s). ` +
            `N'oubliez pas de signaler cet incident au MINSANTE dans les 24h ` +
            `(Loi n° 2011/012, Article 16).`,
    });
});

// Consulter les rappels actifs d'un restaurant
recallRoutes.get("/recalls", async (c) => {
    const restaurantId = c.get("restaurantId");
    const supabase = c.get("supabase");

    const { data, error } = await supabase
        .from("product_recalls")
        .select(`
            *,
            products(name, image_url),
            recall_notifications(count)
        `)
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });

    if (error) return c.json({ error: "Erreur lors de la récupération des rappels" }, 500);
    return c.json({ success: true, recalls: data });
});

// Résoudre un rappel
recallRoutes.put("/recalls/:recallId/resolve", async (c) => {
    const recallId = c.req.param("recallId");
    const restaurantId = c.get("restaurantId");
    const userId = c.get("userId");
    const supabase = c.get("supabase");
    const body = await c.req.json();

    const { data, error } = await supabase
        .from("product_recalls")
        .update({
            status: "resolved",
            resolution_notes: body.resolution_notes,
            resolved_at: new Date().toISOString(),
            resolved_by: userId,
            authority_reference: body.authority_reference || null,
        })
        .eq("id", recallId)
        .eq("restaurant_id", restaurantId)
        .select()
        .single();

    if (error) return c.json({ error: "Erreur lors de la résolution du rappel" }, 500);
    return c.json({
        success: true,
        recall: data,
        message: "Rappel résolu. Le produit reste suspendu — réactivez-le manuellement si approprié.",
    });
});

export { recallRoutes };
```

### Composant React — Confirmation d'allergènes à la commande

```tsx
// ✅ CONFORME : Confirmation d'allergènes avant validation de commande
// À créer dans : packages/modules/orders/src/ui/components/AllergenConfirmation.tsx

import { useState } from "react";

interface AllergenConflict {
    productId: string;
    productName: string;
    allergenId: string;
    allergenName: string;
    allergenIcon: string;
    presenceType: "present" | "traces" | "cross_contamination";
    userSeverity: "mild" | "moderate" | "severe" | "anaphylactic";
}

interface AllergenConfirmationProps {
    conflicts: AllergenConflict[];
    hasCriticalConflict: boolean;
    onConfirm: (notes: string) => void;
    onCancel: () => void;
}

const PRESENCE_LABELS: Record<string, string> = {
    present: "Contient",
    traces: "Peut contenir des traces de",
    cross_contamination: "Risque de contamination croisée avec",
};

const SEVERITY_LABELS: Record<string, { label: string; color: string }> = {
    anaphylactic: { label: "Risque anaphylactique", color: "bg-red-600" },
    severe: { label: "Allergie sévère", color: "bg-red-500" },
    moderate: { label: "Allergie modérée", color: "bg-orange-500" },
    mild: { label: "Sensibilité légère", color: "bg-yellow-500" },
};

export function AllergenConfirmation({
    conflicts,
    hasCriticalConflict,
    onConfirm,
    onCancel,
}: AllergenConfirmationProps) {
    const [acknowledged, setAcknowledged] = useState(false);
    const [notes, setNotes] = useState("");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="mx-4 max-w-lg rounded-xl bg-white p-6 shadow-2xl">
                {/* En-tête d'alerte */}
                <div className={`mb-4 rounded-lg p-4 ${
                    hasCriticalConflict ? "bg-red-50 border-2 border-red-300" : "bg-orange-50 border border-orange-200"
                }`}>
                    <h2 className="flex items-center gap-2 text-lg font-bold text-red-800">
                        ⚠️ Alerte Allergènes
                    </h2>
                    <p className="mt-1 text-sm text-red-700">
                        {hasCriticalConflict
                            ? "ATTENTION : Un ou plusieurs produits contiennent des allergènes auxquels vous avez déclaré une allergie SÉVÈRE."
                            : "Des produits dans votre panier contiennent des allergènes que vous avez déclarés."}
                    </p>
                </div>

                {/* Liste des conflits */}
                <div className="mb-4 max-h-60 space-y-3 overflow-y-auto">
                    {conflicts.map((conflict, i) => {
                        const severity = SEVERITY_LABELS[conflict.userSeverity];
                        return (
                            <div key={i} className="rounded-lg border p-3">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">{conflict.productName}</span>
                                    <span className={`rounded-full px-2 py-0.5 text-xs text-white ${severity.color}`}>
                                        {severity.label}
                                    </span>
                                </div>
                                <p className="mt-1 text-sm text-gray-600">
                                    {conflict.allergenIcon}{" "}
                                    {PRESENCE_LABELS[conflict.presenceType]}{" "}
                                    <strong>{conflict.allergenName}</strong>
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Zone de notes */}
                <textarea
                    className="mb-4 w-full rounded-lg border p-3 text-sm"
                    placeholder="Instructions spéciales pour le restaurant (ex: allergie sévère, veuillez préparer séparément)..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                />

                {/* Confirmation obligatoire (Loi 2011/012, Art. 7) */}
                <label className="mb-4 flex items-start gap-3">
                    <input
                        type="checkbox"
                        checked={acknowledged}
                        onChange={(e) => setAcknowledged(e.target.checked)}
                        className="mt-1 h-5 w-5 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">
                        J'ai pris connaissance des allergènes présents dans ma commande et
                        je confirme vouloir poursuivre <strong>sous ma responsabilité</strong>.
                        {hasCriticalConflict && (
                            <span className="mt-1 block font-bold text-red-600">
                                Je comprends que certains produits contiennent des allergènes
                                auxquels j'ai déclaré une allergie sévère.
                            </span>
                        )}
                    </span>
                </label>

                {/* Boutons d'action */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 rounded-lg border border-gray-300 py-3 font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Modifier ma commande
                    </button>
                    <button
                        onClick={() => onConfirm(notes)}
                        disabled={!acknowledged}
                        className={`flex-1 rounded-lg py-3 font-medium text-white ${
                            acknowledged
                                ? "bg-orange-500 hover:bg-orange-600"
                                : "cursor-not-allowed bg-gray-300"
                        }`}
                    >
                        Confirmer malgré les allergènes
                    </button>
                </div>

                {/* Mention légale */}
                <p className="mt-3 text-center text-xs text-gray-400">
                    Conformément à la Loi n° 2011/012, Art. 7 — Obligation d'information
                    du consommateur sur les risques pour la santé.
                </p>
            </div>
        </div>
    );
}
```

---

## Sanctions

### Sanctions pour défaut d'information sur les allergènes

| Infraction | Sanction | Base légale |
|---|---|---|
| **Absence de déclaration d'allergènes** | Amende de 100 000 à 1 000 000 FCFA + retrait du produit | Loi 2011/012, Art. 8-9 ; NC 03:2000 |
| **Information trompeuse** (allergène non mentionné) | Amende de 500 000 à 5 000 000 FCFA + fermeture possible | Loi 2011/012, Art. 32 |
| **Réaction allergique suite à défaut d'information** | Responsabilité civile : dommages et intérêts illimités | Loi 2011/012, Art. 14 |
| **Réaction allergique grave / choc anaphylactique** | 2 à 10 ans d'emprisonnement + dommages et intérêts | Code Pénal, Art. 289-291 |
| **Décès suite à réaction allergique** | 5 à 10 ans d'emprisonnement + fermeture définitive | Code Pénal, Art. 289 |

### Sanctions pour défaut de traçabilité

| Infraction | Sanction | Base légale |
|---|---|---|
| **Absence de registre fournisseurs** | Amende de 200 000 à 2 000 000 FCFA | Décret 2012/2861, Art. 18 |
| **Impossibilité de tracer l'origine** | Responsabilité automatique en cas d'incident | Loi 2011/012, Art. 15 |
| **Non-respect de la DLC** | Saisie des marchandises + amende de 500 000 FCFA | NC 226:2003-06 |
| **Vente de produits périmés** | 1 à 5 ans d'emprisonnement + amende | Code Pénal, Art. 258 |

### Sanctions pour défaut de rappel

| Infraction | Sanction | Base légale |
|---|---|---|
| **Non-retrait d'un produit dangereux** | Fermeture immédiate + poursuites pénales | Loi 2011/012, Art. 16 |
| **Non-notification des consommateurs** | Amende de 1 000 000 à 10 000 000 FCFA | Loi 2011/012, Art. 16 |
| **Non-signalement aux autorités** | Amende + interdiction d'exercer | Loi 96/03, Art. 29 |
| **Récidive** | Doublement des amendes + fermeture définitive | Loi 2011/012, Art. 35 |

### Risques spécifiques pour KBouffe

| Risque | Impact | Probabilité actuelle |
|---|---|---|
| **Client avec allergie aux arachides commande un plat contenant de l'arachide non déclarée** | Choc anaphylactique possible → responsabilité pénale | 🔴 **ÉLEVÉE** (allergènes en texte libre, non standardisés) |
| **Contamination croisée non signalée** | Réaction allergique → poursuite solidaire | 🔴 **ÉLEVÉE** (aucun champ de contamination croisée) |
| **Plat préparé depuis > 4h livré sans avertissement** | Intoxication → responsabilité civile + pénale | 🟠 **MOYENNE** (aucun suivi de DLC) |
| **Incident alimentaire sans possibilité de traçabilité** | Impossibilité d'identifier la source → responsabilité par défaut | 🔴 **ÉLEVÉE** (aucun système de traçabilité) |
| **Rappel nécessaire mais aucun mécanisme existant** | Clients non avertis → aggravation des dommages | 🔴 **ÉLEVÉE** (aucun système de rappel) |

---

## Recommandations Techniques pour KBouffe

### Priorité 1 — Critique (à implémenter immédiatement)

1. **Créer la table `allergen_reference`** avec les 14 allergènes standardisés, adaptés au contexte camerounais (arachides en priorité critique).
2. **Migrer de `allergens` JSON libre vers `product_allergens`** (table de liaison avec validation stricte).
3. **Ajouter la confirmation d'allergènes** (`allergen_acknowledgment`) sur la table `orders`.
4. **Composant `AllergenConfirmation`** : modal de confirmation obligatoire avant validation de commande si le client a un profil allergique et que des conflits sont détectés.
5. **Créer `user_allergen_profiles`** : permettre aux clients de renseigner leurs allergies.

### Priorité 2 — Important (sous 3 mois)

6. **Ajouter `cross_contamination_warning`** sur les produits : texte d'avertissement libre pour les risques de contamination croisée.
7. **Créer `restaurant_suppliers`** et **`supplier_deliveries`** : système de traçabilité des fournisseurs.
8. **Ajouter `shelf_life_hours`** et **`storage_temperature`** sur les produits : gestion de la durée de vie.
9. **API de vérification d'allergènes** (`/orders/check-allergens`) : endpoint appelé automatiquement avant la validation de commande.
10. **Dashboard restaurant** : interface de gestion des allergènes par produit avec la liste de référence.

### Priorité 3 — Recommandé (sous 6 mois)

11. **Système de rappel complet** : tables `product_recalls` et `recall_notifications`, avec notification push/SMS via `kbouffe-sms-queue`.
12. **Filtrage automatique du menu** : masquer ou signaler les plats contenant les allergènes du client.
13. **Export de traçabilité** : générer un rapport complet de traçabilité pour les inspections MINSANTE.
14. **Historique des modifications d'allergènes** : audit trail pour prouver la diligence en cas de litige.
15. **Formation restaurants** : guide intégré dans le dashboard pour former les restaurateurs à la déclaration d'allergènes.

### Architecture recommandée

```
packages/modules/catalog/
├── src/
│   ├── api/
│   │   ├── products.ts          # Existant — migrer vers allergen_reference
│   │   ├── allergens.ts         # Nouveau — API allergènes standardisés
│   │   ├── recalls.ts           # Nouveau — Système de rappel
│   │   └── suppliers.ts         # Nouveau — Gestion fournisseurs
│   ├── ui/
│   │   └── components/
│   │       ├── AllergenSelector.tsx    # Sélection d'allergènes pour les produits
│   │       ├── AllergenBadges.tsx      # Badges d'allergènes sur les fiches produit
│   │       └── SupplierForm.tsx        # Formulaire de gestion des fournisseurs
│   └── hooks/
│       ├── useAllergens.ts            # Hook pour la liste de référence
│       └── useSuppliers.ts            # Hook pour les fournisseurs

packages/modules/orders/
├── src/
│   └── ui/
│       └── components/
│           └── AllergenConfirmation.tsx # Modal de confirmation allergènes
```

### Migration des données existantes

```sql
-- Script de migration des allergènes existants (JSON libre → table normalisée)
-- À exécuter après création des tables

-- Mapping des valeurs libres courantes vers les IDs standardisés
DO $$
DECLARE
    product_record RECORD;
    allergen_value TEXT;
    mapped_id TEXT;
BEGIN
    FOR product_record IN
        SELECT id, allergens FROM products WHERE allergens IS NOT NULL
    LOOP
        FOR allergen_value IN
            SELECT jsonb_array_elements_text(product_record.allergens::jsonb)
        LOOP
            -- Mapper les valeurs libres vers les IDs standardisés
            mapped_id := CASE lower(trim(allergen_value))
                WHEN 'arachide' THEN 'arachides'
                WHEN 'arachides' THEN 'arachides'
                WHEN 'cacahuète' THEN 'arachides'
                WHEN 'cacahuètes' THEN 'arachides'
                WHEN 'peanut' THEN 'arachides'
                WHEN 'peanuts' THEN 'arachides'
                WHEN 'groundnut' THEN 'arachides'
                WHEN 'groundnuts' THEN 'arachides'
                WHEN 'lait' THEN 'lait'
                WHEN 'lactose' THEN 'lait'
                WHEN 'milk' THEN 'lait'
                WHEN 'dairy' THEN 'lait'
                WHEN 'oeuf' THEN 'oeufs'
                WHEN 'oeufs' THEN 'oeufs'
                WHEN 'egg' THEN 'oeufs'
                WHEN 'eggs' THEN 'oeufs'
                WHEN 'poisson' THEN 'poisson'
                WHEN 'fish' THEN 'poisson'
                WHEN 'crevette' THEN 'crustaces'
                WHEN 'crevettes' THEN 'crustaces'
                WHEN 'crustacé' THEN 'crustaces'
                WHEN 'crustacés' THEN 'crustaces'
                WHEN 'shrimp' THEN 'crustaces'
                WHEN 'soja' THEN 'soja'
                WHEN 'soy' THEN 'soja'
                WHEN 'gluten' THEN 'gluten'
                WHEN 'blé' THEN 'gluten'
                WHEN 'wheat' THEN 'gluten'
                WHEN 'sésame' THEN 'sesame'
                WHEN 'sesame' THEN 'sesame'
                WHEN 'noix' THEN 'fruits_coque'
                WHEN 'nuts' THEN 'fruits_coque'
                WHEN 'coco' THEN 'fruits_coque'
                WHEN 'coconut' THEN 'fruits_coque'
                WHEN 'sulfite' THEN 'sulfites'
                WHEN 'sulfites' THEN 'sulfites'
                ELSE NULL
            END;

            IF mapped_id IS NOT NULL THEN
                INSERT INTO product_allergens (product_id, allergen_id, presence_type)
                VALUES (product_record.id, mapped_id, 'present')
                ON CONFLICT (product_id, allergen_id) DO NOTHING;
            END IF;
        END LOOP;
    END LOOP;
END $$;
```

---

## Références

### Textes législatifs et réglementaires

1. **Loi n° 2011/012 du 6 mai 2011** portant protection du consommateur au Cameroun — Articles 7, 8, 9, 14, 15, 16, 26, 32, 35
2. **Loi n° 96/03 du 4 janvier 1996** — Loi-cadre dans le domaine de la Santé — Article 29
3. **Décret n° 2012/2861/PM du 16 octobre 2012** fixant les conditions d'hygiène alimentaire — Articles 10, 11, 18, 22
4. **Code Pénal du Cameroun** — Articles 258, 289-291

### Réglementation CEMAC

5. **Règlement n° 01/06-UEAC-CM du 19 mars 2006** — Harmonisation des législations alimentaires en zone CEMAC
6. **Directive CEMAC D/01/08** — Étiquetage des denrées alimentaires préemballées

### Normes ANOR

7. **NC 03:2000** — Étiquetage des denrées alimentaires préemballées
8. **NC 04:2002** — Hygiène générale des denrées alimentaires
9. **NC 226:2003-06** — Code d'usages pour les aliments préemballés

### Normes internationales

10. **Codex Alimentarius CAC/GL 23-1997** (rév. 2018) — Étiquetage des denrées alimentaires préemballées (déclaration des allergènes)
11. **Codex Alimentarius CAC/RCP 1-1969** (rév. 2003) — Principes généraux d'hygiène alimentaire (HACCP)
12. **ISO 22000:2018** — Systèmes de management de la sécurité des denrées alimentaires
13. **ISO 22005:2007** — Traçabilité de la chaîne alimentaire

### Ressources spécifiques au contexte camerounais

14. ANOR — [www.anor.cm](https://www.anor.cm) — Catalogue des normes camerounaises
15. MINSANTE — [www.minsante.cm](https://www.minsante.cm) — Réglementation sanitaire
16. FAO — Profil nutritionnel du Cameroun (allergènes courants dans l'alimentation locale)
17. OMS — Guide sur la gestion des allergènes alimentaires en Afrique subsaharienne
