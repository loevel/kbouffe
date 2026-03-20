#!/bin/bash

# Configuration des Secrets Cloudflare pour kbouffe
# Utilise le Secrets Store existant

STORE_ID="7c9fc004d8594bddb6d6b779270055e2"

echo "🔐 Configuration des Secrets Cloudflare"
echo "========================================"
echo "Store ID: $STORE_ID"
echo ""

# Fonction pour créer un secret
create_secret() {
  local SECRET_NAME=$1
  local DEFAULT_VALUE=$2
  local DESCRIPTION=$3

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📝 $SECRET_NAME"
  echo "   $DESCRIPTION"

  if [ -n "$DEFAULT_VALUE" ]; then
    echo ""
    echo "   ℹ️  Valeur trouvée dans .env.local"
    echo -n "   Utiliser cette valeur? (o/n): "
    read -r USE_DEFAULT
    if [[ "$USE_DEFAULT" =~ ^[oO]$ ]]; then
      SECRET_VALUE="$DEFAULT_VALUE"
      USING_DEFAULT=true
    else
      echo "   Entrez la nouvelle valeur (ou laissez vide pour ignorer):"
      read -s SECRET_VALUE
      USING_DEFAULT=false
    fi
  else
    echo ""
    echo "   Entrez la valeur du secret (ou laissez vide pour ignorer):"
    read -s SECRET_VALUE
    USING_DEFAULT=false
  fi

  echo ""

  if [ -n "$SECRET_VALUE" ]; then
    echo -n "   Création en cours..."
    if echo "$SECRET_VALUE" | npx wrangler secrets-store secret create "$STORE_ID" --name "$SECRET_NAME" --scopes workers --remote > /dev/null 2>&1; then
      echo " ✅"
      return 0
    else
      echo " ❌ (erreur - secret peut déjà exister)"
      return 1
    fi
  else
    echo "   ⏭️  Ignoré (valeur vide)"
    return 2
  fi
}

echo "🔷 SUPABASE SECRETS"
echo ""
create_secret "SUPABASE_URL" "https://wkuyuiypkbgsftgtstra.supabase.co" "URL du projet Supabase"
create_secret "SUPABASE_ANON_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrdXl1aXlwa2Jnc2Z0Z3RzdHJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNDE3MTMsImV4cCI6MjA4NzkxNzcxM30.KSRYboSZP_JsD6I5G3xVB8Hi_AiiVBEOmS1WlrdJdP4" "Clé anonyme Supabase (public)"
create_secret "SUPABASE_SERVICE_ROLE_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrdXl1aXlwa2Jnc2Z0Z3RzdHJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM0MTcxMywiZXhwIjoyMDg3OTE3NzEzfQ.4CDVQatuXvXmksCHlVUztdE4jC6XwHH2AAhvhQBO0Zs" "Clé service role Supabase (secret)"

echo ""
echo "🔴 MTN COLLECTION (Paiements clients)"
create_secret "MTN_BASE_URL" "" "URL de base MTN (https://sandbox.momodeveloper.mtn.com ou https://momodeveloper.mtn.com)"
create_secret "MTN_API_USER" "" "UUID du compte MTN Developer"
create_secret "MTN_API_KEY" "" "Clé API MTN"
create_secret "MTN_COLLECTION_SUBSCRIPTION_KEY" "" "Ocp-Apim-Subscription-Key (Collection)"
create_secret "MTN_TARGET_ENV" "sandbox" "Environnement: sandbox ou mtnCameroon"
create_secret "MTN_CALLBACK_URL" "" "URL webhook pour les callbacks de paiement"
create_secret "MTN_WEBHOOK_SECRET" "" "Secret pour signer les webhooks"

echo ""
echo "🟠 MTN DISBURSEMENT (Paiements aux restaurants/livreurs)"
create_secret "MTN_DISBURSEMENT_API_USER" "" "UUID du compte Disbursement"
create_secret "MTN_DISBURSEMENT_API_KEY" "" "Clé API Disbursement"
create_secret "MTN_DISBURSEMENT_SUBSCRIPTION_KEY" "" "Ocp-Apim-Subscription-Key (Disbursement)"
create_secret "MTN_DISBURSEMENT_CALLBACK_URL" "" "URL webhook Disbursement"

echo ""
echo "📱 MTN SMS"
create_secret "MTN_SMS_BASE_URL" "https://api.mtn.com" "URL de base SMS"
create_secret "MTN_SMS_CLIENT_ID" "" "Client ID OAuth 2.0"
create_secret "MTN_SMS_CLIENT_SECRET" "" "Client Secret OAuth 2.0"
create_secret "MTN_SMS_SUBSCRIPTION_KEY" "" "Ocp-Apim-Subscription-Key (SMS)"
create_secret "MTN_SMS_SENDER_ADDRESS" "KBOUFFE" "Numéro/code expéditeur enregistré"

echo ""
echo "🆔 MTN KYC (Vérification d'identité)"
create_secret "MTN_KYC_BASE_URL" "https://api.mtn.com/v1/kycVerification" "URL de base KYC"
create_secret "MTN_KYC_CLIENT_ID" "" "Client ID KYC (peut réutiliser SMS)"
create_secret "MTN_KYC_CLIENT_SECRET" "" "Client Secret KYC (peut réutiliser SMS)"
create_secret "MTN_KYC_SUBSCRIPTION_KEY" "" "Ocp-Apim-Subscription-Key (KYC)"

echo ""
echo "📢 MTN ADVERTISING (Publicités)"
create_secret "MTN_ADS_BASE_URL" "https://api.mtn.com" "URL de base Ads"
create_secret "MTN_ADS_CLIENT_ID" "" "Client ID Ads (peut réutiliser SMS)"
create_secret "MTN_ADS_CLIENT_SECRET" "" "Client Secret Ads (peut réutiliser SMS)"
create_secret "MTN_ADS_SUBSCRIPTION_KEY" "" "Ocp-Apim-Subscription-Key (Ads)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Configuration complète!"
echo ""
echo "📋 Vérifier les secrets créés:"
echo "   npx wrangler secrets-store secret list $STORE_ID --remote"
echo ""
echo "📚 Prochaines étapes:"
echo "   1. Mettre à jour wrangler.toml pour lier les secrets aux Workers"
echo "   2. Redéployer: wrangler deploy"
echo ""
