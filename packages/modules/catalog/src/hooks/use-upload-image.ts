"use client";

import { useState } from "react";
import { createClient } from "@kbouffe/module-core/ui";

export function useUploadImage() {
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase!.storage
        .from("images")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase!.storage.from("images").getPublicUrl(filePath);

      return { url: data.publicUrl };
    } catch (error) {
      console.error("Erreur upload:", error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading };
}
