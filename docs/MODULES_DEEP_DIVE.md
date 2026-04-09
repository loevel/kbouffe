# 🧭 Plongée Profonde dans les Modules Métier (packages/modules)

> **Plateforme** : Kbouffe  
> **Composant** : Monorepo / Workspaces (`packages/modules/*`)  
> **Architecture** : Chaque module est un package indépendant, exportant à la fois des routes API (Hono) et des composants React (UI) pour être consommés par les applications clientes (Web Dashboard, Mobile App) ou l'API centrale.

Cette documentation détaille l'intérieur de **chaque recoin métier** du projet, afin de faciliter la maintenance, le débogage et l'onboarding de nouveaux développeurs.

---

## 1. ⚙️ Module Core (`packages/modules/core`)
C'est le module fondamental sur lequel reposent tous les autres. Il gère l'authentification, les configurations de base des restaurants, l'upload de fichiers et la facturation interne de la plateforme.

### Contenu API (`src/api/`)
- `auth.ts` : Gestion des sessions, login/register (intégration avec Supabase Auth).
- `billing.ts` : Facturation SaaS des restaurants (abonnements mensuels, historiques des paiements à la plateforme).
- `brands.ts` : Gestion des "Dark Kitchens" et multi-marques. Permet à un seul compte propriétaire de gérer plusieurs devantures virtuelles (brands).
- `stores.ts` : Profil du restaurant (horaires d'ouverture, coordonnées, paramètres globaux).
- `upload.ts` : Interaction avec Supabase Storage pour l'upload des logos, bannières et documents légaux.
- `users.ts` : Gestion du profil utilisateur marchand.

---

## 2. 🍔 Module Catalog (`packages/modules/catalog`)
Le cœur de la gestion des menus. Il permet de structurer les offres pour l'application mobile et le dashboard.

### Contenu API (`src/api/`)
- `menu.ts` : Endpoints publics pour récupérer le menu complet d'un restaurant, optimisé pour l'affichage mobile.
- `categories.ts` : Création et tri des catégories (Entrées, Plats, Desserts).
- `products.ts` : Gestion complète d'un produit (nom, prix, image, options de personnalisation comme la cuisson ou les suppléments, et tags diététiques tels que Halal/Vegan).

---

## 3. 🛒 Module Orders (`packages/modules/orders`)
Le moteur transactionnel de Kbouffe. Il gère le cycle de vie complet d'une commande, de la prise de commande au paiement, jusqu'à la cuisine et la livraison.

### Contenu API (`src/api/`)
- `orders.ts` : Création des commandes (depuis le mobile ou le web), changement de statut (pending, preparing, ready, delivering, completed). C'est ce fichier qui est surveillé par le système KDS (Kitchen Display System).
- `caisse.ts` : Endpoints spécifiques pour la fonctionnalité PoS (Point of Sale) / Caisse Enregistreuse sur place.
- `payments.ts` : Initialisation des paiements.
- `mobile-money-providers.ts` : Intégration stricte avec les fournisseurs locaux (MTN Mobile Money, Orange Money).
- `zones/` : Définition des polygones ou rayons de livraison (ex: facturation dynamique basée sur la distance).

---

## 4. 🪑 Module Reservations (`packages/modules/reservations`)
Gère l'accueil physique des clients au restaurant.

### Contenu API (`src/api/`)
- `reservations.ts` : Prise de réservation (nombre de couverts, heure, statut : acceptée/refusée/terminée).
- `tables.ts` : Configuration physique des tables du restaurant (capacité, numéro).
- `zones.ts` : Mapping des salles (ex: "Terrasse", "Salle Principale", "VIP").

---

## 5. 👥 Module CRM (`packages/modules/crm`)
*Customer Relationship Management*. Il permet au restaurateur de connaître sa clientèle.

### Contenu API (`src/api/`)
- `customers.ts` : Historique d'achats par client, fréquence de visite, calcul de la LTV (Life Time Value). Utile pour des campagnes de fidélisation ciblées.

---

## 6. 📢 Module Marketing (`packages/modules/marketing`)
Outils de croissance et d'acquisition pour les restaurants.

### Contenu API (`src/api/`)
- `marketing.ts` : Dashboard général des performances marketing.
- `ads.ts` : Création de bannières sponsorisées ("Mise en avant" sur l'app mobile).
- `coupons.ts` / `coupon-validate.ts` : Création de codes promotionnels (réductions en % ou valeur fixe) et validation sécurisée avec Rate Limiting.
- `gift-cards.ts` : Génération et gestion de cartes cadeaux prépayées.
- `sms.ts` : Intégration pour envoyer des alertes SMS aux clients.
- `email-templates.ts` / `email-ai.ts` : Génération d'emails marketing (potentiellement assistés par l'IA pour la rédaction de newsletters).

---

## 7. 👨‍🍳 Module HR (`packages/modules/hr`)
*Human Resources*. Gestion du personnel.

### Contenu API (`src/api/`)
- `team.ts` : Invitation de membres de l'équipe (Serveurs, Managers, Cuisiniers).
- `permissions.ts` : Gestion du RBAC (Role Based Access Control) spécifique au restaurant. Un serveur ne peut pas voir les données financières.
- `payouts.ts` : Suivi des versements, primes ou calcul des heures travaillées pour préparer les paies.

---

## 8. 💬 Module Chat (`packages/modules/chat`)
Système de communication interne.
- Permet l'échange en temps réel entre le client et le support du restaurant (ou le livreur).
- Basé sur les capacités Realtime de Supabase.

---

## 9. 📈 Module Reports (`packages/modules/reports`)
L'intelligence d'affaires (Business Intelligence) du restaurant.
- Génération d'exports comptables (CSV/Excel/PDF).
- Calculs automatisés pour les déclarations TVA (spécifique à la DGI).
- Rapports de ventes croisées (quel produit se vend le mieux à quelle heure).

---

## 10. 🏦 Module Capital (`packages/modules/capital`)
Le module "Fintech" de Kbouffe.
- Analyse automatique de l'historique des ventes d'un marchand.
- Proposition de micro-crédits ou d'avances de trésorerie basées sur les revenus futurs prévus (Revenue-Based Financing).

---

## 11. 🚜 Module Marketplace (`packages/modules/marketplace`)
Le réseau B2B. Ce module transforme Kbouffe d'un simple outil SaaS pour restaurants en une véritable chaîne d'approvisionnement.

### Contenu API (`src/api/`)
- `public.ts` : Annuaire public des fournisseurs agricoles et grossistes partenaires.
- `merchant.ts` : Pour le restaurateur : interface d'achat de "Packs" ou matières premières.
- `suppliers.ts` / `supplier-admin.ts` : Pour les fournisseurs : gestion de leur catalogue, commandes reçues et KYC (Know Your Supplier).
- `trace.ts` : Traçabilité des lots de marchandises de la ferme à l'assiette.
- `subscriptions.ts` : Abonnements récurrents aux matières premières (ex: 50kg de farine par semaine).
- `webhooks.ts` : Points de synchronisation pour les paiements B2B.

---

### Synthèse de l'Intégration
Tous ces modules (qui contiennent également chacun un dossier `src/ui/` avec des composants React liés comme `OrderCard`, `CouponForm`, `ProductList`) sont agrégés dans **`apps/api/src/index.ts`** via Hono. Cela garantit une base de code parfaitement cloisonnée mais facilement distribuable via Turborepo.