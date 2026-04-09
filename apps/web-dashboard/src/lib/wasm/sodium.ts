// Uses the native Web Crypto API (crypto.subtle) — available in browsers and Cloudflare Workers.
// Replaces libsodium-wrappers to avoid bundling a 900 KB WASM library.

export async function fileFingerprintHex(file: File, size = 16): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hex = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    // Truncate to requested byte count (same as former sodium.crypto_generichash truncation)
    return hex.slice(0, size * 2);
}
