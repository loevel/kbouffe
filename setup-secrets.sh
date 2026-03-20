#!/bin/bash

# Script de configuration des Secrets Cloudflare Wrangler
# Ce script crée un Secrets Store et configure tous les secrets nécessaires

set -e

echo "🔐 Cloudflare Secrets Store Setup"
echo "=================================="
echo ""

# Étape 1: Créer un Secrets Store
echo "📦 Étape 1: Création du Secrets Store..."
echo "Exécution: wrangler secrets-store store create kbouffe --remote"
echo ""

npx wrangler secrets-store store create kbouffe --remote

echo ""
echo "✅ Secrets Store créé"
echo ""
echo "⚠️  IMPORTANT: Copie le STORE_ID de la sortie ci-dessus"
echo ""

# Demander le STORE_ID
read -p "Colle ton STORE_ID ici: " STORE_ID

if [ -z "$STORE_ID" ]; then
  echo "❌ STORE_ID vide. Abandon."
  exit 1
fi

echo ""
echo "🔑 Étape 2: Configuration des secrets..."
echo ""

# Fonction pour créer un secret
create_secret() {
  local SECRET_NAME=$1
  local DEFAULT_VALUE=$2
  local DESCRIPTION=$3

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📝 $SECRET_NAME"
  echo "   $DESCRIPTION"

  if [ -n "$DEFAULT_VALUE" ]; then
    echo "   ℹ️  Valeur détectée dans .env.local"
    echo -n "   Utiliser cette valeur? (o/n): "
    read -r USE_DEFAULT
    if [[ "$USE_DEFAULT" =~ ^[oO]$ ]]; then
      SECRET_VALUE="$DEFAULT_VALUE"
    else
      echo "   Entrez la nouvelle valeur:"
      read -s SECRET_VALUE
    fi
  else
    echo "   Entrez la valeur du secret:"
    read -s SECRET_VALUE
  fi

  echo ""

  if [ -n "$SECRET_VALUE" ]; then
    echo -n "   Création du secret..."
    echo "$SECRET_VALUE" | npx wrangler secrets-store secret create "$STORE_ID" --name "$SECRET_NAME" --scopes workers --remote > /dev/null 2>&1
    echo " ✅"
  else
    echo "   ⏭️  Ignoré (valeur vide)"
  fi
}

# Supabase Secrets
echo "🔷 SUPABASE SECRETS"
create_secret "SUPABASE_URL" "https://wkuyuiypkbgsftgtstra.supabase.co" "URL du projet Supabase"
create_secret "SUPABASE_ANON_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrdXl1aXlwa2Jnc2Z0Z3RzdHJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNDE3MTMsImV4cCI6MjA4NzkxNzcxM30.KSRYboSZP_JsD6I5G3xVB8Hi_AiiVBEOmS1WlrdJdP4" "Clé anonyme Supabase"
create_secret "SUPABASE_SERVICE_ROLE_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrdXl1aXlwa2Jnc2Z0Z3RzdHJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM0MTcxMywiZXhwIjoyMDg3OTE3NzEzfQ.4CDVQatuXvXmksCHlVUztdE4jC6XwHH2AAhvhQBO0Zs" "Clé service role Supabase"

echo ""
echo "🔴 MTN COLLECTION (Paiements)"
create_secret "MTN_BASE_URL" "" "URL de base MTN (sandbox ou production)"
create_secret "MTN_API_USER" "" "UUID du compte MTN Developer"
create_secret "MTN_API_KEY" "" "Clé API MTN"
create_secret "MTN_COLLECTION_SUBSCRIPTION_KEY" "" "Clé de souscription MTN Collection"
create_secret "MTN_TARGET_ENV" "sandbox" "Environnement cible (sandbox ou mtnCameroon)"
create_secret "MTN_CALLBACK_URL" "" "URL de webhook pour les paiements"
create_secret "MTN_WEBHOOK_SECRET" "" "Secret pour valider les webhooks"

echo ""
echo "🟠 MTN DISBURSEMENT (Paiements sortants)"
create_secret "MTN_DISBURSEMENT_API_USER" "" "UUID du compte Disbursement"
create_secret "MTN_DISBURSEMENT_API_KEY" "" "Clé API Disbursement"
create_secret "MTN_DISBURSEMENT_SUBSCRIPTION_KEY" "" "Clé de souscription Disbursement"
create_secret "MTN_DISBURSEMENT_CALLBACK_URL" "" "URL de webhook Disbursement"

echo ""
echo "📱 MTN SMS"
create_secret "MTN_SMS_BASE_URL" "https://api.mtn.com" "URL de base MTN SMS"
create_secret "MTN_SMS_CLIENT_ID" "" "Client ID OAuth 2.0"
create_secret "MTN_SMS_CLIENT_SECRET" "" "Client Secret OAuth 2.0"
create_secret "MTN_SMS_SUBSCRIPTION_KEY" "" "Clé de souscription SMS"
create_secret "MTN_SMS_SENDER_ADDRESS" "KBOUFFE" "Numéro ou code d'expéditeur"

echo ""
echo "🆔 MTN KYC (Vérification d'identité)"
create_secret "MTN_KYC_BASE_URL" "https://api.mtn.com/v1/kycVerification" "URL de base KYC"
create_secret "MTN_KYC_CLIENT_ID" "" "Client ID KYC"
create_secret "MTN_KYC_CLIENT_SECRET" "" "Client Secret KYC"
create_secret "MTN_KYC_SUBSCRIPTION_KEY" "" "Clé de souscription KYC"

echo ""
echo "📢 MTN ADVERTISING (Publicités)"
create_secret "MTN_ADS_BASE_URL" "https://api.mtn.com" "URL de base Ads"
create_secret "MTN_ADS_CLIENT_ID" "" "Client ID Ads"
create_secret "MTN_ADS_CLIENT_SECRET" "" "Client Secret Ads"
create_secret "MTN_ADS_SUBSCRIPTION_KEY" "" "Clé de souscription Ads"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Configuration complète!"
echo ""
echo "📋 Secrets créés dans le store: $STORE_ID"
echo ""
echo "📚 Prochaines étapes:"
echo "   1. Vérifier les secrets: wrangler secrets-store secret list $STORE_ID"
echo "   2. Lier les secrets aux Workers dans wrangler.toml"
echo "   3. Redéployer les Workers: wrangler deploy"
echo ""
