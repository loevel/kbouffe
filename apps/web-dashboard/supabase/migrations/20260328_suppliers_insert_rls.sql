-- Migration : Ajout de la politique RLS INSERT sur la table suppliers
-- Appliquée le 2026-03-28 via Supabase MCP (execute_sql)
--
-- Problème : La table suppliers avait RLS activé mais aucune policy INSERT.
-- Un utilisateur authentifié ne pouvait donc pas créer son profil fournisseur.
-- L'API retournait une erreur 500 "Erreur lors de l'inscription".
--
-- Fix : Permettre à un utilisateur authentifié d'insérer un supplier
--       uniquement si user_id correspond à son propre auth.uid().

CREATE POLICY "suppliers_insert_own"
ON public.suppliers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
