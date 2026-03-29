-- Bucket public pour les images (produits fournisseurs, menus, photos plats)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  8388608,  -- 8 Mo
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO NOTHING;

-- Lecture publique (URLs publiques directes)
CREATE POLICY "images_public_select"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

-- Upload uniquement par les utilisateurs authentifiés
CREATE POLICY "images_auth_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

-- Mise à jour uniquement par le propriétaire (le dossier = user_id)
CREATE POLICY "images_owner_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Suppression uniquement par le propriétaire
CREATE POLICY "images_owner_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);
