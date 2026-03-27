# Droit du Travail et Emploi au Cameroun — Référence pour KBouffe

## Résumé

Le droit du travail camerounais est régi principalement par la **Loi n°92/007 du 14 août 1992 portant Code du Travail**. Ce cadre impose des obligations strictes aux employeurs : contrats écrits, immatriculation à la CNPS, paiement des cotisations sociales, retenue à la source de l'IRPP, respect du SMIG, limitation du temps de travail et octroi de congés payés.

Pour KBouffe, la question centrale est la suivante : **les employés des restaurants partenaires (caissiers, cuisiniers, serveurs) sont des salariés du restaurant, pas de la plateforme**. Cependant, KBouffe facilite le paiement des salaires via son module HR (`staff_payouts`). À ce titre, la plateforme a l'obligation de s'assurer que les versements respectent les obligations légales et d'informer les restaurateurs de leurs responsabilités d'employeur.

Le non-respect du Code du Travail expose les restaurateurs à des sanctions pénales (amendes, emprisonnement) et KBouffe à un risque de complicité ou de responsabilité solidaire si elle facilite des pratiques non conformes.

---

## Textes de Loi Applicables

### 1. Code du Travail — Loi n°92/007 du 14 août 1992

Texte fondamental régissant les relations de travail au Cameroun.

| Article | Objet | Contenu clé |
|---------|-------|-------------|
| Art. 1 | Champ d'application | S'applique aux travailleurs et employeurs exerçant leur activité au Cameroun |
| Art. 23-24 | Contrat de travail | Tout contrat de travail doit être constaté par écrit. À défaut, il est réputé CDI |
| Art. 25-27 | Types de contrats | CDI (durée indéterminée), CDD (durée déterminée, max 2 ans renouvelable 1 fois), contrat temporaire |
| Art. 61-62 | Salaire minimum | Le SMIG est fixé par décret. L'employeur ne peut payer en dessous |
| Art. 68 | Bulletin de paie | L'employeur doit délivrer un bulletin de paie à chaque paiement |
| Art. 80-85 | Durée du travail | 40 heures/semaine dans les entreprises non agricoles |
| Art. 86-89 | Heures supplémentaires | Majoration de 20% (41e-48e heure), 40% (au-delà de 48h), 40% (nuit), 50% (dimanche/jours fériés) |
| Art. 89-93 | Repos et congés | 24h de repos hebdomadaire. Congé payé : 1,5 jour ouvrable par mois de service effectif |
| Art. 95 | Congés spéciaux | Maternité (14 semaines), maladie, événements familiaux |
| Art. 167-170 | Sanctions pénales | Infractions aux dispositions du Code, amendes et/ou emprisonnement |

### 2. CNPS — Caisse Nationale de Prévoyance Sociale

Créée par la **Loi n°67/LF/7 du 12 juin 1967**, réorganisée par le **Décret n°2016/072 du 15 février 2016**.

| Branche | Taux employeur | Taux salarié | Total |
|---------|---------------|-------------|-------|
| Allocations familiales | 7,0% | — | 7,0% |
| Accidents du travail / Maladies professionnelles | 1,75% à 5,0% (selon secteur) | — | 1,75%–5,0% |
| Pension vieillesse, invalidité, décès | 4,2% | 4,2% | 8,4% |
| **Total (restauration, risque moyen)** | **~16,2%** | **4,2%** | **~20,4%** |

> **Plafond mensuel de cotisation** : 750 000 FCFA (les cotisations sont calculées sur le salaire brut plafonné à ce montant).

**Obligations de l'employeur envers la CNPS :**
- Immatriculer l'entreprise dans les 3 mois suivant l'embauche du 1er salarié
- Déclarer chaque salarié dans les 8 jours suivant l'embauche
- Verser les cotisations mensuellement (avant le 15 du mois suivant)
- Produire la Déclaration Individuelle des Salaires Annuels (DISA) en janvier de chaque année

### 3. IRPP — Impôt sur le Revenu des Personnes Physiques

Régi par le **Code Général des Impôts (CGI)**, Livre Premier.

L'employeur est **collecteur d'impôt** (retenue à la source obligatoire).

| Tranche de revenu annuel (FCFA) | Taux |
|----------------------------------|------|
| 0 — 2 000 000 | 10% |
| 2 000 001 — 3 000 000 | 15% |
| 3 000 001 — 5 000 000 | 25% |
| 5 000 001 et plus | 35% |

> **Centimes additionnels communaux (CAC)** : 10% de l'IRPP, reversés à la commune.
> **Contribution au Crédit Foncier (CCF)** : 1% du salaire brut imposable.

### 4. SMIG — Salaire Minimum Interprofessionnel Garanti

Fixé par le **Décret n°2023/001 du 3 janvier 2023** :

| Catégorie | Montant mensuel |
|-----------|----------------|
| SMIG (secteur non agricole) | **41 875 FCFA** |
| SMAG (secteur agricole) | 36 270 FCFA |

> Le SMIG s'applique pour 40 heures de travail hebdomadaire (173,33 heures/mois). Le taux horaire minimum est donc de **241,63 FCFA/heure**.

---

## Obligations pour la Plateforme

### KBouffe n'est PAS l'employeur

Les restaurants partenaires sont les employeurs de leur personnel. KBouffe est un intermédiaire technologique. Cependant :

| Obligation | Responsable | Rôle de KBouffe |
|------------|-------------|-----------------|
| Contrat de travail écrit | Restaurant (employeur) | Informer, suggérer des modèles |
| Immatriculation CNPS | Restaurant (employeur) | Vérifier l'immatriculation du restaurant |
| Cotisations CNPS | Restaurant (employeur) | Calculer les montants lors des payouts |
| Retenue IRPP | Restaurant (employeur) | Calculer et afficher la retenue |
| Bulletin de paie | Restaurant (employeur) | Générer un document conforme |
| Respect du SMIG | Restaurant (employeur) | Alerter si salaire < SMIG |
| Déclarations fiscales | Restaurant (employeur) | Mettre à disposition les données |

### Risques spécifiques pour KBouffe

1. **Complicité de travail dissimulé** : Si KBouffe facilite sciemment le paiement de salaires sans cotisations sociales, elle pourrait être poursuivie comme complice.
2. **Responsabilité solidaire** : En cas de sous-traitance, le donneur d'ordre peut être solidairement responsable des obligations sociales (Art. 50 du Code du Travail).
3. **Requalification** : Si KBouffe exerce un contrôle direct sur les employés des restaurants (horaires, méthodes de travail), il y a risque de requalification de la relation en contrat de travail avec KBouffe.

---

## ❌ Exemple Non-Conforme

Le code actuel effectue un paiement brut sans aucune déduction légale :

```typescript
// ❌ NON-CONFORME : Paiement sans cotisations sociales ni retenue fiscale
// Fichier : packages/modules/hr/src/api/payouts.ts

interface StaffPayout {
  member_id: string;
  amount: number; // Montant brut versé tel quel
  payment_method: 'momo' | 'cash';
  status: 'pending' | 'paid' | 'failed';
}

app.post('/payouts', async (c) => {
  const { member_id, amount, payment_method } = await c.req.json();

  // ❌ Aucune vérification du SMIG
  // ❌ Aucun calcul de cotisations CNPS
  // ❌ Aucune retenue IRPP
  // ❌ Aucun bulletin de paie
  // ❌ Pas de vérification de l'immatriculation CNPS du restaurant

  const { data, error } = await supabase
    .from('staff_payouts')
    .insert({
      member_id,
      amount, // Montant brut = montant net versé (ILLÉGAL)
      payment_method,
      status: 'pending',
    });

  // Processus MTN MoMo pour le montant brut total
  await processPayment(member_id, amount, payment_method);

  return c.json({ success: true, payout: data });
});
```

**Problèmes identifiés :**
- Le montant est versé intégralement au salarié sans déduction
- Aucune cotisation CNPS n'est calculée ni provisionnée
- Aucune retenue à la source de l'IRPP
- Pas de vérification que le salaire respecte le SMIG
- Pas de génération de bulletin de paie
- Le restaurant n'est pas alerté de ses obligations légales

---

## ✅ Exemple Conforme

```typescript
// ✅ CONFORME : Calcul des cotisations et retenues légales
// Fichier : packages/modules/hr/src/lib/payroll-calculator.ts

// --- Constantes légales (à mettre à jour selon les décrets en vigueur) ---

const SMIG_MENSUEL = 41_875; // FCFA, Décret n°2023/001
const CNPS_PLAFOND_MENSUEL = 750_000; // FCFA

// Taux CNPS
const CNPS_EMPLOYER_PENSION = 0.042; // 4,2%
const CNPS_EMPLOYER_FAMILY = 0.07; // 7,0%
const CNPS_EMPLOYER_ACCIDENT = 0.05; // 5,0% (restauration = risque moyen-élevé)
const CNPS_EMPLOYEE_PENSION = 0.042; // 4,2%

const CNPS_EMPLOYER_TOTAL =
  CNPS_EMPLOYER_PENSION + CNPS_EMPLOYER_FAMILY + CNPS_EMPLOYER_ACCIDENT; // 16,2%
const CNPS_EMPLOYEE_TOTAL = CNPS_EMPLOYEE_PENSION; // 4,2%

// Taux IRPP (barème annuel converti en mensuel)
const IRPP_BRACKETS = [
  { maxAnnuel: 2_000_000, taux: 0.10 },
  { maxAnnuel: 3_000_000, taux: 0.15 },
  { maxAnnuel: 5_000_000, taux: 0.25 },
  { maxAnnuel: Infinity, taux: 0.35 },
] as const;

const CAC_RATE = 0.10; // 10% de l'IRPP
const CCF_RATE = 0.01; // 1% du brut imposable

interface PayrollBreakdown {
  salaireBrut: number;
  cnpsEmploye: number;
  cnpsEmployeur: number;
  baseImposable: number;
  irpp: number;
  cac: number;
  ccf: number;
  totalRetenues: number;
  salaireNet: number;
  coutTotalEmployeur: number;
}

/**
 * Calcule la ventilation complète d'un salaire selon le droit camerounais.
 * @param salaireBrut - Salaire brut mensuel en FCFA
 * @returns Ventilation détaillée du salaire
 */
export function calculerSalaire(salaireBrut: number): PayrollBreakdown {
  // --- Cotisations CNPS ---
  const assietteCNPS = Math.min(salaireBrut, CNPS_PLAFOND_MENSUEL);
  const cnpsEmploye = Math.round(assietteCNPS * CNPS_EMPLOYEE_TOTAL);
  const cnpsEmployeur = Math.round(assietteCNPS * CNPS_EMPLOYER_TOTAL);

  // --- Base imposable (brut - CNPS salarié) ---
  const baseImposable = salaireBrut - cnpsEmploye;

  // --- IRPP (calcul progressif sur base annuelle, ramené au mois) ---
  const baseAnnuelle = baseImposable * 12;
  let irppAnnuel = 0;
  let restant = baseAnnuelle;
  let trancheBasse = 0;

  for (const tranche of IRPP_BRACKETS) {
    const largeurTranche = tranche.maxAnnuel - trancheBasse;
    const montantDansTranche = Math.min(restant, largeurTranche);
    irppAnnuel += montantDansTranche * tranche.taux;
    restant -= montantDansTranche;
    trancheBasse = tranche.maxAnnuel;
    if (restant <= 0) break;
  }

  const irpp = Math.round(irppAnnuel / 12);
  const cac = Math.round(irpp * CAC_RATE);
  const ccf = Math.round(baseImposable * CCF_RATE);

  // --- Totaux ---
  const totalRetenues = cnpsEmploye + irpp + cac + ccf;
  const salaireNet = salaireBrut - totalRetenues;
  const coutTotalEmployeur = salaireBrut + cnpsEmployeur;

  return {
    salaireBrut,
    cnpsEmploye,
    cnpsEmployeur,
    baseImposable,
    irpp,
    cac,
    ccf,
    totalRetenues,
    salaireNet,
    coutTotalEmployeur,
  };
}

/**
 * Vérifie la conformité d'un salaire avec le SMIG.
 */
export function verifierSMIG(salaireBrut: number, heuresMensuelles: number = 173.33): {
  conforme: boolean;
  smigApplicable: number;
  ecart: number;
} {
  const smigProrata = Math.round((SMIG_MENSUEL / 173.33) * heuresMensuelles);
  return {
    conforme: salaireBrut >= smigProrata,
    smigApplicable: smigProrata,
    ecart: salaireBrut - smigProrata,
  };
}
```

```typescript
// ✅ CONFORME : Route de payout avec vérifications légales
// Fichier : packages/modules/hr/src/api/payouts.ts

import { calculerSalaire, verifierSMIG } from '../lib/payroll-calculator';

interface CompliantPayoutRequest {
  member_id: string;
  salaire_brut: number;
  payment_method: 'momo' | 'cash';
  periode: string; // Format : "2024-01"
  heures_travaillees?: number;
}

app.post('/payouts', async (c) => {
  const { member_id, salaire_brut, payment_method, periode, heures_travaillees } =
    await c.req.json<CompliantPayoutRequest>();

  // 1. Vérifier l'immatriculation CNPS du restaurant
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, cnps_number, cnps_registered')
    .eq('id', c.get('restaurantId'))
    .single();

  if (!restaurant?.cnps_registered) {
    return c.json(
      {
        error: 'Le restaurant n\'est pas immatriculé à la CNPS. ' +
          'L\'immatriculation est obligatoire avant tout versement de salaire. ' +
          'Contactez la CNPS au 1510 ou rendez-vous sur cnps.cm.',
        code: 'CNPS_NOT_REGISTERED',
      },
      403
    );
  }

  // 2. Vérifier le respect du SMIG
  const smigCheck = verifierSMIG(salaire_brut, heures_travaillees);
  if (!smigCheck.conforme) {
    return c.json(
      {
        error: `Le salaire brut (${salaire_brut} FCFA) est inférieur au SMIG ` +
          `applicable (${smigCheck.smigApplicable} FCFA). ` +
          `Écart : ${Math.abs(smigCheck.ecart)} FCFA.`,
        code: 'BELOW_SMIG',
      },
      400
    );
  }

  // 3. Vérifier l'existence du contrat de travail
  const { data: member } = await supabase
    .from('restaurant_members')
    .select('id, user_id, role, contract_type, contract_start_date')
    .eq('id', member_id)
    .eq('restaurant_id', c.get('restaurantId'))
    .single();

  if (!member) {
    return c.json({ error: 'Membre non trouvé.' }, 404);
  }

  if (!member.contract_type) {
    return c.json(
      {
        error: 'Aucun contrat de travail enregistré pour ce membre. ' +
          'Un contrat écrit est obligatoire (Art. 23 du Code du Travail).',
        code: 'NO_CONTRACT',
      },
      400
    );
  }

  // 4. Calculer la ventilation du salaire
  const ventilation = calculerSalaire(salaire_brut);

  // 5. Enregistrer le payout avec toutes les composantes
  const { data: payout, error } = await supabase
    .from('staff_payouts')
    .insert({
      restaurant_id: c.get('restaurantId'),
      member_id,
      periode,
      salaire_brut,
      cnps_employe: ventilation.cnpsEmploye,
      cnps_employeur: ventilation.cnpsEmployeur,
      irpp: ventilation.irpp,
      cac: ventilation.cac,
      ccf: ventilation.ccf,
      total_retenues: ventilation.totalRetenues,
      salaire_net: ventilation.salaireNet,
      cout_total_employeur: ventilation.coutTotalEmployeur,
      payment_method,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    return c.json({ error: 'Erreur lors de l\'enregistrement du payout.' }, 500);
  }

  // 6. Envoyer le salaire NET au salarié (pas le brut)
  await processPayment(member.user_id, ventilation.salaireNet, payment_method);

  // 7. Provisionner les cotisations patronales
  await supabase.from('cnps_provisions').insert({
    restaurant_id: c.get('restaurantId'),
    payout_id: payout.id,
    periode,
    montant_employeur: ventilation.cnpsEmployeur,
    montant_employe: ventilation.cnpsEmploye,
    total: ventilation.cnpsEmployeur + ventilation.cnpsEmploye,
    status: 'provisioned',
  });

  return c.json({
    success: true,
    payout: {
      id: payout.id,
      ventilation,
      message: `Salaire net de ${ventilation.salaireNet} FCFA versé. ` +
        `Cotisations CNPS provisionnées : ${ventilation.cnpsEmployeur + ventilation.cnpsEmploye} FCFA.`,
    },
  });
});
```

```sql
-- ✅ CONFORME : Schéma de base de données pour la paie conforme
-- Migration : staff_payouts table avec champs de conformité

ALTER TABLE staff_payouts
  ADD COLUMN IF NOT EXISTS periode TEXT,
  ADD COLUMN IF NOT EXISTS salaire_brut INTEGER,
  ADD COLUMN IF NOT EXISTS cnps_employe INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cnps_employeur INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS irpp INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cac INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ccf INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_retenues INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS salaire_net INTEGER,
  ADD COLUMN IF NOT EXISTS cout_total_employeur INTEGER;

-- Table des provisions CNPS par restaurant
CREATE TABLE IF NOT EXISTS cnps_provisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  payout_id UUID NOT NULL REFERENCES staff_payouts(id),
  periode TEXT NOT NULL,
  montant_employeur INTEGER NOT NULL,
  montant_employe INTEGER NOT NULL,
  total INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'provisioned'
    CHECK (status IN ('provisioned', 'declared', 'paid')),
  declared_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cnps_provisions_restaurant ON cnps_provisions(restaurant_id);
CREATE INDEX idx_cnps_provisions_periode ON cnps_provisions(periode);
CREATE INDEX idx_cnps_provisions_status ON cnps_provisions(status);

-- Ajout du numéro CNPS au restaurant
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS cnps_number TEXT,
  ADD COLUMN IF NOT EXISTS cnps_registered BOOLEAN DEFAULT FALSE;

-- Ajout du type de contrat au membre
ALTER TABLE restaurant_members
  ADD COLUMN IF NOT EXISTS contract_type TEXT
    CHECK (contract_type IN ('cdi', 'cdd', 'temporaire')),
  ADD COLUMN IF NOT EXISTS contract_start_date DATE,
  ADD COLUMN IF NOT EXISTS contract_end_date DATE;
```

---

## Sanctions

### Sanctions pénales (Code du Travail)

| Infraction | Sanction | Article |
|------------|----------|---------|
| Non-déclaration d'un travailleur | Amende de 50 000 à 500 000 FCFA et/ou emprisonnement de 10 jours à 1 mois | Art. 167 |
| Travail dissimulé (absence de contrat écrit) | Amende de 100 000 à 1 000 000 FCFA | Art. 168 |
| Non-paiement du salaire ou paiement inférieur au SMIG | Amende de 50 000 à 500 000 FCFA par salarié concerné | Art. 169 |
| Non-respect des règles sur la durée du travail | Amende de 20 000 à 200 000 FCFA | Art. 170 |
| Récidive | Peines doublées | Art. 171 |

### Sanctions CNPS

| Infraction | Sanction |
|------------|----------|
| Non-immatriculation de l'entreprise | Amende + immatriculation d'office + arriérés majorés de 10% |
| Retard de paiement des cotisations | Majoration de 5% par mois de retard (plafonné à 50%) |
| Non-déclaration des salariés | Pénalité de 100% des cotisations éludées |
| Fausse déclaration de salaires | Poursuites pénales + redressement |

### Sanctions fiscales (IRPP)

| Infraction | Sanction |
|------------|----------|
| Non-retenue de l'IRPP | L'employeur est personnellement redevable des impôts non retenus |
| Retard de reversement | Pénalité de 1,5% par mois de retard |
| Absence de déclaration | Majoration de 30% + intérêts de retard |

### Risques pour KBouffe

- **Complicité** : faciliter des paiements sans cotisations peut être qualifié de complicité de travail dissimulé.
- **Responsabilité solidaire** : en tant que plateforme facilitant les paiements, KBouffe pourrait être tenue solidairement responsable si un restaurant ne s'acquitte pas de ses obligations.
- **Image de marque** : un scandale lié au non-respect du droit du travail peut détruire la confiance des utilisateurs et des partenaires.

---

## Recommandations Techniques pour KBouffe

### Priorité 1 — Critique (à implémenter immédiatement)

1. **Calculateur de paie intégré** : Implémenter `calculerSalaire()` dans le module HR pour calculer automatiquement les cotisations CNPS et l'IRPP lors de chaque payout.

2. **Vérification SMIG** : Bloquer tout payout dont le salaire brut est inférieur au SMIG pro-rata des heures travaillées.

3. **Versement du salaire NET** : Le montant envoyé via MTN MoMo doit être le salaire net (après retenues), pas le brut.

4. **Statut CNPS du restaurant** : Ajouter les champs `cnps_number` et `cnps_registered` à la table `restaurants`. Exiger l'immatriculation avant d'autoriser les payouts.

### Priorité 2 — Important (dans les 3 mois)

5. **Génération de bulletins de paie** : Créer un PDF conforme pour chaque payout avec la ventilation complète (brut, CNPS, IRPP, CAC, CCF, net).

6. **Provisionnement CNPS** : Créer la table `cnps_provisions` pour suivre les cotisations à déclarer et payer.

7. **Tableau de bord fiscal** : Offrir aux restaurateurs un récapitulatif mensuel des cotisations CNPS et IRPP à verser.

8. **Contrats de travail** : Ajouter le type de contrat (`cdi`, `cdd`, `temporaire`) aux membres et bloquer les payouts sans contrat enregistré.

### Priorité 3 — Amélioration continue

9. **Rappels automatiques** : Envoyer des notifications aux restaurateurs avant les dates limites de déclaration CNPS (15 du mois suivant) et DISA (janvier).

10. **Historique de conformité** : Maintenir un journal d'audit de toutes les vérifications effectuées (SMIG, CNPS, contrat) pour chaque payout.

11. **Module d'export DISA** : Générer automatiquement la Déclaration Individuelle des Salaires Annuels au format requis par la CNPS.

12. **Disclaimer légal** : Afficher clairement dans l'interface HR que KBouffe est un outil de gestion et que la responsabilité légale incombe au restaurateur employeur.

---

## Références

1. **Loi n°92/007 du 14 août 1992** — Code du Travail de la République du Cameroun
   - Source : Journal Officiel de la République du Cameroun
   - Lien : [Code du Travail](https://www.ilo.org/dyn/natlex/natlex4.detail?p_lang=fr&p_isn=31629)

2. **Loi n°67/LF/7 du 12 juin 1967** — Organisation de la prévoyance sociale (modifiée)
   - Institution : CNPS (Caisse Nationale de Prévoyance Sociale)
   - Site : [www.cnps.cm](https://www.cnps.cm)
   - Téléphone : 1510

3. **Décret n°2023/001 du 3 janvier 2023** — Fixation du SMIG
   - SMIG : 41 875 FCFA/mois (secteur non agricole)
   - SMAG : 36 270 FCFA/mois (secteur agricole)

4. **Code Général des Impôts (CGI)** — Livre Premier, Titre I
   - Barème IRPP et obligations de retenue à la source
   - Source : Direction Générale des Impôts (DGI)
   - Site : [www.impots.cm](https://www.impots.cm)

5. **Décret n°2016/072 du 15 février 2016** — Réorganisation de la CNPS
   - Taux de cotisations en vigueur
   - Modalités de déclaration et de paiement

6. **Convention Collective Nationale de l'Hôtellerie et de la Restauration**
   - Dispositions spécifiques au secteur (classifications, primes, avantages en nature)
   - Grilles de salaires par catégorie

7. **Organisation Internationale du Travail (OIT)** — Profil pays Cameroun
   - Lien : [www.ilo.org/cameroun](https://www.ilo.org/africa/countries-covered/cameroun)
