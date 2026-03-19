"use client";

import { useState } from "react";

export function useUploadImage() {
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      console.log("[useUploadImage] Début upload:", { fileName: file.name, fileSize: file.size, fileType: file.type });

      const formData = new FormData();
      formData.append("file", file);

      // Use the API server that has Cloudflare R2 access (with fallback)
      const uploadUrl = process.env.NEXT_PUBLIC_API_URL
        ? `${process.env.NEXT_PUBLIC_API_URL}/upload`
        : "/api/upload";

      console.log("[useUploadImage] Upload URL:", uploadUrl);

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
        credentials: "include", // Include cookies for authentication
      });

      console.log("[useUploadImage] Réponse API:", { status: response.status, ok: response.ok });

      if (!response.ok) {
        let errorMessage = "Erreur lors de l'upload";
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
          console.error("[useUploadImage] Erreur API:", { status: response.status, error: data.error });
        } catch (parseErr) {
          const text = await response.text();
          console.error("[useUploadImage] Erreur réponse non-JSON:", { status: response.status, text });
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("[useUploadImage] Upload réussi:", { url: data.url });
      return { url: data.url };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("[useUploadImage] Exception:", errorMsg);
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading };
}
