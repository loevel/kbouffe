# 📚 Documentation Complète du Projet Kbouffe

> **Plateforme** : Kbouffe  
> **Type** : Monorepo SaaS complet (B2B2C + B2B)  
> **Technologies** : React Native (Expo), Next.js, Hono (Cloudflare Workers), Supabase  
> **Version** : 1.1 — Mise à jour Globale (Avril 2026)

---

## Table des Matières
1. [Vision et Philosophie du Produit](#1-vision-et-philosophie-du-produit)
2. [Architecture Technique & Infrastructure](#2-architecture-technique--infrastructure)
3. [Structure du Monorepo (Turborepo)](#3-structure-du-monorepo-turborepo)
4. [Détail des Applications](#4-détail-des-applications-apps)
5. [Détail des Modules Métier (packages/modules)](#5-détail-des-modules-métier-packagesmodules)
6. [Base de Données & Supabase](#6-base-de-données--supabase)
7. [Fonctionnalités Avancées & Innovations](#7-fonctionnalités-avancées--innovations)
8. [Sécurité et Conformité](#8-sécurité-et-conformité)
9. [Déploiement et Opérations (CI/CD)](#9-déploiement-et-opérations-cicd)
10. [Règles de Contribution](#10-règles-de-contribution)

---

## 1. Vision et Philosophie du Produit

**Kbouffe** est une plateforme "tout-en-un" qui digitalise et connecte tous les acteurs de l'écosystème de la restauration :
- **B2C (Business to Consumer)** : Les clients commandent et réservent via une application mobile performante et esthétique.
- **B2B (Business to Business - Restauration)** : Les restaurateurs gèrent leurs commandes, leur menu, leurs équipes, et leurs stratégies marketing via un Dashboard Web complet.
- **B2B (Business to Business - Fournisseurs)** : Une marketplace intégrée (Module Marketplace) permet aux restaurants de s'approvisionner directement auprès de fournisseurs et producteurs locaux.
- **Logistique** : Intégration d'un module de livreurs (drivers).

L'objectif de Kbouffe est d'éliminer le besoin pour un restaurant d'utiliser plusieurs logiciels isolés (un pour la caisse, un pour les commandes en ligne, un pour les réservations, un pour les fournisseurs) en centralisant tout sur une seule base de données temps réel.

---

## 2. Architecture Technique & Infrastructure

L'architecture est entièrement **Serverless et Edge-native** pour garantir une latence minimale mondiale, une haute disponibilité et des coûts maîtrisés.

### 🛠 Stack Principale
| Couche | Technologies clés | Raison du choix |
|--------|-------------------|-----------------|
| **Base de Données** | Supabase (PostgreSQL), Edge Functions | Données relationnelles complexes, RLS, Webhooks, Temps réel (Realtime) natif. |
| **API Backend** | Hono, Cloudflare Workers | Déploiement "Edge" ultrarapide (0ms cold start), légèreté, TypeScript natif. |
| **Dashboard (Web)**| Next.js 16 (App Router), React 19, TailwindCSS 4, OpenNext | Rendu hybride (SSR/CSR), performance Edge, expérience admin ultra-réactive. |
| **App Mobile** | React Native 0.81, Expo 54, Reanimated, Haptics | Code unique iOS/Android, OTA updates, UX premium (animations/haptiques fluides). |
| **Gestionnaire** | Turborepo, npm workspaces | Partage de code TypeScript (types, UI, logique) entre API, Web et Mobile. |

### 🔄 Flux de Données (Data Flow)
1. Le **Client Mobile** ou le **Dashboard Web** effectue une requête HTTPS à l'**API Hono** (hébergée sur le CDN Cloudflare).
2. L'API vérifie le JWT via **Supabase Auth** (Middleware).
3. L'API interagit avec **Supabase PostgreSQL** via le client Supabase (Data API).
4. La base de données applique automatiquement les **RLS (Row Level Security)** pour sécuriser les données.
5. Sur certains événements (ex: nouvelle commande), la BDD émet un signal **Realtime** intercepté par les clients connectés, et déclenche des **Edge Functions** (ex: envois de SMS/Push).

---

## 3. Structure du Monorepo (Turborepo)

Le dépôt utilise une architecture monorepo stricte :

```text
kbouffe.com/
├── apps/                        # Les applications exécutables
│   ├── api/                     # Backend (Cloudflare Worker)
│   ├── mobile-client/           # Application Mobile (Expo)
│   └── web-dashboard/           # Panel Web (Next.js)
│
├── packages/                    # Les bibliothèques partagées
│   ├── shared-types/            # Interfaces/Types TypeScript globaux
│   └── modules/                 # Logique métier cloisonnée par domaine
│       ├── capital/             # Financement & Crédits
│       ├── catalog/             # Produits, Menus, Options
│       ├── chat/                # Messagerie interne
│       ├── core/                # Auth, Upload, Notifications
│       ├── crm/                 # Clients, Historiques
│       ├── hr/                  # Équipes, Plannings, Paies
│       ├── marketing/           # Promos, Pubs, SMS, Emails
│       ├── marketplace/         # B2B Fournisseurs
│       ├── orders/              # Commandes, Caisse, KDS
│       ├── reports/             # Analytique et comptabilité
│       └── reservations/        # Gestion des tables
│
├── supabase/                    # Infrastructure DB (IaC)
│   ├── migrations/              # Fichiers SQL versionnés
│   └── functions/               # Supabase Edge Functions (ex: kds-notify)
│
└── tools/                       # Outils de dev (MCP, Scripts)
```

---

## 4. Détail des Applications (apps/)

### 🚀 4.1. API Backend (`apps/api/`)
Un service Cloudflare Worker écrit avec le framework **Hono**.
- **Point d'entrée unique** : `src/index.ts`. Gère les routes sous le préfixe `/api/*`.
- **Middlewares complexes** :
  - `authMiddleware` : Vérification du token marchand.
  - `userAuthMiddleware` : Vérification utilisateur (clients/fournisseurs).
  - `adminMiddleware` : Accès Super-Admin.
  - `requireModule` : Vérifie si le restaurant a souscrit au module demandé.
- **Tâches en arrière-plan** : Utilise Cloudflare Queues (`processSmsQueue`) pour l'envoi de SMS asynchrone, et Cloudflare Cron Triggers (`scheduled`) pour la purge légale des données (anonymisation après 10 ans, suppression après 3 ans).

### 📱 4.2. Mobile Client (`apps/mobile-client/`)
Application React Native pour les consommateurs finaux.
- **Routing** : Expo Router basé sur les fichiers (`app/(tabs)`, `app/restaurant/[id].tsx`, `app/checkout.tsx`).
- **UX Premium** : Utilisation intensive de `react-native-reanimated` pour des transitions `FadeInDown`, `ZoomIn`, et d'`expo-haptics` pour des retours sensitifs (validation panier, likes).
- **Fonctionnalités** : Recherche (Explore), Panier synchronisé (Context), Suivi de commande en temps réel, Profile avec KYC et historique.

### 💻 4.3. Web Dashboard (`apps/web-dashboard/`)
Panel de gestion en Next.js (App Router).
- **Multi-tenant** :
  - `/dashboard/*` : Pour les restaurateurs.
  - `/admin/*` : Pour l'administration globale Kbouffe.
  - `/driver/*` : Interface livreurs.
  - `/stores/*` : Vitrine publique SEO-friendly.
- **Technologies intégrées** : `recharts` pour l'analytique, `leaflet` pour la cartographie des livraisons, `tesseract.js` / `face-api.js` pour la vérification KYC automatisée dans le navigateur.

---

## 5. Détail des Modules Métier (`packages/modules/`)

L'architecture métier est découpée en "micro-services logiques" au sein du monorepo. Chaque module exporte son `api` (Hono routes) et son `ui` (Composants React).

- **`core`** : Gère les identités, les sessions, l'upload de fichiers (Supabase Storage) et les KYC (Know Your Customer) pour l'onboarding des restaurants.
- **`catalog`** : Structure du menu. Gestion des catégories, des produits, des options de personnalisation, et des labels diététiques (Vegan, Halal).
- **`orders`** : Le cœur transactionnel. Intègre la caisse (PoS), la gestion de la livraison, et le **KDS (Kitchen Display System)**.
- **`reservations`** : Mapping visuel des tables du restaurant, gestion des créneaux horaires et des conflits.
- **`crm`** : Base de données clients du restaurant. Permet de voir l'historique d'achat d'un client spécifique pour de la fidélisation.
- **`marketing`** : Création de campagnes SMS/Emails, gestion des codes promotionnels et des cartes cadeaux.
- **`hr` (Human Resources)** : Gestion des employés du restaurant (serveurs, cuisiniers), de leurs rôles, et préparation des "payouts" (fiches de paie).
- **`marketplace`** : Un espace B2B où les restaurants peuvent commander des matières premières directement aux agriculteurs et grossistes, avec traçabilité intégrée.
- **`reports`** : Dashboards financiers, calculs de TVA (export DGI), rentabilité.
- **`chat`** : Communication en temps réel (SAV client-restaurant, ou restaurant-fournisseur).
- **`capital`** : Module de financement permettant aux restaurants performants de demander des micros-crédits basés sur leur historique de ventes.

---

## 6. Base de Données & Supabase

### 6.1. Schéma Relationnel
La base de données PostgreSQL est le cœur du système. Les données sont structurées avec une contrainte multi-tenant stricte : presque chaque table (sauf les tables de plateforme) contient un `restaurant_id`.

### 6.2. Sécurité : RLS (Row Level Security)
Les politiques RLS garantissent que les requêtes API s'exécutent avec le contexte de l'utilisateur. Exemple : un restaurateur exécutant `SELECT * FROM orders` ne récupérera *que* les commandes de son établissement, géré au niveau du moteur Postgres sans risque de faille applicative.

### 6.3. Optimisation KDS (Supabase Compute)
Pour la vue "Cuisine", un système de Vues SQL (`vw_kds_orders`) a été mis en place pour calculer le temps d'attente et l'urgence côté serveur. Des triggers SQL injectent les événements dans une file (`kds_notifications`) consommée par une **Edge Function Supabase** (`kds-notify`) qui alerte les cuisiniers via Web Push ou SMS instantanément.

---

## 7. Fonctionnalités Avancées & Innovations

- **KDS Temps Réel** : L'écran de la cuisine reçoit les commandes instantanément via Supabase Realtime, avec des alertes sonores et visuelles gérées dynamiquement.
- **Marketplace Fournisseurs (B2B)** : Traceabilité de la ferme à l'assiette. Les fournisseurs s'inscrivent, subissent un KYC, et publient leurs "Packs".
- **KYC Automatisé** : Le tableau de bord web utilise de la computer vision (`tesseract.js` pour la lecture d'ID, `face-api.js`) pour pré-valider les identités et documents légaux.
- **Multi-Marques (Dark Kitchens)** : Un seul compte marchand peut gérer plusieurs marques virtuelles qui partagent la même cuisine physique et les mêmes stocks.
- **Mode Hors-ligne partiel** : Le KDS et la caisse intègrent des mécanismes de mise en cache (`swr`, Zustand) pour résister aux micro-coupures réseau.

---

## 8. Sécurité et Conformité

- **Rate Limiting** : Implémenté nativement dans l'API (`apps/api/src/index.ts`) sur les routes d'authentification et de validation de coupons (prévention force brute).
- **CORS Stricts** : L'API n'autorise que les origines de production déclarées (`kbouffe.com`).
- **Anonymisation des Données** : Un cron job (Cloudflare Scheduled Event) s'assure que les données PII (Personnally Identifiable Information) des clients sont purgées ou anonymisées après 10 ans, conformément aux obligations légales fiscales tout en respectant la vie privée.
- **RBAC (Role Based Access Control)** : Hiérarchie stricte (`super_admin`, `merchant_owner`, `merchant_staff`, `supplier`, `customer`).

---

## 9. Déploiement et Opérations (CI/CD)

Le projet utilise des pipelines robustes (historiquement Vercel/Railway, désormais pleinement orienté Cloudflare).

- **API** :
  ```bash
  cd apps/api && npm run deploy # Déploie le worker Hono
  ```
- **Web Dashboard** :
  ```bash
  cd apps/web-dashboard && npm run build:worker && npm run deploy # Via OpenNext
  ```
- **Mobile** :
  ```bash
  cd apps/mobile-client && eas build --platform all --profile production # Via Expo Application Services
  ```
- **Base de données** :
  Migrations gérées via la CLI Supabase (`npx supabase db push`).

---

## 10. Règles de Contribution

1. **Convention de Code** : TypeScript strict. Pas de `any` sans justification. Utilisation des Hooks React modernes.
2. **Architecture Modulaire** : Toute nouvelle fonctionnalité métier transversale doit être créée sous `packages/modules/` et non codée en dur dans les applications.
3. **Sécurité d'abord** : Toute nouvelle table Supabase **doit** être accompagnée de ses politiques RLS associées (Lecture, Insertion, Modification, Suppression).
4. **Design System** : Utilisation exclusive des variables du thème (`Colors`, `Spacing`, `Radii`, `Typography`) définies dans les constantes (Mobile) ou dans `tailwind.config` (Web) pour maintenir la cohérence de marque.
