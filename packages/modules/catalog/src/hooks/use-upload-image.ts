"use client";

import { useState } from "react";

export function useUploadImage() {
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de l'upload");
      }

      const data = await response.json();
      return { url: data.url };
    } catch (error) {
      console.error("Erreur upload:", error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading };
}
