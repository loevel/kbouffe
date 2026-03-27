export interface CompressedImageResult {
    file: File;
    originalSize: number;
    compressedSize: number;
    usedWasm: boolean;
}

interface CompressOptions {
    maxWidth?: number;
    webpQuality?: number;
}

export async function compressImageForUpload(
    file: File,
    options: CompressOptions = {}
): Promise<CompressedImageResult> {
    const maxWidth = options.maxWidth ?? 1600;
    const webpQuality = options.webpQuality ?? 72;

    const originalSize = file.size;
    if (!file.type.startsWith("image/")) {
        return {
            file,
            originalSize,
            compressedSize: originalSize,
            usedWasm: false,
        };
    }

    try {
        const imageBitmap = await createImageBitmap(file);
        const ratio = imageBitmap.width > maxWidth ? maxWidth / imageBitmap.width : 1;
        const targetWidth = Math.max(1, Math.round(imageBitmap.width * ratio));
        const targetHeight = Math.max(1, Math.round(imageBitmap.height * ratio));

        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const context = canvas.getContext("2d");
        if (!context) {
            return {
                file,
                originalSize,
                compressedSize: originalSize,
                usedWasm: false,
            };
        }

        context.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);
        imageBitmap.close();

        const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, "image/webp", Math.max(0.1, Math.min(1, webpQuality / 100)));
        });

        if (!blob) {
            return {
                file,
                originalSize,
                compressedSize: originalSize,
                usedWasm: false,
            };
        }

        const compressed = new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), {
            type: "image/webp",
        });

        if (compressed.size >= originalSize) {
            return {
                file,
                originalSize,
                compressedSize: originalSize,
                usedWasm: false,
            };
        }

        return {
            file: compressed,
            originalSize,
            compressedSize: compressed.size,
            usedWasm: false,
        };
    } catch {
        return {
            file,
            originalSize,
            compressedSize: originalSize,
            usedWasm: false,
        };
    }
}
