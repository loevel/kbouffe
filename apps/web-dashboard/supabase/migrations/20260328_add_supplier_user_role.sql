-- ================================================================
-- Migration : Ajout du rôle 'supplier' dans l'enum user_role
-- ================================================================
-- Contexte :
--   L'inscription fournisseur (agriculteur) envoie role="supplier"
--   mais l'enum user_role ne contient que 'merchant' et 'customer'.
--   Le trigger handle_new_user échoue → "Database error creating new user".
-- ================================================================

-- Ajouter 'supplier' à l'enum user_role
-- (ALTER TYPE ADD VALUE ne peut pas être exécuté dans une transaction)
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'supplier';

-- Ajouter 'admin' aussi pour être complet (utilisé dans le code mais absent de l'enum)
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'admin';

-- ================================================================
-- Mettre à jour le trigger handle_new_user pour gérer le rôle
-- 'supplier' : pas de restaurant à créer, juste le profil user.
-- Pas de changement fonctionnel nécessaire — le trigger crée déjà
-- correctement les profils pour tout rôle non-merchant.
-- ================================================================
