---
name: cameroon-legal-compliance
description: Guide de conformité juridique camerounaise pour plateformes food-tech. Utilisez ce skill lors de la conception, revue ou validation de fonctionnalités touchant à la fiscalité, l'hygiène alimentaire, les paiements, les données personnelles, le droit du travail ou le commerce électronique au Cameroun.
license: MIT
metadata:
  author: kbouffe
  version: "1.0.0"
  organization: KBouffe
  date: March 2026
  abstract: Guide complet de conformité juridique pour les plateformes de commande alimentaire opérant au Cameroun. Couvre 7 domaines légaux prioritaires — fiscalité (TVA, IS, patente), hygiène et sécurité alimentaire (ANOR, HACCP), protection des données (loi 2010/012, ANTIC), réglementation des paiements mobiles (CEMAC, COBAC), droit du travail (CNPS, statut livreurs), marketing et publicité (SMS, opt-in), et obligations des plateformes e-commerce. Chaque référence inclut les textes de loi applicables, les obligations concrètes, les risques de non-conformité et les recommandations d'implémentation technique.
---

# Conformité Juridique Camerounaise — Food-Tech

Guide complet de conformité légale pour les plateformes de commande alimentaire au Cameroun, maintenu par KBouffe. Contient des règles réparties en 7 domaines, priorisées par impact pour guider l'analyse juridique automatisée et la conception de fonctionnalités conformes.

## Quand Utiliser

Référencez ces directives lorsque vous :
- Concevez une nouvelle fonctionnalité touchant aux paiements ou à la facturation
- Ajoutez des produits alimentaires ou modifiez le catalogue
- Gérez des données personnelles (utilisateurs, clients, livreurs)
- Implémentez du marketing (SMS, notifications, publicité)
- Créez des fonctionnalités de gestion d'équipe ou de paie
- Ajoutez un restaurant ou modifiez le processus d'onboarding
- Modifiez les CGV/CGU ou la politique de confidentialité
- Implémentez des rapports financiers ou de la comptabilité

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

## Comment Utiliser

Lisez les fichiers de référence individuels pour des explications détaillées et des recommandations :

```
references/fiscalite-tva.md
references/commerce-licences-resto.md
references/sante-hygiene-alimentaire.md
```

Chaque fichier de référence contient :
- **Textes de loi** applicables avec références précises
- **Obligations concrètes** pour la plateforme
- **Exemple non-conforme** avec explication du risque
- **Exemple conforme** avec implémentation recommandée
- **Sanctions** en cas de non-conformité
- **Recommandations techniques** spécifiques à KBouffe

## ⚠️ Avertissement

Ce skill est un outil de pré-screening juridique. Il ne remplace **pas** une consultation avec un avocat camerounais qualifié. Pour les cas complexes ou les décisions structurantes, consultez toujours un professionnel du droit.

## Références Légales Principales

- Code Général des Impôts du Cameroun (CGI)
- Acte Uniforme OHADA relatif au Droit Commercial Général
- Code du Travail camerounais (Loi n°92/007)
- Loi n°2010/012 relative à la Cybersécurité et Cybercriminalité
- Réglements CEMAC/COBAC sur les établissements de monnaie électronique
- Loi n°2015/018 régissant le Commerce Électronique
- Normes ANOR (Agence des Normes et de la Qualité)
- Code de la Santé Publique
