# Statut Juridique des Livreurs au Cameroun — Référence pour KBouffe

## Résumé

Le statut juridique des livreurs de plateformes numériques constitue l'un des risques légaux les plus importants pour KBouffe. Au Cameroun, **il n'existe pas encore de législation spécifique régissant les travailleurs de plateformes** (gig workers). En l'absence de cadre dédié, les tribunaux appliquent le **Code du Travail (Loi n°92/007 du 14 août 1992)** et ses critères classiques pour déterminer si un livreur est un **salarié** ou un **prestataire indépendant**.

Le risque principal est la **requalification judiciaire** : si un tribunal considère que KBouffe exerce un lien de subordination sur ses livreurs (horaires imposés, tarifs fixés, sanctions disciplinaires, outils fournis), il peut requalifier la relation en contrat de travail. Cela entraînerait rétroactivement toutes les obligations d'un employeur : CNPS, IRPP, congés payés, indemnités de licenciement.

Au-delà du statut, KBouffe doit s'assurer que ses livreurs disposent des documents obligatoires : **permis de conduire valide**, **carte grise**, **assurance responsabilité civile**, et **certificat d'aptitude médicale**. L'absence de vérification expose la plateforme à une responsabilité civile majeure en cas d'accident.

Actuellement, KBouffe gère les livreurs via `restaurant_members` avec `role="driver"`, suit les commandes via `driver_id`, et gère les états de livraison (`ready` → `out_for_delivery` → `delivered`). **Aucune vérification de documents, aucune gestion d'assurance, aucune traçabilité de conformité n'est implémentée.**

---

## Textes de Loi Applicables

### 1. Code du Travail — Loi n°92/007 du 14 août 1992

| Article | Objet | Pertinence pour les livreurs |
|---------|-------|------------------------------|
| Art. 1(2) | Définition du travailleur | « Est considéré comme travailleur [...] toute personne qui s'est engagée à mettre son activité professionnelle [...] sous la direction et l'autorité d'une autre personne » |
| Art. 3 | Critères du contrat de travail | Prestation de travail, rémunération, **lien de subordination** |
| Art. 23-24 | Forme du contrat | Contrat écrit obligatoire. À défaut → présomption de CDI |
| Art. 36-42 | Résiliation du contrat | Préavis, indemnités de licenciement |
| Art. 95-98 | Accidents du travail | Responsabilité de l'employeur pour les accidents survenus pendant le travail |

### 2. Critères de qualification du lien de subordination

La jurisprudence camerounaise retient un **faisceau d'indices** pour caractériser le salariat :

| Indice | Salarié (employé) | Indépendant (prestataire) |
|--------|-------------------|--------------------------|
| Horaires de travail | Imposés par la plateforme | Libres, choisis par le livreur |
| Tarification | Fixée unilatéralement par la plateforme | Négociée ou fixée par le prestataire |
| Exclusivité | Ne peut travailler pour d'autres | Libre de travailler pour plusieurs clients |
| Outils de travail | Fournis par la plateforme | Fournis par le prestataire (son véhicule, son téléphone) |
| Sanctions disciplinaires | Pouvoir de sanction (avertissement, suspension) | Résiliation du contrat commercial uniquement |
| Intégration organisationnelle | Intégré dans l'organisation de l'entreprise | Exerce de manière indépendante |
| Instructions | Reçoit des directives sur la méthode de travail | Liberté dans l'exécution |
| Clientèle propre | N'a pas de clientèle propre | Possède sa propre clientèle |

### 3. Code de la Route — Loi n°2001/015 du 23 juillet 2001

| Obligation | Détail |
|------------|--------|
| Permis de conduire | Catégorie A (moto), B (voiture), selon le véhicule utilisé |
| Carte grise | Document d'immatriculation du véhicule |
| Assurance RC | Assurance responsabilité civile automobile obligatoire |
| Contrôle technique | Visite technique annuelle pour les véhicules de plus de 5 ans |
| Port du casque | Obligatoire pour les conducteurs et passagers de motos |

### 4. Code CIMA — Assurance Responsabilité Civile

La **Conférence Interafricaine des Marchés d'Assurances (CIMA)** impose à tout véhicule circulant sur la voie publique une **assurance de responsabilité civile obligatoire** (Code CIMA, Livre II, Titre I).

| Point | Détail |
|-------|--------|
| Assurance RC obligatoire | Tout véhicule (moto, voiture) doit être assuré |
| Attestation d'assurance | Le conducteur doit pouvoir la présenter à tout moment |
| Défaut d'assurance | Infraction pénale : amende + immobilisation du véhicule |
| Responsabilité du commettant | L'employeur/donneur d'ordre peut être civilement responsable des dommages causés par ses préposés (Art. 1384 Code Civil) |

### 5. Normes d'Hygiène — Transport de Denrées Alimentaires

| Réglementation | Exigence |
|----------------|----------|
| Décret n°92/455 (hygiène alimentaire) | Les denrées alimentaires doivent être transportées dans des conditions garantissant leur salubrité |
| Code d'hygiène | Contenants propres, étanches, protégés de la poussière et des intempéries |
| Chaîne du froid | Les aliments réfrigérés doivent être maintenus à température (< 4°C pour les produits frais) |
| Contenants isothermes | Sacs ou caissons isothermes recommandés pour la livraison de repas |

### 6. Acte Uniforme OHADA relatif au Droit Commercial Général

Pour les livreurs indépendants :

| Obligation | Détail |
|------------|--------|
| RCCM | Inscription au Registre du Commerce et du Crédit Mobilier |
| NIF | Numéro d'Identifiant Fiscal auprès de la DGI |
| Patente | Contribution des patentes (impôt local pour les indépendants) |

---

## Obligations pour la Plateforme

### Scénario A : Le livreur est un salarié du restaurant

Si le livreur est intégré à l'équipe du restaurant (cas actuel de KBouffe via `restaurant_members` avec `role="driver"`) :

| Obligation | Responsable | Détail |
|------------|-------------|--------|
| Contrat de travail écrit | Restaurant | CDI ou CDD, avec description du poste |
| Immatriculation CNPS | Restaurant | Déclaration du livreur comme salarié |
| Cotisations sociales | Restaurant | CNPS employeur (~16,2%) + CNPS salarié (4,2%) |
| IRPP | Restaurant | Retenue à la source |
| Assurance accidents du travail | Restaurant/CNPS | Cotisation AT/MP couvre les accidents en livraison |
| Vérification permis/véhicule | Restaurant + KBouffe | Obligation de s'assurer de l'aptitude du livreur |

### Scénario B : Le livreur est un prestataire indépendant

Si KBouffe opte pour un modèle d'indépendants (recommandé pour limiter les risques de requalification) :

| Obligation | Responsable | Détail |
|------------|-------------|--------|
| Contrat de prestation de services | KBouffe/Restaurant | Contrat commercial (pas un contrat de travail) |
| RCCM / NIF | Livreur | Le livreur doit être immatriculé au registre du commerce |
| Assurance RC propre | Livreur | Assurance professionnelle à la charge du livreur |
| Permis de conduire valide | Livreur | Vérification par KBouffe obligatoire |
| Facturation | Livreur | Le livreur émet des factures (pas de bulletins de paie) |
| Liberté d'exécution | KBouffe | Ne pas imposer d'horaires ni de méthodes |

### Vérifications obligatoires pour KBouffe (quel que soit le statut)

| Document | Vérification | Fréquence |
|----------|-------------|-----------|
| Permis de conduire | Validité, catégorie appropriée | À l'inscription + annuellement |
| Carte grise | Propriété ou autorisation du propriétaire | À l'inscription + annuellement |
| Assurance RC | Validité, couverture livraison professionnelle | À l'inscription + à chaque renouvellement |
| Certificat d'aptitude médicale | Aptitude à la conduite professionnelle | À l'inscription + tous les 2 ans |
| Casier judiciaire (extrait n°3) | Absence de condamnations incompatibles | À l'inscription |
| Carte d'identité nationale | Identité, majorité (18 ans minimum) | À l'inscription |

---

## ❌ Exemple Non-Conforme

Le code actuel n'effectue aucune vérification de conformité sur les livreurs :

```typescript
// ❌ NON-CONFORME : Enregistrement d'un livreur sans aucune vérification
// Fichier : packages/modules/hr/src/api/members.ts

app.post('/members', async (c) => {
  const { user_id, role, restaurant_id } = await c.req.json();

  // ❌ Aucune vérification du permis de conduire
  // ❌ Aucune vérification de l'assurance
  // ❌ Aucune vérification du véhicule
  // ❌ Aucun contrat ou convention formalisée
  // ❌ Pas de distinction entre salarié et indépendant
  // ❌ Aucune collecte de documents obligatoires

  const { data, error } = await supabase
    .from('restaurant_members')
    .insert({
      user_id,
      restaurant_id,
      role, // "driver" accepté sans aucune condition
    });

  return c.json({ success: true, member: data });
});
```

```typescript
// ❌ NON-CONFORME : Assignation d'un livreur à une commande sans vérification
// Fichier : packages/modules/orders/src/api/orders.ts

app.patch('/orders/:id/assign-driver', async (c) => {
  const { driver_id } = await c.req.json();

  // ❌ Aucune vérification que le livreur a un permis valide
  // ❌ Aucune vérification de l'assurance en cours de validité
  // ❌ Aucune vérification de l'aptitude médicale
  // ❌ Aucune traçabilité pour la responsabilité en cas d'accident

  await supabase
    .from('orders')
    .update({
      driver_id,
      delivery_status: 'out_for_delivery',
    })
    .eq('id', c.req.param('id'));

  return c.json({ success: true });
});
```

**Problèmes identifiés :**
- Un livreur peut être enregistré et se voir assigner des livraisons sans aucun document vérifié
- En cas d'accident, KBouffe n'a aucune preuve de diligence (responsabilité directe)
- Aucune distinction entre salarié et indépendant (risque de requalification)
- Pas de suivi de l'expiration des documents (permis, assurance)
- Pas de conformité avec les normes de transport alimentaire

---

## ✅ Exemple Conforme

```typescript
// ✅ CONFORME : Types pour la gestion des documents de conformité des livreurs
// Fichier : packages/modules/hr/src/lib/driver-compliance.ts

type DriverDocumentType =
  | 'permis_conduire'
  | 'carte_grise'
  | 'assurance_rc'
  | 'certificat_medical'
  | 'casier_judiciaire'
  | 'cni'
  | 'rccm' // Pour les indépendants
  | 'nif'; // Pour les indépendants

type DriverStatus = 'salarié' | 'indépendant';

interface DriverDocument {
  id: string;
  driver_id: string;
  document_type: DriverDocumentType;
  document_number: string;
  file_url: string;
  issued_at: string;
  expires_at: string | null;
  verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
}

interface DriverComplianceStatus {
  driver_id: string;
  status: DriverStatus;
  documents_valid: boolean;
  missing_documents: DriverDocumentType[];
  expired_documents: DriverDocumentType[];
  expiring_soon: Array<{ type: DriverDocumentType; expires_at: string; days_remaining: number }>;
  can_deliver: boolean;
  reasons: string[];
}

const REQUIRED_DOCUMENTS_SALARIE: DriverDocumentType[] = [
  'permis_conduire',
  'carte_grise',
  'assurance_rc',
  'certificat_medical',
  'cni',
];

const REQUIRED_DOCUMENTS_INDEPENDANT: DriverDocumentType[] = [
  'permis_conduire',
  'carte_grise',
  'assurance_rc',
  'certificat_medical',
  'cni',
  'rccm',
  'nif',
];

const EXPIRY_WARNING_DAYS = 30;

/**
 * Vérifie la conformité complète d'un livreur.
 * Un livreur ne peut effectuer de livraison que si tous ses documents obligatoires
 * sont présents, vérifiés et non expirés.
 */
export async function verifierConformiteLivreur(
  supabase: SupabaseClient,
  driverId: string
): Promise<DriverComplianceStatus> {
  // Récupérer le profil du livreur
  const { data: driver } = await supabase
    .from('drivers')
    .select('id, user_id, status, vehicle_type')
    .eq('id', driverId)
    .single();

  if (!driver) {
    return {
      driver_id: driverId,
      status: 'salarié',
      documents_valid: false,
      missing_documents: [],
      expired_documents: [],
      expiring_soon: [],
      can_deliver: false,
      reasons: ['Livreur non trouvé.'],
    };
  }

  const requiredDocs =
    driver.status === 'indépendant'
      ? REQUIRED_DOCUMENTS_INDEPENDANT
      : REQUIRED_DOCUMENTS_SALARIE;

  // Récupérer les documents du livreur
  const { data: documents } = await supabase
    .from('driver_documents')
    .select('*')
    .eq('driver_id', driverId);

  const now = new Date();
  const docsMap = new Map((documents ?? []).map((d) => [d.document_type, d]));

  const missingDocuments: DriverDocumentType[] = [];
  const expiredDocuments: DriverDocumentType[] = [];
  const expiringSoon: Array<{ type: DriverDocumentType; expires_at: string; days_remaining: number }> = [];
  const reasons: string[] = [];

  for (const docType of requiredDocs) {
    const doc = docsMap.get(docType);

    if (!doc) {
      missingDocuments.push(docType);
      reasons.push(`Document manquant : ${docType}`);
      continue;
    }

    if (!doc.verified) {
      reasons.push(`Document non vérifié : ${docType}`);
      continue;
    }

    if (doc.expires_at) {
      const expiryDate = new Date(doc.expires_at);

      if (expiryDate < now) {
        expiredDocuments.push(docType);
        reasons.push(`Document expiré : ${docType} (expiré le ${doc.expires_at})`);
      } else {
        const daysRemaining = Math.ceil(
          (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysRemaining <= EXPIRY_WARNING_DAYS) {
          expiringSoon.push({
            type: docType,
            expires_at: doc.expires_at,
            days_remaining: daysRemaining,
          });
        }
      }
    }
  }

  const documentsValid =
    missingDocuments.length === 0 &&
    expiredDocuments.length === 0 &&
    reasons.length === 0;

  return {
    driver_id: driverId,
    status: driver.status,
    documents_valid: documentsValid,
    missing_documents: missingDocuments,
    expired_documents: expiredDocuments,
    expiring_soon: expiringSoon,
    can_deliver: documentsValid,
    reasons,
  };
}
```

```typescript
// ✅ CONFORME : Route d'inscription d'un livreur avec collecte de documents
// Fichier : packages/modules/hr/src/api/drivers.ts

import { verifierConformiteLivreur, REQUIRED_DOCUMENTS_SALARIE, REQUIRED_DOCUMENTS_INDEPENDANT } from '../lib/driver-compliance';

interface DriverRegistrationRequest {
  user_id: string;
  restaurant_id: string;
  status: 'salarié' | 'indépendant';
  vehicle_type: 'moto' | 'voiture' | 'vélo';
  permis_numero: string;
  permis_categorie: string;
  permis_expire_le: string;
  carte_grise_numero: string;
  assurance_numero: string;
  assurance_expire_le: string;
}

app.post('/drivers/register', async (c) => {
  const body = await c.req.json<DriverRegistrationRequest>();

  // 1. Vérifier l'âge minimum (18 ans)
  const { data: user } = await supabase
    .from('users')
    .select('id, date_of_birth')
    .eq('id', body.user_id)
    .single();

  if (!user?.date_of_birth) {
    return c.json(
      { error: 'La date de naissance est requise pour l\'inscription comme livreur.' },
      400
    );
  }

  const age = Math.floor(
    (Date.now() - new Date(user.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );

  if (age < 18) {
    return c.json(
      { error: 'Le livreur doit avoir au moins 18 ans (Art. 86 Code du Travail).' },
      400
    );
  }

  // 2. Vérifier la catégorie du permis par rapport au véhicule
  const categoriesRequises: Record<string, string[]> = {
    moto: ['A', 'A1', 'A2'],
    voiture: ['B', 'B1'],
    vélo: [], // Pas de permis requis pour les vélos
  };

  if (body.vehicle_type !== 'vélo') {
    const categoriesValides = categoriesRequises[body.vehicle_type] ?? [];
    if (!categoriesValides.includes(body.permis_categorie.toUpperCase())) {
      return c.json(
        {
          error: `La catégorie de permis "${body.permis_categorie}" n'est pas valide ` +
            `pour un véhicule de type "${body.vehicle_type}". ` +
            `Catégories acceptées : ${categoriesValides.join(', ')}.`,
        },
        400
      );
    }
  }

  // 3. Vérifier que le permis n'est pas expiré
  if (new Date(body.permis_expire_le) <= new Date()) {
    return c.json(
      { error: 'Le permis de conduire est expiré. Veuillez le renouveler avant de vous inscrire.' },
      400
    );
  }

  // 4. Vérifier que l'assurance n'est pas expirée
  if (new Date(body.assurance_expire_le) <= new Date()) {
    return c.json(
      { error: 'L\'assurance RC est expirée. Une assurance valide est obligatoire (Code CIMA).' },
      400
    );
  }

  // 5. Pour les indépendants, vérifier RCCM et NIF
  if (body.status === 'indépendant') {
    // Note : la vérification réelle du RCCM/NIF se fait via les documents uploadés
    // Ici on s'assure que le statut est explicitement choisi
  }

  // 6. Créer le profil livreur
  const { data: driver, error: driverError } = await supabase
    .from('drivers')
    .insert({
      user_id: body.user_id,
      status: body.status,
      vehicle_type: body.vehicle_type,
      compliance_status: 'pending_verification',
      onboarded_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (driverError) {
    return c.json({ error: 'Erreur lors de la création du profil livreur.' }, 500);
  }

  // 7. Enregistrer les documents initiaux (à vérifier manuellement ou par OCR)
  const initialDocuments = [
    {
      driver_id: driver.id,
      document_type: 'permis_conduire',
      document_number: body.permis_numero,
      expires_at: body.permis_expire_le,
      verified: false,
    },
    {
      driver_id: driver.id,
      document_type: 'carte_grise',
      document_number: body.carte_grise_numero,
      expires_at: null,
      verified: false,
    },
    {
      driver_id: driver.id,
      document_type: 'assurance_rc',
      document_number: body.assurance_numero,
      expires_at: body.assurance_expire_le,
      verified: false,
    },
  ];

  await supabase.from('driver_documents').insert(initialDocuments);

  // 8. Ajouter comme membre du restaurant (après vérification complète seulement)
  // Note : le livreur ne sera pas actif tant que ses documents ne sont pas vérifiés
  await supabase.from('restaurant_members').insert({
    user_id: body.user_id,
    restaurant_id: body.restaurant_id,
    role: 'driver',
    status: 'pending_verification', // Pas "active" tant que les documents ne sont pas vérifiés
  });

  // 9. Déterminer les documents manquants
  const requiredDocs =
    body.status === 'indépendant'
      ? REQUIRED_DOCUMENTS_INDEPENDANT
      : REQUIRED_DOCUMENTS_SALARIE;

  const providedTypes = initialDocuments.map((d) => d.document_type);
  const stillNeeded = requiredDocs.filter((t) => !providedTypes.includes(t));

  return c.json({
    success: true,
    driver: {
      id: driver.id,
      status: body.status,
      compliance_status: 'pending_verification',
    },
    message: 'Inscription enregistrée. Vos documents sont en cours de vérification.',
    documents_manquants: stillNeeded,
    prochaines_etapes: [
      stillNeeded.length > 0
        ? `Veuillez fournir les documents suivants : ${stillNeeded.join(', ')}`
        : null,
      'Vos documents seront vérifiés sous 24-48h.',
      'Vous pourrez effectuer des livraisons une fois tous vos documents validés.',
      body.status === 'indépendant'
        ? 'En tant qu\'indépendant, vous devez fournir votre RCCM et NIF.'
        : 'Un contrat de travail sera établi par le restaurant.',
    ].filter(Boolean),
  });
});
```

```typescript
// ✅ CONFORME : Assignation d'un livreur avec vérification de conformité
// Fichier : packages/modules/orders/src/api/delivery.ts

import { verifierConformiteLivreur } from '@kbouffe/module-hr';

app.patch('/orders/:id/assign-driver', async (c) => {
  const orderId = c.req.param('id');
  const { driver_id } = await c.req.json();

  // 1. Vérifier la conformité complète du livreur
  const compliance = await verifierConformiteLivreur(supabase, driver_id);

  if (!compliance.can_deliver) {
    return c.json(
      {
        error: 'Ce livreur ne peut pas effectuer de livraison.',
        reasons: compliance.reasons,
        missing_documents: compliance.missing_documents,
        expired_documents: compliance.expired_documents,
        code: 'DRIVER_NOT_COMPLIANT',
      },
      403
    );
  }

  // 2. Alerter si des documents expirent bientôt
  if (compliance.expiring_soon.length > 0) {
    // Enregistrer l'alerte mais ne pas bloquer la livraison
    await supabase.from('compliance_alerts').insert(
      compliance.expiring_soon.map((doc) => ({
        driver_id,
        alert_type: 'document_expiring',
        document_type: doc.type,
        expires_at: doc.expires_at,
        days_remaining: doc.days_remaining,
        message: `Le document ${doc.type} expire dans ${doc.days_remaining} jours.`,
      }))
    );
  }

  // 3. Créer un enregistrement de livraison avec traçabilité
  const { data: delivery } = await supabase
    .from('deliveries')
    .insert({
      order_id: orderId,
      driver_id,
      driver_status: compliance.status,
      compliance_verified_at: new Date().toISOString(),
      assigned_at: new Date().toISOString(),
      status: 'assigned',
    })
    .select()
    .single();

  // 4. Mettre à jour la commande
  await supabase
    .from('orders')
    .update({
      driver_id,
      delivery_status: 'out_for_delivery',
      delivery_id: delivery?.id,
    })
    .eq('id', orderId);

  return c.json({
    success: true,
    delivery: {
      id: delivery?.id,
      driver_compliant: true,
      warnings: compliance.expiring_soon.length > 0
        ? `${compliance.expiring_soon.length} document(s) expirent bientôt.`
        : null,
    },
  });
});
```

```sql
-- ✅ CONFORME : Schéma de base de données pour la conformité des livreurs

-- Table principale des livreurs (séparée de restaurant_members)
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'salarié'
    CHECK (status IN ('salarié', 'indépendant')),
  vehicle_type TEXT NOT NULL
    CHECK (vehicle_type IN ('moto', 'voiture', 'vélo')),
  compliance_status TEXT NOT NULL DEFAULT 'pending_verification'
    CHECK (compliance_status IN (
      'pending_verification',
      'documents_incomplete',
      'verified',
      'suspended',
      'revoked'
    )),
  onboarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  suspension_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_drivers_user_id ON drivers(user_id);
CREATE INDEX idx_drivers_compliance_status ON drivers(compliance_status);

-- Table des documents de conformité
CREATE TABLE IF NOT EXISTS driver_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL
    CHECK (document_type IN (
      'permis_conduire',
      'carte_grise',
      'assurance_rc',
      'certificat_medical',
      'casier_judiciaire',
      'cni',
      'rccm',
      'nif'
    )),
  document_number TEXT,
  file_url TEXT,
  issued_at DATE,
  expires_at DATE,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (driver_id, document_type)
);

CREATE INDEX idx_driver_documents_driver_id ON driver_documents(driver_id);
CREATE INDEX idx_driver_documents_expires_at ON driver_documents(expires_at)
  WHERE expires_at IS NOT NULL;

-- Table des alertes de conformité
CREATE TABLE IF NOT EXISTS compliance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id),
  alert_type TEXT NOT NULL
    CHECK (alert_type IN (
      'document_expiring',
      'document_expired',
      'document_missing',
      'suspension',
      'accident_reported'
    )),
  document_type TEXT,
  expires_at DATE,
  days_remaining INTEGER,
  message TEXT NOT NULL,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_compliance_alerts_driver_id ON compliance_alerts(driver_id);
CREATE INDEX idx_compliance_alerts_acknowledged ON compliance_alerts(acknowledged)
  WHERE acknowledged = FALSE;

-- Table des livraisons avec traçabilité
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  driver_id UUID NOT NULL REFERENCES drivers(id),
  driver_status TEXT NOT NULL, -- 'salarié' ou 'indépendant' au moment de la livraison
  compliance_verified_at TIMESTAMPTZ NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'assigned'
    CHECK (status IN ('assigned', 'picked_up', 'in_transit', 'delivered', 'failed', 'cancelled')),
  failure_reason TEXT,
  distance_km NUMERIC(8, 2),
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deliveries_order_id ON deliveries(order_id);
CREATE INDEX idx_deliveries_driver_id ON deliveries(driver_id);
CREATE INDEX idx_deliveries_status ON deliveries(status);

-- Vue pour identifier les documents expirant dans les 30 jours
CREATE OR REPLACE VIEW driver_documents_expiring AS
SELECT
  d.id AS driver_id,
  d.user_id,
  dd.document_type,
  dd.document_number,
  dd.expires_at,
  (dd.expires_at - CURRENT_DATE) AS days_remaining,
  CASE
    WHEN dd.expires_at < CURRENT_DATE THEN 'expired'
    WHEN dd.expires_at <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
    ELSE 'valid'
  END AS status
FROM drivers d
JOIN driver_documents dd ON d.id = dd.driver_id
WHERE dd.expires_at IS NOT NULL
  AND dd.expires_at <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY dd.expires_at ASC;

-- Fonction pour vérifier la conformité d'un livreur (utilisable dans les policies RLS)
CREATE OR REPLACE FUNCTION is_driver_compliant(p_driver_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_compliance_status TEXT;
  v_expired_count INTEGER;
  v_missing_count INTEGER;
BEGIN
  SELECT compliance_status INTO v_compliance_status
  FROM drivers WHERE id = p_driver_id;

  IF v_compliance_status != 'verified' THEN
    RETURN FALSE;
  END IF;

  -- Vérifier qu'aucun document obligatoire n'est expiré
  SELECT COUNT(*) INTO v_expired_count
  FROM driver_documents
  WHERE driver_id = p_driver_id
    AND expires_at IS NOT NULL
    AND expires_at < CURRENT_DATE;

  IF v_expired_count > 0 THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$;
```

---

## Sanctions

### Sanctions en cas de requalification (livreurs considérés comme salariés)

| Conséquence | Détail |
|-------------|--------|
| Rappel de salaires | Paiement rétroactif de tous les avantages du salariat (congés, heures sup, primes) |
| Cotisations CNPS arriérées | Paiement de toutes les cotisations depuis le début de la relation + majorations (5%/mois) |
| IRPP arriéré | Paiement rétroactif de l'IRPP non retenu + pénalités (1,5%/mois) |
| Indemnités de licenciement | Si la relation est rompue, paiement des indemnités légales de licenciement |
| Dommages et intérêts | Le tribunal peut accorder des dommages et intérêts au livreur |

### Sanctions liées aux accidents de livraison

| Situation | Responsabilité | Sanction potentielle |
|-----------|---------------|---------------------|
| Accident avec livreur salarié | Employeur (restaurant) | Prise en charge intégrale (CNPS AT/MP ou directement si non inscrit) |
| Accident avec livreur non assuré | Plateforme + restaurant solidairement | Dommages et intérêts illimités + poursuites pénales |
| Accident alimentaire (intoxication) | Plateforme + restaurant + livreur | Responsabilité civile + pénale (mise en danger de la vie d'autrui) |
| Livreur sans permis | Plateforme (négligence dans la vérification) | Complicité de conduite sans permis + responsabilité civile intégrale |
| Défaut d'assurance RC | Propriétaire du véhicule + donneur d'ordre | Amende + immobilisation + responsabilité civile directe |

### Sanctions pénales (Code de la Route)

| Infraction | Sanction |
|------------|----------|
| Conduite sans permis | Emprisonnement de 6 mois à 1 an + amende de 50 000 à 500 000 FCFA |
| Défaut d'assurance | Amende de 100 000 à 1 000 000 FCFA + immobilisation du véhicule |
| Défaut de carte grise | Amende de 25 000 à 100 000 FCFA |
| Non-port du casque (moto) | Amende de 25 000 FCFA |

### Risques spécifiques pour KBouffe

1. **Responsabilité du commettant** (Art. 1384 Code Civil) : Si KBouffe est considérée comme « commettant » des livreurs, elle est civilement responsable de tous les dommages causés par eux dans l'exercice de leurs fonctions. Cela inclut les accidents de la route, les dommages aux biens, et les préjudices aux tiers.

2. **Négligence dans la vérification** : Si KBouffe ne vérifie pas les documents obligatoires (permis, assurance) et qu'un accident survient, elle peut être poursuivie pour négligence et condamnée à des dommages et intérêts significatifs.

3. **Responsabilité solidaire en matière sociale** : Si les livreurs sont requalifiés en salariés, KBouffe peut être solidairement responsable avec les restaurants des arriérés de cotisations CNPS et d'IRPP.

---

## Recommandations Techniques pour KBouffe

### Priorité 1 — Critique (à implémenter immédiatement)

1. **Table `drivers` séparée** : Créer une table dédiée aux livreurs avec leur statut juridique (`salarié` / `indépendant`), le type de véhicule et le statut de conformité. Ne pas se reposer uniquement sur `restaurant_members` avec `role="driver"`.

2. **Table `driver_documents`** : Créer une table pour stocker et suivre tous les documents obligatoires avec dates d'expiration et statut de vérification.

3. **Vérification avant assignation** : Implémenter `verifierConformiteLivreur()` et l'appeler systématiquement avant chaque assignation de livraison. **Bloquer l'assignation si le livreur n'est pas conforme.**

4. **Choix explicite du statut** : Lors de l'inscription, le restaurateur doit choisir si le livreur est salarié ou indépendant. Cela détermine les documents requis et les obligations.

### Priorité 2 — Important (dans les 3 mois)

5. **Vérification des documents** : Implémenter un workflow de vérification (upload → review manuelle → validation/rejet) avec notification au livreur.

6. **Alertes d'expiration** : Créer un cron job (Cloudflare Workers Cron) qui vérifie quotidiennement les documents expirant dans les 30 jours et envoie des notifications SMS via la queue existante.

7. **Table `deliveries`** : Créer une table de livraisons distincte des commandes, avec traçabilité de la conformité au moment de l'assignation (`compliance_verified_at`).

8. **Contrat/Convention type** : Proposer des modèles de contrat (CDI/CDD pour les salariés, contrat de prestation pour les indépendants) téléchargeables depuis le dashboard.

### Priorité 3 — Amélioration continue

9. **Protection contre la requalification** : S'assurer que l'architecture de KBouffe ne crée pas de lien de subordination.
   - Ne pas imposer d'horaires de connexion aux livreurs
   - Laisser le livreur libre d'accepter ou refuser une course
   - Ne pas appliquer de sanctions disciplinaires (uniquement la résiliation du contrat commercial)
   - Ne pas imposer de tarifs (les négocier dans le contrat)

10. **Conformité alimentaire** : Ajouter un champ `has_insulated_container` à la table `drivers` et exiger un conteneur isotherme pour les livraisons de nourriture.

11. **Assurance complémentaire plateforme** : Souscrire une assurance responsabilité civile professionnelle couvrant les dommages causés pendant les livraisons (même si le livreur a sa propre assurance).

12. **Audit de conformité périodique** : Implémenter un tableau de bord admin affichant le taux de conformité des livreurs par restaurant, les documents expirés, et les livreurs suspendus.

---

## Références

1. **Loi n°92/007 du 14 août 1992** — Code du Travail de la République du Cameroun
   - Articles 1-3 (définition du travailleur, critères du contrat de travail)
   - Articles 23-24 (forme du contrat)
   - Articles 95-98 (accidents du travail)
   - Lien : [Code du Travail](https://www.ilo.org/dyn/natlex/natlex4.detail?p_lang=fr&p_isn=31629)

2. **Loi n°2001/015 du 23 juillet 2001** — Code de la Route du Cameroun
   - Permis de conduire, immatriculation des véhicules, infractions
   - Catégories de permis (A, A1, A2, B, B1, C, D, E)

3. **Code CIMA** — Conférence Interafricaine des Marchés d'Assurances
   - Livre II, Titre I : Assurance obligatoire de responsabilité civile automobile
   - Site : [www.cima-afrique.org](https://www.cima-afrique.org)

4. **Code Civil camerounais** — Article 1384
   - Responsabilité du commettant du fait de ses préposés
   - Responsabilité des parents, des maîtres et des commettants

5. **Acte Uniforme OHADA relatif au Droit Commercial Général**
   - Immatriculation au RCCM pour les commerçants et prestataires indépendants
   - Site : [www.ohada.org](https://www.ohada.org)

6. **Décret n°92/455 du 23 novembre 1992** — Hygiène alimentaire au Cameroun
   - Conditions de transport des denrées alimentaires
   - Obligations des transporteurs de produits alimentaires

7. **Jurisprudence internationale sur les plateformes numériques**
   - France : Arrêt Uber (Cour de cassation, 4 mars 2020, n°19-13.316) — requalification en contrat de travail
   - Royaume-Uni : Uber BV v Aslam [2021] UKSC 5 — livreurs qualifiés de « workers »
   - Ces décisions, bien que non contraignantes au Cameroun, influencent la réflexion des tribunaux africains

8. **CNPS** — Caisse Nationale de Prévoyance Sociale du Cameroun
   - Immatriculation des travailleurs, accidents du travail et maladies professionnelles
   - Site : [www.cnps.cm](https://www.cnps.cm)
   - Téléphone : 1510

9. **Direction Générale des Impôts (DGI)** — Cameroun
   - Obligations fiscales des travailleurs indépendants (patente, impôt libératoire)
   - Site : [www.impots.cm](https://www.impots.cm)
