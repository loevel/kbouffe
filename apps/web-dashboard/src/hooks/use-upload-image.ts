"use client";

import { useState } from "react";
import { compressImageForUpload } from "@/lib/wasm/squoosh";
import { fileFingerprintHex } from "@/lib/wasm/sodium";

import { authFetch } from "@kbouffe/module-core/ui";

interface UploadResult {
    url: string;
    key: string;
}

export function useUploadImage() {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function upload(file: File): Promise<UploadResult | null> {
        setUploading(true);
        setError(null);

        try {
            const { file: optimizedFile } = await compressImageForUpload(file);
            const fingerprint = await fileFingerprintHex(optimizedFile);

            const formData = new FormData();
            formData.append("file", optimizedFile);

            const res = await authFetch("/api/upload", {
                method: "POST",
                body: formData,
                headers: {
                    "x-file-fingerprint": fingerprint,
                },
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Erreur d'upload");
            }

            return await res.json();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur inconnue");
            return null;
        } finally {
            setUploading(false);
        }
    }

    return { upload, uploading, error };
}
