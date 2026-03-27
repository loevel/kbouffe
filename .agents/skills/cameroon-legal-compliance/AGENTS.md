# Conformité Juridique Camerounaise — Food-Tech

## Structure

```
cameroon-legal-compliance/
  SKILL.md       # Fichier principal du skill — lire en premier
  AGENTS.md      # Ce guide de navigation
  CLAUDE.md      # Symlink vers AGENTS.md
  references/    # Fichiers de référence détaillés
```

## Usage

1. Lire `SKILL.md` pour les instructions principales du skill
2. Parcourir `references/` pour la documentation détaillée par domaine
3. Les fichiers de référence sont chargés à la demande — ne lire que ce qui est nécessaire

Guide complet de conformité légale pour les plateformes de commande alimentaire au Cameroun. Contient des règles réparties en 7+ domaines, priorisées par impact pour guider l'analyse juridique et la conception de fonctionnalités conformes.

## Quand Utiliser

Référencez ces directives lorsque vous :
- Concevez une nouvelle fonctionnalité touchant aux paiements ou à la facturation
- Ajoutez des produits alimentaires ou modifiez le catalogue
- Gérez des données personnelles (utilisateurs, clients, livreurs)
- Implémentez du marketing (SMS, notifications, publicité)
- Créez des fonctionnalités de gestion d'équipe ou de paie
- Ajoutez un restaurant ou modifiez le processus d'onboarding

## Domaines par Priorité

| Priorité | Domaine | Impact | Préfixe |
|----------|---------|--------|---------|
| 1 | Fiscalité & TVA | CRITIQUE | `fiscalite-` |
| 2 | Commerce & Licences | CRITIQUE | `commerce-` |
| 3 | Santé & Hygiène | ÉLEVÉ | `sante-` |
| 4 | Données Personnelles | ÉLEVÉ | `donnees-` |
| 5 | Paiements Mobiles | ÉLEVÉ | `paiement-` |
| 6 | Travail & Emploi | MOYEN | `travail-` |
| 7 | Marketing & Publicité | MOYEN | `marketing-` |
| 8 | Protection Consommateur | MOYEN | `consommateur-` |
| 9 | Obligations Comptables | MOYEN | `fintech-` |
| 10 | E-commerce & Plateforme | MOYEN | `ecommerce-` |

## Fichiers de Référence

### Fiscalité (CRITIQUE)
- `references/fiscalite-tva.md` — TVA 19.25%, IS, patente, taxes communales
- `references/fiscalite-retenue-source.md` — Retenues à la source, précomptes

### Commerce (CRITIQUE)
- `references/commerce-registre.md` — RCCM, NIF, inscription au commerce OHADA
- `references/commerce-licences-resto.md` — Licences restaurants, débits de boisson

### Santé & Hygiène (ÉLEVÉ)
- `references/sante-hygiene-alimentaire.md` — Normes ANOR, inspections sanitaires
- `references/sante-allergenes-tracabilite.md` — Allergènes, traçabilité, HACCP

### Données Personnelles (ÉLEVÉ)
- `references/donnees-personnelles.md` — Loi 2010/012, ANTIC, consentement

### Paiements (ÉLEVÉ)
- `references/paiement-mobile-money.md` — CEMAC, COBAC, EME, KYC

### Travail (MOYEN)
- `references/travail-emploi.md` — Code du travail, CNPS, cotisations
- `references/travail-livreurs.md` — Statut livreurs, assurance transport

### Marketing (MOYEN)
- `references/marketing-sms-pub.md` — SMS commercial, opt-in/opt-out

### Consommateur (MOYEN)
- `references/consommateur-protection.md` — Droits, garanties, prix

### Comptabilité (MOYEN)
- `references/fintech-reporting.md` — SYSCOHADA, DGI, audit

### E-commerce (MOYEN)
- `references/ecommerce-plateforme.md` — Statut plateforme, CGV/CGU
