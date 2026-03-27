let sodiumInstance: {
    crypto_generichash: (hashLength: number, message: Uint8Array, key: null) => Uint8Array;
} | null = null;

async function getSodium() {
    if (sodiumInstance) return sodiumInstance;
    const sodium = await import("libsodium-wrappers");
    await sodium.default.ready;
    sodiumInstance = sodium.default as unknown as {
        crypto_generichash: (hashLength: number, message: Uint8Array, key: null) => Uint8Array;
    };
    return sodiumInstance;
}

function toHex(bytes: Uint8Array): string {
    return Array.from(bytes)
        .map((value) => value.toString(16).padStart(2, "0"))
        .join("");
}

export async function fileFingerprintHex(file: File, size = 16): Promise<string> {
    const sodium = await getSodium();
    const input = new Uint8Array(await file.arrayBuffer());
    const digest = sodium.crypto_generichash(size, input, null);
    return toHex(digest);
}
