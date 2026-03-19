# Kbouffe Mobile Client

Application mobile cliente pour commander de la nourriture, construite avec **Expo** et **React Native**.

## Stack

- **Expo 54** — Framework React Native
- **React Native 0.81** — UI native cross-platform
- **React 19** — Dernière version de React
- **Expo Router** — Navigation basée sur les fichiers
- **Supabase** — Backend + Auth

## Structure

```
app/
├── (auth)/               # Écrans d'authentification
│   ├── login.tsx
│   └── register.tsx
├── (tabs)/               # Navigation principale
│   ├── index.tsx         # Accueil / Explorer
│   ├── orders.tsx        # Mes commandes
│   └── profile.tsx       # Mon profil
├── cart.tsx              # Panier
├── checkout.tsx          # Paiement
├── onboarding.tsx        # Onboarding
├── product-modal.tsx     # Détail produit
├── order/                # Suivi de commande
├── restaurant/           # Page restaurant
├── profile/              # Sous-pages profil
└── _layout.tsx           # Layout racine
```

## Installation

```bash
# Depuis la racine du monorepo
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés
```

## Développement

```bash
# Lancer Expo
npm start

# Ou directement sur une plateforme
npm run ios      # Simulateur iOS
npm run android  # Émulateur Android
npm run web      # Navigateur web
```

## Variables d'environnement

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_API_URL` | URL de l'API backend |
| `EXPO_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Clé publique Supabase |

## Fonctionnalités

### Client
- Parcourir les restaurants
- Consulter les menus
- Ajouter au panier
- Commander et payer
- Suivre les commandes
- Gérer son profil
- Avis et évaluations

### Authentification
- Connexion / Inscription
- Connexion sociale (Google, Apple)
- Récupération de mot de passe

## Navigation

L'app utilise **Expo Router** avec une structure de fichiers :

```
app/
├── _layout.tsx           # RootLayout avec providers
├── index.tsx             # Redirection initiale
├── (auth)/               # Groupe auth (non connecté)
├── (tabs)/               # Groupe tabs (connecté)
└── [...rest]             # Routes dynamiques
```

## Composants Partagés

```
components/
├── ui/                   # Composants UI de base
├── navigation/           # TabBar, Header
└── features/             # Composants métier
```

## Build & Déploiement

### Development Build
```bash
npx expo run:ios
npx expo run:android
```

### Production Build (EAS)
```bash
# Configurer EAS
eas build:configure

# Build iOS
eas build --platform ios

# Build Android
eas build --platform android

# Soumettre aux stores
eas submit --platform ios
eas submit --platform android
```

## Dépendances Clés

| Package | Usage |
|---------|-------|
| `expo-router` | Navigation |
| `expo-image` | Images optimisées |
| `expo-haptics` | Retour haptique |
| `react-native-reanimated` | Animations fluides |
| `@supabase/supabase-js` | Client Supabase |
